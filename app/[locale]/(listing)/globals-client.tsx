"use client";
import { LayoutHome, useLayoutTheme } from "@/components/context";
import { Categories, Paginate, Tags } from "@/components/filters";
import { Tag, Category, ItemData } from "@/lib/content";
import { sortByNumericProperty } from "@/lib/utils";
import { totalPages } from "@/lib/paginate";
import { HomeTwoLayout, useHomeTwoLogic } from "@/components/home-two";
import { ListingClient } from "@/components/shared-card/listing-client";

type ListingProps = {
  total: number;
  start: number;
  page: number;
  basePath: string;
  categories: Category[];
  tags: Tag[];
  items: ItemData[];
};

export default function GlobalsClient(props: ListingProps) {
  const { layoutHome =LayoutHome.HOME_ONE } = useLayoutTheme();
  const homeTwoLogic = useHomeTwoLogic(props);
  const sortedTags = sortByNumericProperty(props.tags);
  const sortedCategories = sortByNumericProperty(props.categories);

  if (layoutHome === LayoutHome.HOME_ONE) {
    return (
      <div className="pb-12">
        <div className="flex flex-col md:flex-row w-full gap-5">
          <div className="md:sticky md:top-4 md:self-start">
            <Categories total={props.total} categories={sortedCategories} />
          </div>
          <div className="w-full">
            <Tags tags={sortedTags} enableSticky={true} maxVisibleTags={5} />
            <ListingClient {...props} />
            <div className="flex items-center justify-center">
              <Paginate
                basePath={props.basePath}
                initialPage={props.page}
                total={totalPages(props.items.length)}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <HomeTwoLayout
      {...props}
      categories={sortedCategories}
      tags={sortedTags}
      filteredAndSortedItems={homeTwoLogic.items}
      paginatedItems={homeTwoLogic.paginatedItems}
    />
  );
}
