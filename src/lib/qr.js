/**
 * A QR encoder, in about three hundred lines and no dependencies.
 *
 * Written rather than installed for one reason: the thing it encodes is a
 * link to a patient's card. Every QR package on npm is a transitive-dependency
 * surface around a pure function with no I/O, and a clinic's patient
 * identifiers are not a good place to take that trade. The algorithm is fixed
 * by ISO/IEC 18004 and has not changed since 2000, so there is nothing here to
 * keep up with.
 *
 * Scope is deliberately narrow — byte mode, error correction level M,
 * versions 1 to 15. That is up to 415 bytes, which is several times the
 * longest share link the portal can produce, and level M survives the ~15%
 * damage a card picks up in a wallet.
 *
 *   const { size, modules } = encodeQr("https://…");
 *   modules[row][col] === true  // a dark module
 */

/* --------------------------------------------------------------- GF(256) */

/**
 * Log and antilog tables over GF(2^8) with the QR primitive polynomial
 * x^8 + x^4 + x^3 + x^2 + 1 (0x11D). The exponent table is doubled so a
 * product's exponent never needs a modulo.
 */
const EXP = new Uint8Array(512);
const LOG = new Uint8Array(256);

for (let i = 0, x = 1; i < 255; i += 1) {
  EXP[i] = x;
  LOG[x] = i;
  x <<= 1;
  if (x & 0x100) x ^= 0x11d;
}
for (let i = 255; i < 512; i += 1) EXP[i] = EXP[i - 255];

const mul = (a, b) => (a === 0 || b === 0 ? 0 : EXP[LOG[a] + LOG[b]]);

const polyMul = (a, b) => {
  const out = new Array(a.length + b.length - 1).fill(0);
  for (let i = 0; i < a.length; i += 1) {
    for (let j = 0; j < b.length; j += 1) out[i + j] ^= mul(a[i], b[j]);
  }
  return out;
};

/** The Reed–Solomon generator polynomial (x−α⁰)(x−α¹)…, highest term first. */
const rsGenerator = (degree) => {
  let poly = [1];
  for (let i = 0; i < degree; i += 1) poly = polyMul(poly, [1, EXP[i]]);
  return poly;
};

/** The `degree` error-correction codewords for one block. */
const rsRemainder = (data, degree) => {
  const gen = rsGenerator(degree);
  const rest = new Array(degree).fill(0);
  data.forEach((byte) => {
    const factor = byte ^ rest.shift();
    rest.push(0);
    for (let i = 0; i < degree; i += 1) rest[i] ^= mul(gen[i + 1], factor);
  });
  return rest;
};

/* ------------------------------------------------------- the version table */

/**
 * Per version at error-correction level M: the codewords each block carries.
 *
 * `ec` is error-correction codewords per block; `g1`/`d1` and `g2`/`d2` are
 * the two block groups — most versions only use the first. Total codewords
 * always works out to ec × (g1 + g2) + d1 × g1 + d2 × g2.
 */
const VERSIONS = [
  null,
  { ec: 10, g1: 1, d1: 16, g2: 0, d2: 0 },
  { ec: 16, g1: 1, d1: 28, g2: 0, d2: 0 },
  { ec: 26, g1: 1, d1: 44, g2: 0, d2: 0 },
  { ec: 18, g1: 2, d1: 32, g2: 0, d2: 0 },
  { ec: 24, g1: 2, d1: 43, g2: 0, d2: 0 },
  { ec: 16, g1: 4, d1: 27, g2: 0, d2: 0 },
  { ec: 18, g1: 4, d1: 31, g2: 0, d2: 0 },
  { ec: 22, g1: 2, d1: 38, g2: 2, d2: 39 },
  { ec: 22, g1: 3, d1: 36, g2: 2, d2: 37 },
  { ec: 26, g1: 4, d1: 43, g2: 1, d2: 44 },
  { ec: 30, g1: 1, d1: 50, g2: 4, d2: 51 },
  { ec: 22, g1: 6, d1: 36, g2: 2, d2: 37 },
  { ec: 22, g1: 8, d1: 37, g2: 1, d2: 38 },
  { ec: 24, g1: 4, d1: 40, g2: 5, d2: 41 },
  { ec: 24, g1: 5, d1: 41, g2: 5, d2: 42 },
];

