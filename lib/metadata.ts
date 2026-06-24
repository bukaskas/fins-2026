import type { Metadata } from "next";

/**
 * Build per-page metadata with consistent Open Graph + Twitter tags.
 *
 * Next.js does NOT copy the page `title` into `openGraph.title`, and the root
 * `%s | Fins` template only applies to the `<title>` tag — so link previews
 * (WhatsApp/social) need OG/Twitter set explicitly. Centralizing it here keeps
 * every page's share preview correct and consistent.
 */
export function buildMetadata(opts: {
  title: string;
  description?: string;
  /** Path under /public, e.g. "/images/hero_images/dayuse_intro.webp". */
  image?: string;
  /** Route path, e.g. "/day-use/booking" — used for canonical + og:url. */
  path?: string;
}): Metadata {
  const { title, description, image, path } = opts;
  const images = image
    ? [{ url: image, width: 1200, height: 630, alt: title }]
    : undefined;

  return {
    title, // flows through the "%s | Fins" template for the <title> tag
    ...(description ? { description } : {}),
    ...(path ? { alternates: { canonical: path } } : {}),
    openGraph: {
      title, // raw page name; siteName supplies "Fins"
      ...(description ? { description } : {}),
      siteName: "Fins",
      type: "website",
      ...(path ? { url: path } : {}),
      ...(images ? { images } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      ...(description ? { description } : {}),
      ...(images ? { images } : {}),
    },
  };
}
