import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { encodeQr, qrPath } from "@/lib/qr";

/**
 * The QR encoder, checked by reading its own symbols back.
 *
 * A QR code is the one thing in this codebase a human cannot review by
 * looking at it: a wrong mask, a wrong interleave or an off-by-one in the
 * zigzag all produce a plausible-looking square of noise, and the defect only
 * surfaces when a patient points a phone at a printed card and nothing
 * happens. So these tests do not assert "it rendered" — they take the matrix
 * apart the way a scanner does and assert the bytes come back.
 *
 * Three independent checks, because each catches a different class of error:
 *
 *   1. **Round trip.** Undo the mask, walk the zigzag, de-interleave, strip
 *      the padding — and get the original string. Catches placement, masking
 *      and block-splitting mistakes.
 *   2. **Syndromes.** Every Reed–Solomon block evaluated at α⁰…α^(ec−1) must
 *      be zero. Catches parity mistakes, which the round trip cannot see
 *      because a reader that never corrects never looks at the parity.
 *   3. **The two BCH strings**, against the constants printed in the spec.
 *      Catches a generator polynomial typo, which would make every symbol
 *      undecodable while still round-tripping here.
 */

/* --------------------------------------------------------------- GF(256) */

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

/* --------------------------------------------------------- the spec table */

/** Mirrors the encoder's table. Written out again on purpose: a test that
    imports the table it is checking cannot catch a wrong row. */
const VERSIONS = {
  1: { ec: 10, g1: 1, d1: 16, g2: 0, d2: 0 },
  2: { ec: 16, g1: 1, d1: 28, g2: 0, d2: 0 },
  3: { ec: 26, g1: 1, d1: 44, g2: 0, d2: 0 },
  4: { ec: 18, g1: 2, d1: 32, g2: 0, d2: 0 },
  5: { ec: 24, g1: 2, d1: 43, g2: 0, d2: 0 },
  6: { ec: 16, g1: 4, d1: 27, g2: 0, d2: 0 },
  7: { ec: 18, g1: 4, d1: 31, g2: 0, d2: 0 },
  8: { ec: 22, g1: 2, d1: 38, g2: 2, d2: 39 },
  9: { ec: 22, g1: 3, d1: 36, g2: 2, d2: 37 },
  10: { ec: 26, g1: 4, d1: 43, g2: 1, d2: 44 },
  11: { ec: 30, g1: 1, d1: 50, g2: 4, d2: 51 },
  12: { ec: 22, g1: 6, d1: 36, g2: 2, d2: 37 },
  13: { ec: 22, g1: 8, d1: 37, g2: 1, d2: 38 },
  14: { ec: 24, g1: 4, d1: 40, g2: 5, d2: 41 },
  15: { ec: 24, g1: 5, d1: 41, g2: 5, d2: 42 },
};

/** Total codewords per version, from the spec — the sum has to agree. */
const TOTAL_CODEWORDS = {
  1: 26, 2: 44, 3: 70, 4: 100, 5: 134, 6: 172, 7: 196, 8: 242,
  9: 292, 10: 346, 11: 404, 12: 466, 13: 532, 14: 581, 15: 655,
};

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

const ALIGNMENT = {
  1: [], 2: [6, 18], 3: [6, 22], 4: [6, 26], 5: [6, 30], 6: [6, 34],
  7: [6, 22, 38], 8: [6, 24, 42], 9: [6, 26, 46], 10: [6, 28, 50],
  11: [6, 30, 54], 12: [6, 32, 58], 13: [6, 34, 62],
  14: [6, 26, 46, 66], 15: [6, 26, 48, 70],
};

/* ------------------------------------------------------------- a decoder */