const MAX_VERSION = VERSIONS.length - 1;

/** Alignment-pattern centre coordinates, per version. */
const ALIGNMENT = [
  [],
  [],
  [6, 18],
  [6, 22],
  [6, 26],
  [6, 30],
  [6, 34],
  [6, 22, 38],
  [6, 24, 42],
  [6, 26, 46],
  [6, 28, 50],
  [6, 30, 54],
  [6, 32, 58],
  [6, 34, 62],
  [6, 26, 46, 66],
  [6, 26, 48, 70],
];

const dataCapacity = (version) => {
  const spec = VERSIONS[version];
  return spec.g1 * spec.d1 + spec.g2 * spec.d2;
};

/* ------------------------------------------------------------- bit stream */

const bitsFor = (text, version) => {
  const bytes = new TextEncoder().encode(text);
  const bits = [];
  const put = (value, length) => {
    for (let i = length - 1; i >= 0; i -= 1) bits.push((value >>> i) & 1);
  };

  put(0b0100, 4); // byte mode
  put(bytes.length, version < 10 ? 8 : 16);
  bytes.forEach((byte) => put(byte, 8));
  return bits;
};

/** The smallest version this text fits in, or null if it fits in none. */
const versionFor = (text) => {
  for (let version = 1; version <= MAX_VERSION; version += 1) {
    if (bitsFor(text, version).length <= dataCapacity(version) * 8) return version;
  }
  return null;
};

/** Message bits padded to the version's capacity, as codewords. */
const dataCodewords = (text, version) => {
  const capacity = dataCapacity(version) * 8;
  const bits = bitsFor(text, version);

  /* Terminator, then to a byte boundary, then the two alternating pad bytes
     the spec names. */
  for (let i = 0; i < 4 && bits.length < capacity; i += 1) bits.push(0);
  while (bits.length % 8) bits.push(0);

  const out = [];
  for (let i = 0; i < bits.length; i += 8) {
    let byte = 0;
    for (let j = 0; j < 8; j += 1) byte = (byte << 1) | bits[i + j];
    out.push(byte);
  }
  const PADS = [0xec, 0x11];
  while (out.length < capacity / 8) out.push(PADS[out.length % 2 === 0 ? 0 : 1]);
  return out;
};

/** Split into blocks, add error correction, interleave. */
const interleave = (data, version) => {
  const spec = VERSIONS[version];
  const blocks = [];
  let at = 0;
  for (let i = 0; i < spec.g1; i += 1) {
    blocks.push(data.slice(at, at + spec.d1));
    at += spec.d1;
  }
  for (let i = 0; i < spec.g2; i += 1) {
    blocks.push(data.slice(at, at + spec.d2));
    at += spec.d2;
  }

  const ecBlocks = blocks.map((block) => rsRemainder(block, spec.ec));
  const out = [];
  const longest = Math.max(...blocks.map((block) => block.length));
  for (let i = 0; i < longest; i += 1) {
    blocks.forEach((block) => {
      if (i < block.length) out.push(block[i]);
    });
  }
  for (let i = 0; i < spec.ec; i += 1) ecBlocks.forEach((block) => out.push(block[i]));
  return out;
};

/* ------------------------------------------------------------ BCH strings */

/** Format information: 5 data bits, BCH(15,5), masked with 0x5412. */
const formatBits = (mask) => {
  /* 0b00 is level M. The two EC bits sit above the three mask bits. */
  const data = (0b00 << 3) | mask;
  let rest = data;
  for (let i = 0; i < 10; i += 1) rest = (rest << 1) ^ ((rest >>> 9) * 0x537);
  return ((data << 10) | (rest & 0x3ff)) ^ 0x5412;
};

/** Version information: 6 data bits, Golay(18,6). Only used from version 7. */
const versionInfoBits = (version) => {
  let rest = version;
  for (let i = 0; i < 12; i += 1) rest = (rest << 1) ^ ((rest >>> 11) * 0x1f25);
  return (version << 12) | (rest & 0xfff);
};

/* ---------------------------------------------------------------- masking */

