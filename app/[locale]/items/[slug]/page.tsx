import { fetchItem, fetchSimilarItems } from "@/lib/content";
import { notFound } from "next/navigation";
import { getCategoriesName } from "@/lib/utils";
import { getTranslations } from "next-intl/server";
import { ItemDetail } from "@/components/item-detail";
import { ServerItemContent } from "@/components/item-detail/server-item-content";
import { Container } from "@/components/ui/container";
import { Suspense } from "react";

// Disable static generation to prevent MDX compilation errors during build
export const dynamic = 'force-dynamic';

// Remove generateStaticParams to prevent build-time MDX compilation
// export async function generateStaticParams() {
//   const params = LOCALES.map(async (locale) => {
//     try {
//       const { items } = await fetchItems({ lang: locale });
//       return items.map((item) => ({ slug: item.slug, locale }));
//     } catch (error) {
//       console.error(`Failed to generate static params for locale ${locale}:`, error);
//       return [];
//     }
//   });

//   return (await Promise.all(params)).flat();
// }

export default async function ItemDetails({
  params,
}: {
  params: Promise<{ slug: string; locale: string }>;
}) {
  const { slug, locale } = await params;

  try {
    const item = await fetchItem(slug, { lang: locale });

    if (!item) {
      return notFound();
    }

    const t = await getTranslations("common");

    const { meta, content } = item;
    const categoryName = getCategoriesName(meta.category);
    const similarItems = await fetchSimilarItems(meta, 6, { lang: locale }).then((items) => items.flatMap((item) => item.item));


    const metaWithVideo = {
      ...meta,
      video_url: "", // e.g. https://www.youtube.com/watch?v=eDqfg_LexCQ,
      allItems: similarItems,
    };

    // Render the MDX content on the server
    const renderedContent = (
      <ServerItemContent 
        content={content} 
        noContentMessage={t("NO_CONTENT_PROVIDED")} 
      />
    );

    return (
      <Container maxWidth="7xl" padding="default">
        <Suspense fallback={<div>Loading...</div>}>
          <ItemDetail
            meta={metaWithVideo}
            renderedContent={renderedContent}
            categoryName={categoryName}
          />
        </Suspense>
      </Container>
    );
  } catch (error) {
    console.error(`Failed to load item ${slug} for locale ${locale}:`, error);
    return notFound();
  }
}
