"use client";

import { Category, Tag } from "@/lib/content";
import {
  Accordion,
  AccordionItem,
  Button,
  cn,
  Pagination,
  Badge,
} from "@heroui/react";
import { useTranslations } from "next-intl";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { PropsWithChildren, useState } from "react";
import { Tooltip } from "@heroui/tooltip";

import Image from "next/image";

function BlockLink({
  href,
  isActive,
  children,
}: PropsWithChildren<{ href: string; isActive: boolean }>) {
  return (
    <Button
      className={cn(
        "text-dark--theme-700 dark:text-dark--theme-300 font-medium text-left justify-start items-center transition-colors",
        {
          "bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300 border-l-4 border-primary-500":
            isActive,
          "hover:text-dark--theme-100 dark:hover:bg-dark--theme-800": !isActive,
        }
      )}
      radius="md"
      variant="light"
      as={Link}
      href={href}
      fullWidth
    >
      {children}
    </Button>
  );
}

export function CategoriesList({
  categories,
  total,
}: {
  total: number;
  categories: Category[];
}) {
  const t = useTranslations("listing");
  const pathname = usePathname();

  return (
    <div className="space-y-1.5">
      <BlockLink
        isActive={pathname === "/" || pathname.startsWith("/discover")}
        href="/"
      >
        <div className="flex items-center justify-between w-full">
          <span className="font-medium text-dark--theme-900 dark:text-dark--theme-100">
            {t("ALL")}
          </span>
          <span className="font-medium text-sm text-dark--theme-900 dark:text-dark--theme-100">
            {total}
          </span>
        </div>
      </BlockLink>

      {categories.map((category) => {
        if (!category.count) return null;

        const href = `/categories/${category.id}`;
        const isActive = pathname.startsWith(encodeURI(href));

        return (
          <BlockLink isActive={isActive} key={category.id} href={href}>
            <div className="flex items-center justify-between w-full gap-2">
              <div className="flex items-center gap-2 min-w-0 max-w-[80%]">
                {category.icon_url && (
                  <Image
                    width={20}
                    height={20}
                    src={category.icon_url}
                    className={cn(
                      "w-5 h-5 transition-transform flex-shrink-0",
                      isActive ? "brightness-110 dark:brightness-125" : ""
                    )}
                    alt={category.name}
                  />
                )}
                <Tooltip
                  content={category.name}
                  showArrow
                  className="dark:bg-dark--theme-900"
                  placement="right"
                >
                  <div className="overflow-hidden text-dark--theme-900 dark:text-dark--theme-100">
                    <span className="font-medium whitespace-nowrap overflow-hidden text-ellipsis block w-full">
                      {category.name}
                    </span>
                  </div>
                </Tooltip>
              </div>
              <span
                className={cn(
                  "font-medium text-sm flex-shrink-0",
                  isActive
                    ? "text-primary-600 dark:text-primary-100 dark:text-dark--theme-100"
                    : "text-dark--theme-600 dark:text-dark--theme-100"
                )}
              >
                {category.count || 0}
              </span>
            </div>
          </BlockLink>
        );
      })}
    </div>
  );
}

export function Categories(props: { total: number; categories: Category[] }) {
  const t = useTranslations("listing");

  return (
    <>
      <div className="md:hidden">
        <Accordion variant="bordered" className="">
          <AccordionItem
            key="1"
            aria-label="Category"
            title={
              <div className="flex items-center gap-2">
                <span className="font-semibold text-dark--theme-800 dark:text-dark--theme-200">
                  {t("CATEGORIES")}
                </span>
              </div>
            }
          >
            <div className="flex flex-col gap-2 px-2">
              <CategoriesList {...props} />
            </div>
          </AccordionItem>
        </Accordion>
      </div>

      <div className="hidden md:flex flex-col w-full max-w-60 gap-3">
        <div className="flex items-center gap-2 mb-2">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-dark--theme-900 dark:text-dark--theme-200">
              {t("CATEGORIES")}
            </h2>
          </div>
          <Badge
            color="primary"
            variant="flat"
            size="sm"
            className="font-medium shadow-sm"
          >
            {props.total}
          </Badge>
        </div>
        <div className="text-dark--theme-600 dark:text-dark--theme-400 border border-dark--theme-100 dark:border-dark--theme-800 rounded-xl p-4">
          <CategoriesList {...props} />
        </div>
      </div>
    </>
  );
}