const MASKS = [
  (row, col) => (row + col) % 2 === 0,
  (row) => row % 2 === 0,
  (row, col) => col % 3 === 0,
  (row, col) => (row + col) % 3 === 0,
  (row, col) => (Math.floor(row / 2) + Math.floor(col / 3)) % 2 === 0,
  (row, col) => ((row * col) % 2) + ((row * col) % 3) === 0,
  (row, col) => (((row * col) % 2) + ((row * col) % 3)) % 2 === 0,
  (row, col) => (((row + col) % 2) + ((row * col) % 3)) % 2 === 0,
];

/** The four penalty rules, which decide which mask a reader will like most. */
const penalty = (modules, size) => {
  let score = 0;

  const runPenalty = (line) => {
    let run = 1;
    for (let i = 1; i <= line.length; i += 1) {
      if (i < line.length && line[i] === line[i - 1]) {
        run += 1;
        continue;
      }
      if (run >= 5) score += 3 + (run - 5);
      run = 1;
    }
  };

  /* Rule 3 looks for the finder-like 1:1:3:1:1 sequence with four light
     modules on either side, which is what actually confuses a scanner. */
  const FINDER = [true, false, true, true, true, false, true];
  const hasFinderLike = (line, at) => {
    for (let i = 0; i < 7; i += 1) if (line[at + i] !== FINDER[i]) return false;
    const before = line.slice(Math.max(0, at - 4), at);
    const after = line.slice(at + 7, at + 11);
    const clear = (part) => part.length >= 4 && part.every((cell) => !cell);
    return clear(before) || clear(after);
  };

  const lines = [];
  for (let row = 0; row < size; row += 1) lines.push(modules[row].slice());
  for (let col = 0; col < size; col += 1) {
    lines.push(modules.map((line) => line[col]));
  }
  lines.forEach((line) => {
    runPenalty(line);
    for (let at = 0; at + 7 <= line.length; at += 1) {
      if (hasFinderLike(line, at)) score += 40;
    }
  });

  /* Rule 2: every 2×2 block of one colour. */
  for (let row = 0; row < size - 1; row += 1) {
    for (let col = 0; col < size - 1; col += 1) {
      const cell = modules[row][col];
      if (
        cell === modules[row][col + 1] &&
        cell === modules[row + 1][col] &&
        cell === modules[row + 1][col + 1]
      ) {
        score += 3;
      }
    }
  }

  /* Rule 4: how far the dark ratio strays from half. */
  let dark = 0;
  for (let row = 0; row < size; row += 1) {
    for (let col = 0; col < size; col += 1) if (modules[row][col]) dark += 1;
  }
  const deviation = Math.abs((dark * 100) / (size * size) - 50);
  score += Math.floor(deviation / 5) * 10;

  return score;
};

/* ----------------------------------------------------------- the matrix */

/**
 * Encode `text` as a QR symbol.
 *
 * Returns `{ version, size, modules }` where `modules[row][col]` is true for a
 * dark module. Throws when the text is longer than version 15 at level M can
 * hold — the caller decides what to do about that, because a truncated QR is
 * worse than none.
 */