/** The function-module map a scanner reconstructs from the version alone. */
const functionMap = (version, size) => {
  const reserved = Array.from({ length: size }, () => new Array(size).fill(false));
  const mark = (col, row) => {
    if (col >= 0 && col < size && row >= 0 && row < size) reserved[row][col] = true;
  };

  const finder = (col, row) => {
    for (let dy = -4; dy <= 4; dy += 1) {
      for (let dx = -4; dx <= 4; dx += 1) mark(col + dx, row + dy);
    }
  };
  finder(3, 3);
  finder(size - 4, 3);
  finder(3, size - 4);

  for (let i = 8; i < size - 8; i += 1) {
    mark(6, i);
    mark(i, 6);
  }

  const centres = ALIGNMENT[version];
  centres.forEach((row) => {
    centres.forEach((col) => {
      const corner =
        (row === 6 && col === 6) ||
        (row === 6 && col === size - 7) ||
        (row === size - 7 && col === 6);
      if (corner) return;
      for (let dy = -2; dy <= 2; dy += 1) {
        for (let dx = -2; dx <= 2; dx += 1) mark(col + dx, row + dy);
      }
    });
  });

  for (let i = 0; i < 9; i += 1) {
    if (i !== 6) {
      mark(8, i);
      mark(i, 8);
    }
  }
  for (let i = 0; i < 8; i += 1) {
    mark(size - 1 - i, 8);
    mark(8, size - 8 + i);
  }
  mark(8, size - 8);

  if (version >= 7) {
    for (let i = 0; i < 18; i += 1) {
      const a = size - 11 + (i % 3);
      const b = Math.floor(i / 3);
      mark(a, b);
      mark(b, a);
    }
  }
  return reserved;
};

/** Read the format string back and recover the mask it was written with. */
const readFormat = (modules, size) => {
  let bits = 0;
  const read = (col, row) => (modules[row][col] ? 1 : 0);
  for (let i = 0; i <= 5; i += 1) bits |= read(8, i) << i;
  bits |= read(8, 7) << 6;
  bits |= read(8, 8) << 7;
  bits |= read(7, 8) << 8;
  for (let i = 9; i < 15; i += 1) bits |= read(14 - i, 8) << i;

  const unmasked = bits ^ 0x5412;
  return { ecBits: (unmasked >>> 13) & 0b11, mask: (unmasked >>> 10) & 0b111 };
};

/** Walk the zigzag and pull the interleaved codewords back out. */
const readCodewords = (modules, size, version, mask, reserved) => {
  const bits = [];
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5;
    for (let vert = 0; vert < size; vert += 1) {
      for (let j = 0; j < 2; j += 1) {
        const col = right - j;
        const upward = ((right + 1) & 2) === 0;
        const row = upward ? size - 1 - vert : vert;
        if (reserved[row][col]) continue;
        const masked = MASKS[mask](row, col);
        bits.push(modules[row][col] !== masked ? 1 : 0);
      }
    }
  }

  const words = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    let byte = 0;
    for (let j = 0; j < 8; j += 1) byte = (byte << 1) | bits[i + j];
    words.push(byte);
  }
  return words.slice(0, TOTAL_CODEWORDS[version]);
};

/** Undo the interleave, returning [dataBlocks, ecBlocks]. */
const deinterleave = (codewords, version) => {
  const spec = VERSIONS[version];
  const sizes = [
    ...Array.from({ length: spec.g1 }, () => spec.d1),
    ...Array.from({ length: spec.g2 }, () => spec.d2),
  ];
  const data = sizes.map(() => []);
  let at = 0;
  const longest = Math.max(...sizes);
  for (let i = 0; i < longest; i += 1) {
    sizes.forEach((length, block) => {
      if (i < length) data[block].push(codewords[at++]);
    });
  }
  const ec = sizes.map(() => []);
  for (let i = 0; i < spec.ec; i += 1) {
    sizes.forEach((_, block) => ec[block].push(codewords[at++]));
  }
  return [data, ec];
};

/** Strip the mode indicator, length and padding back to the original text. */
const readPayload = (dataBlocks, version) => {
  const stream = dataBlocks.flat();
  const bits = [];
  stream.forEach((byte) => {
    for (let i = 7; i >= 0; i -= 1) bits.push((byte >>> i) & 1);
  });
  const take = (at, length) => {
    let value = 0;
    for (let i = 0; i < length; i += 1) value = (value << 1) | bits[at + i];
    return value;
  };

  assert.equal(take(0, 4), 0b0100, "byte mode indicator");
  const countBits = version < 10 ? 8 : 16;
  const length = take(4, countBits);
  const bytes = [];
  for (let i = 0; i < length; i += 1) bytes.push(take(4 + countBits + i * 8, 8));
  return new TextDecoder().decode(Uint8Array.from(bytes));
};

/* ------------------------------------------------------------- the tests */

const SAMPLES = [
  "A",
  "https://odenta.app/card/9f2c",
  "https://odenta.test/card/2684752876055422-7f3ab19c4d",
  /* A realistic share link with a long token and a query string. */
  `https://odenta.example.com/card/${"a1b2c3d4".repeat(6)}?ref=aiu-dental-clinic&v=2`,
  /* Something long enough to push past the 8-bit character count, i.e. into
     version 10 where the header itself changes shape. */
  `https://odenta.example.com/card/${"x".repeat(300)}`,
];