export function Paginate({
  basePath,
  initialPage,
  total,
}: {
  basePath: string;
  initialPage: number;
  total: number;
}) {
  const router = useRouter();

  function redirect(page: number) {
    const path = basePath + (page === 1 ? "" : `/${page}`);
    router.push(path);
  }

  return (
    <div className="flex flex-col items-center gap-4 mt-12 mb-8">
      <div className="flex items-center gap-3">
        <Pagination
          showControls
          total={total}
          initialPage={initialPage}
          onChange={redirect}
          radius="full"
          classNames={{
            wrapper: "gap-1",
            item: cn(
              "flex items-center justify-center h-8 w-8 rounded-full transition-colors",
              "hover:bg-dark--theme-100 dark:hover:bg-dark--theme-800 dark:bg-dark--theme-800 dark:hover:bg-dark--theme-700",
              "data-[hover=true]:bg-dark--theme-50 dark:data-[hover=true]:bg-dark--theme-800 data-[hover=true]:text-dark--theme-700 dark:data-[hover=true]:text-dark--theme-300 data-[hover=true]:font-medium"
            ),
            cursor: cn(
              "text-dark--theme-600 dark:text-dark--theme-400 transition-colors cursor-pointer hover:text-dark--theme-700 dark:hover:text-dark--theme-300 dark:bg-dark--theme-800 dark:hover:bg-dark--theme-700 data-[hover=true]:text-dark--theme-700 dark:data-[hover=true]:text-dark--theme-300 data-[hover=true]:font-medium"
            ),
            next: cn(
              "text-dark--theme-600 dark:text-dark--theme-400 hover:text-dark--theme-700 dark:hover:text-dark--theme-300 transition-colors cursor-pointer dark:bg-dark--theme-800 dark:hover:bg-dark--theme-700 data-[hover=true]:text-dark--theme-700 dark:data-[hover=true]:text-dark--theme-300 data-[hover=true]:font-medium"
            ),
            prev: cn(
              "text-dark--theme-600 dark:text-dark--theme-400 hover:text-dark--theme-700 dark:hover:text-dark--theme-300 transition-colors cursor-pointer dark:bg-dark--theme-800 dark:hover:bg-dark--theme-700 data-[hover=true]:text-dark--theme-700 dark:data-[hover=true]:text-dark--theme-300 data-[hover=true]:font-medium"
            ),
          }}
        />
      </div>
    </div>
  );
}

export function Tags(props: { tags: Tag[] }) {
  const pathname = usePathname();
  const [showAllTags, setShowAllTags] = useState(false);

  const MAX_VISIBLE_TAGS = 15;
  const hasMoreTags = props.tags.length > MAX_VISIBLE_TAGS;

  const renderTag = (tag: Tag, index: number) => {
    const isActive = pathname.startsWith(encodeURI(`/tags/${tag.id}`));
    return (
      <Button
        key={tag.id || index}
        variant={isActive ? "solid" : "bordered"}
        radius="full"
        size="sm"
        as={Link}
        prefetch={false}
        href={`/tags/${tag.id}`}
        className={cn(
          "px-3 py-1 h-8 font-medium transition-all duration-200",
          isActive
            ? "bg-primary-500 text-white border-primary-500 shadow-sm"
            : "border border-dark--theme-200 dark:border-dark--theme-800",
          "hover:shadow-md hover:border-primary-200 dark:hover:border-primary-800"
        )}
      >
        {tag.icon_url && (
          <Image
            width={20}
            height={20}
            src={tag.icon_url}
            className={cn(
              "w-4 h-4 mr-1.5 transition-transform",
              isActive ? "brightness-200" : ""
            )}
            alt={tag.name}
          />
        )}
        <span>{tag.name}</span>
        {tag.count && (
          <span
            className={cn(
              "ml-1.5 text-xs font-normal",
              isActive ? "text-white" : "text-dark-500 dark:text-dark-400"
            )}
          >
            ({tag.count})
          </span>
        )}
      </Button>
    );
  };

  return (
    <div className="relative mb-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-bold text-default-900">Tags</h3>
        {hasMoreTags && (
          <Button
            variant="light"
            color="primary"
            size="sm"
            className="px-2 py-0 h-6 font-medium text-xs"
            onPress={() => setShowAllTags(!showAllTags)}
          >
            {showAllTags ? "Show less" : "Show all"}
          </Button>
        )}
      </div>

      <div className="relative">
        <div
          className={cn(
            "w-full flex gap-2 flex-wrap",
            !showAllTags && "max-h-[120px] overflow-hidden"
          )}
        >
          {props.tags.map(renderTag)}
        </div>
      </div>

      {hasMoreTags && (
        <div className="flex justify-center mt-3">
          <Button
            variant="flat"
            color="primary"
            radius="full"
            size="sm"
            className="px-4 py-1 font-medium shadow-sm group"
            onPress={() => setShowAllTags(!showAllTags)}
          >
            {showAllTags ? (
              <>
                <span>Show less</span>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  className="ml-1.5 transition-transform group-hover:-translate-y-0.5 dark:text-default-300 "
                >
                  <path
                    d="M18 15L12 9L6 15"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </>
            ) : (
              <>
                <span>Show all {props.tags.length} tags</span>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  className="ml-1.5 transition-transform group-hover:translate-y-0.5 dark:text-default-300"
                >
                  <path
                    d="M6 9L12 15L18 9"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
