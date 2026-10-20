import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

// The gallery page is an async server component, so it is rendered to static
// markup rather than mounted. `next/image` and `next/link` are stubbed —
// the test is about the page's structure, not about Next's rendering.

vi.mock("next/image", () => ({
  default: ({
    alt,
    src,
    className,
  }: {
    alt: string;
    src: string;
    className?: string;
  }) => (
    // eslint-disable-next-line @next/next/no-img-element -- a stub, not app code
    <img alt={alt} src={src} className={className} />
  ),
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    className,
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

vi.mock("@/lib/settings", () => ({
  getCurrentUserSettings: async () => ({ language: "en" }),
}));

import GalleryPage from "../app/(lobby)/gallery/page";

async function renderGallery(): Promise<string> {
  return renderToStaticMarkup(await GalleryPage());
}

describe("the gallery page", () => {
  it("shows the life areas we have", async () => {
    const html = await renderGallery();

    expect(html).toContain("Sichuan University");
    expect(html).toContain("Chinese");
  });

  it("links the Sichuan University card to /university", async () => {
    const html = await renderGallery();

    expect(html).toContain('href="/university"');
  });

  it("links the Chinese card to /chinese-hub", async () => {
    const html = await renderGallery();

    expect(html).toContain('href="/chinese-hub"');
  });

  it("renders the not-yet-created tile without a link", async () => {
    const html = await renderGallery();

    expect(html).toContain("Coming soon");
    // Two life areas are links; the "coming soon" tile is a plain card.
    expect(html.match(/<a href=/g) ?? []).toHaveLength(2);
  });

  it("renders the localised title", async () => {
    const html = await renderGallery();

    expect(html).toContain("Gallery");
  });
});