describe("the QR encoder", () => {
  it("round-trips every sample through its own matrix", () => {
    SAMPLES.forEach((text) => {
      const { version, size, modules } = encodeQr(text);
      assert.equal(size, version * 4 + 17, `${text.slice(0, 24)}: size`);

      const { ecBits, mask } = readFormat(modules, size);
      assert.equal(ecBits, 0b00, "error correction level M");
      assert.ok(mask >= 0 && mask <= 7, "a real mask pattern");

      const reserved = functionMap(version, size);
      const codewords = readCodewords(modules, size, version, mask, reserved);
      const [data] = deinterleave(codewords, version);
      assert.equal(readPayload(data, version), text);
    });
  });

  it("writes Reed–Solomon parity a reader can verify", () => {
    SAMPLES.forEach((text) => {
      const { version, size, modules } = encodeQr(text);
      const { mask } = readFormat(modules, size);
      const reserved = functionMap(version, size);
      const codewords = readCodewords(modules, size, version, mask, reserved);
      const [data, ec] = deinterleave(codewords, version);

      data.forEach((block, index) => {
        const full = [...block, ...ec[index]];
        /* A valid codeword has α⁰…α^(ec−1) as roots, so every syndrome is
           zero. One wrong parity byte makes at least one of them non-zero. */
        for (let s = 0; s < VERSIONS[version].ec; s += 1) {
          let value = 0;
          full.forEach((byte) => {
            value = mul(value, EXP[s]) ^ byte;
          });
          assert.equal(value, 0, `v${version} block ${index} syndrome ${s}`);
        }
      });
    });
  });

  it("agrees with the spec's own codeword totals", () => {
    Object.entries(VERSIONS).forEach(([version, spec]) => {
      const total =
        spec.ec * (spec.g1 + spec.g2) + spec.d1 * spec.g1 + spec.d2 * spec.g2;
      assert.equal(total, TOTAL_CODEWORDS[version], `version ${version} total`);
    });
  });

  it("writes the format strings the spec prints", () => {
    /* Level M, masks 0 through 7, straight out of ISO/IEC 18004 table C.1. */
    const EXPECTED = [
      "101010000010010",
      "101000100100101",
      "101111001111100",
      "101101101001011",
      "100010111111001",
      "100000011001110",
      "100111110010111",
      "100101010100000",
    ];
    EXPECTED.forEach((expected, mask) => {
      const { size, modules } = encodeQr(`mask probe ${mask}`);
      /* Read the strip verbatim rather than through `readFormat`, so a
         placement error shows up as a wrong string rather than being undone
         twice. */
      let bits = "";
      for (let i = 14; i >= 9; i -= 1) bits += modules[8][14 - i] ? "1" : "0";
      bits += modules[8][7] ? "1" : "0";
      bits += modules[8][8] ? "1" : "0";
      bits += modules[7][8] ? "1" : "0";
      for (let i = 5; i >= 0; i -= 1) bits += modules[i][8] ? "1" : "0";

      const { mask: used } = readFormat(modules, size);
      assert.equal(bits, EXPECTED[used], `mask ${used} format string`);
      assert.ok(EXPECTED.includes(bits), "a level-M format string");
    });
  });

  it("places the three finders and the always-dark module", () => {
    const { size, modules } = encodeQr("finders");
    [
      [0, 0],
      [0, size - 7],
      [size - 7, 0],
    ].forEach(([top, left]) => {
      for (let dy = 0; dy < 7; dy += 1) {
        for (let dx = 0; dx < 7; dx += 1) {
          const onRing = dy === 0 || dy === 6 || dx === 0 || dx === 6;
          const inCore = dy >= 2 && dy <= 4 && dx >= 2 && dx <= 4;
          assert.equal(
            modules[top + dy][left + dx],
            onRing || inCore,
            `finder at ${top},${left} module ${dy},${dx}`
          );
        }
      }
    });
    assert.equal(modules[size - 8][8], true, "the always-dark module");
  });

  it("frames the path with the four-module quiet zone", () => {
    const { size, extent, path } = qrPath("quiet zone");
    assert.equal(extent, size + 8);
    assert.ok(path.startsWith("M"), "an SVG path");
    assert.ok(path.includes("h1v1h-1z"), "one square per dark module");
  });

  it("refuses data it cannot encode rather than truncating it", () => {
    assert.throws(() => encodeQr("y".repeat(500)), /Too much data/);
  });
});
