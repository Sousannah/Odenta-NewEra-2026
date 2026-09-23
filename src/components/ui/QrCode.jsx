import { useMemo } from "react";
import { cn } from "@/lib/cn";
import { qrPath } from "@/lib/qr";

/**
 * A QR symbol as one inline SVG.
 *
 * One `<path>` rather than a rect per module: a busy symbol is a few thousand
 * modules, and a page of twelve patient cards would otherwise put tens of
 * thousands of nodes in the document. It also means the whole thing scales to
 * any size without resampling, which matters because the two places this is
 * used are a phone screen and a printed card.
 *
 * `title` is what a screen reader announces — a QR code with no text
 * alternative is a dead end for anybody who cannot point a camera at it, so
 * the caller is expected to render the link near it as well.
 */
export function QrCode({ value, size = 180, title = "QR code", className }) {
  const symbol = useMemo(() => {
    try {
      return qrPath(value ?? "");
    } catch {
      /* Only happens past ~400 characters, which no link in the portal
         reaches. Rendering nothing beats rendering a square that does not
         scan. */
      return null;
    }
  }, [value]);

  if (!symbol) return null;

  return (
    <svg
      role="img"
      aria-label={title}
      viewBox={`0 0 ${symbol.extent} ${symbol.extent}`}
      width={size}
      height={size}
      shapeRendering="crispEdges"
      className={cn("rounded-xl bg-white", className)}
    >
      <title>{title}</title>
      <rect width={symbol.extent} height={symbol.extent} fill="#ffffff" />
      <path d={symbol.path} fill="#0F2E3D" />
    </svg>
  );
}

/**
 * The same symbol as a standalone SVG document, for download.
 *
 * Kept next to the component because the two have to agree on the quiet zone
 * and the colours — a downloaded QR that differs from the one on screen is a
 * support ticket waiting to happen.
 */
export function qrSvgDocument(value, { scale = 8 } = {}) {
  const symbol = qrPath(value ?? "");
  const px = symbol.extent * scale;
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${px}" height="${px}"`,
    ` viewBox="0 0 ${symbol.extent} ${symbol.extent}" shape-rendering="crispEdges">`,
    `<rect width="${symbol.extent}" height="${symbol.extent}" fill="#ffffff"/>`,
    `<path d="${symbol.path}" fill="#0F2E3D"/>`,
    "</svg>",
  ].join("");
}
