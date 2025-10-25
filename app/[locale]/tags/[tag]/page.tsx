import { fetchItems } from "@/lib/content";
import Listing from "../../(listing)/listing";
import { Suspense } from "react";

export const revalidate = 10;

/**
 * Single tag route - renders homepage with tag filter
 * /tags/[tag] shows all items filtered by the tag
 */
export default async function TagListing({
  params,
}: {
  params: Promise<{ tag: string; locale: string }>;
}) {
  const resolvedParams = await params;
  const { locale } = resolvedParams;

  // Fetch all items (filtering will be done client-side via FilterURLParser)
  const { categories, tags, items } = await fetchItems({ lang: locale });

  // Calculate pagination info
  const total = items.length;
  const page = 1;
  const start = 0;
  const basePath = `/`; // Use root path for filter URL generation

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Listing
        categories={categories}
        tags={tags}
        items={items}
        total={total}
        start={start}
        page={page}
        basePath={basePath}
      />
    </Suspense>
  );
}
