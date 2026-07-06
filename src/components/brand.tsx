import Link from "next/link";

// The Sage leaf mark: a cream leaf on a sage badge.
export function LeafMark({ size = 32 }: { size?: number }) {
  const glyph = Math.round(size * 0.56);
  return (
    <span
      className="grid place-items-center rounded-xl bg-sage-600 text-cream shadow-sm"
      style={{ height: size, width: size }}
    >
      <svg
        width={glyph}
        height={glyph}
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M19.5 4.5C10.5 4.5 5 9.4 5 15.4c0 1.7.6 3.2 1.6 4.4C7.4 13.7 11.3 9 18 6.4c-3.4 3-6.4 5.4-9.9 12.6.9.3 1.9.5 3 .5 6.3 0 8.4-8.6 8.4-15Z"
          fill="currentColor"
        />
      </svg>
    </span>
  );
}

// Clickable wordmark used in headers. Defaults to linking home.
export function Wordmark({
  href = "/",
  size = 32,
}: {
  href?: string;
  size?: number;
}) {
  return (
    <Link href={href} className="flex items-center gap-2.5">
      <LeafMark size={size} />
      <span className="font-display text-lg font-semibold tracking-tight text-ink">
        Sage
      </span>
    </Link>
  );
}