export function encodeQr(text) {
  const version = versionFor(String(text ?? ""));
  if (!version) {
    throw new Error("Too much data for a level-M QR code up to version 15.");
  }

  const size = version * 4 + 17;
  const modules = Array.from({ length: size }, () => new Array(size).fill(false));
  const reserved = Array.from({ length: size }, () => new Array(size).fill(false));

  const set = (col, row, dark) => {
    modules[row][col] = dark;
    reserved[row][col] = true;
  };

  /* ------------------------------------------------ the function patterns */

  const finder = (col, row) => {
    for (let dy = -4; dy <= 4; dy += 1) {
      for (let dx = -4; dx <= 4; dx += 1) {
        const x = col + dx;
        const y = row + dy;
        if (x < 0 || x >= size || y < 0 || y >= size) continue;
        const ring = Math.max(Math.abs(dx), Math.abs(dy));
        set(x, y, ring !== 2 && ring <= 3);
      }
    }
  };
  finder(3, 3);
  finder(size - 4, 3);
  finder(3, size - 4);

  /* Timing patterns run between the finders on row 6 and column 6. */
  for (let i = 8; i < size - 8; i += 1) {
    set(6, i, i % 2 === 0);
    set(i, 6, i % 2 === 0);
  }

  const centres = ALIGNMENT[version];
  centres.forEach((row) => {
    centres.forEach((col) => {
      /* The three corners already hold finders. */
      const corner =
        (row === 6 && col === 6) ||
        (row === 6 && col === size - 7) ||
        (row === size - 7 && col === 6);
      if (corner) return;
      for (let dy = -2; dy <= 2; dy += 1) {
        for (let dx = -2; dx <= 2; dx += 1) {
          set(col + dx, row + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
        }
      }
    });
  });

  /* Reserve the format strip; the real bits go on after masking. */
  for (let i = 0; i < 9; i += 1) {
    if (i !== 6) {
      set(8, i, false);
      set(i, 8, false);
    }
  }
  for (let i = 0; i < 8; i += 1) {
    set(size - 1 - i, 8, false);
    set(8, size - 8 + i, false);
  }
  set(8, size - 8, true); // the always-dark module

  if (version >= 7) {
    const bits = versionInfoBits(version);
    for (let i = 0; i < 18; i += 1) {
      const bit = ((bits >>> i) & 1) === 1;
      const a = size - 11 + (i % 3);
      const b = Math.floor(i / 3);
      set(a, b, bit);
      set(b, a, bit);
    }
  }

  /* --------------------------------------------------------- the payload */

  const codewords = interleave(dataCodewords(text, version), version);
  let bit = 0;
  for (let right = size - 1; right >= 1; right -= 2) {
    /* Column 6 is the vertical timing pattern, so the pair that would have
       straddled it shifts one left — and the *cursor* has to move with it,
       not just the column being read. Stepping `right` by two from an
       unshifted cursor visits column 4 twice and never reaches 0 and 1. */
    if (right === 6) right = 5;
    for (let vert = 0; vert < size; vert += 1) {
      for (let j = 0; j < 2; j += 1) {
        const col = right - j;
        const upward = ((right + 1) & 2) === 0;
        const row = upward ? size - 1 - vert : vert;
        if (reserved[row][col] || bit >= codewords.length * 8) continue;
        modules[row][col] = ((codewords[bit >>> 3] >>> (7 - (bit & 7))) & 1) === 1;
        bit += 1;
      }
    }
  }

  /* ------------------------------------------- pick the mask, then commit */

  let best = null;
  for (let mask = 0; mask < 8; mask += 1) {
    const candidate = modules.map((line, row) =>
      line.map((cell, col) => (reserved[row][col] ? cell : cell !== MASKS[mask](row, col)))
    );
    writeFormat(candidate, size, mask);
    const score = penalty(candidate, size);
    if (!best || score < best.score) best = { score, modules: candidate };
  }

  return { version, size, modules: best.modules };
}

/** The format string, written twice so either finder can be read alone. */
function writeFormat(modules, size, mask) {
  const bits = formatBits(mask);
  const bit = (index) => ((bits >>> index) & 1) === 1;
  const put = (col, row, dark) => {
    modules[row][col] = dark;
  };

  for (let i = 0; i <= 5; i += 1) put(8, i, bit(i));
  put(8, 7, bit(6));
  put(8, 8, bit(7));
  put(7, 8, bit(8));
  for (let i = 9; i < 15; i += 1) put(14 - i, 8, bit(i));

  for (let i = 0; i < 8; i += 1) put(size - 1 - i, 8, bit(i));
  for (let i = 8; i < 15; i += 1) put(8, size - 15 + i, bit(i));

  put(8, size - 8, true);
}

/**
 * The symbol as one SVG path, plus the viewBox that frames it.
 *
 * One path rather than a rect per module: a version-10 symbol is 3,500
 * modules, and 3,500 DOM nodes on a page of twelve cards is a scroll people
 * can feel. The four-module quiet zone is part of the spec — a QR printed
 * flush to a card edge does not scan.
 */
export function qrPath(text, { quietZone = 4 } = {}) {
  const { size, modules, version } = encodeQr(text);
  const parts = [];
  for (let row = 0; row < size; row += 1) {
    for (let col = 0; col < size; col += 1) {
      if (modules[row][col]) parts.push(`M${col + quietZone} ${row + quietZone}h1v1h-1z`);
    }
  }
  return { version, size, extent: size + quietZone * 2, path: parts.join("") };
}
