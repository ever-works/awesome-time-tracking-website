import { Button, cn } from "@heroui/react";
import { usePathname } from "@/i18n/navigation";
import { TagsProps } from "../../types";
import { TagsList } from "./tags-list";
import { useStickyHeader } from "../../hooks/use-sticky-header";
import { useTagVisibility } from "../../hooks/use-tag-visibility";

/**
 * Main tags section component
 * Handles sticky behavior and tag visibility
 */
export function Tags({
  tags,
  basePath,
  resetPath,
  enableSticky = false,
  maxVisibleTags,
  total,
}: TagsProps) {
  const pathname = usePathname();
  const { isSticky } = useStickyHeader({ enableSticky });
  const {
    showAllTags,
    visibleTags,
    hasMoreTags,
    toggleTagVisibility,
  } = useTagVisibility(tags, maxVisibleTags);

  const isAnyTagActive = tags.some((tag) => {
    const tagBasePath = basePath
      ? `${basePath}/${tag.id}`
      : `/tags/${tag.id}`;
    return pathname.startsWith(encodeURI(tagBasePath));
  });

  return (
    <div
      className={cn(
        "p-4 transition-all duration-300",
        enableSticky
          ? cn(
              "sticky top-4 z-10",
              isSticky
                ? "bg-white/95 dark:bg-gray-800/95 shadow-md backdrop-blur-sm"
                : "bg-transparent"
            )
          : "bg-inherit"
      )}
    >
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
          <h3
            className={cn(
              "text-lg font-bold transition-colors duration-300",
              isSticky
                ? "text-theme-primary dark:text-theme-primary"
                : "text-gray-900 dark:text-white"
            )}
          >
            Tags
          </h3>
          {hasMoreTags && (
            <Button
              variant="flat"
              radius="full"
              size="sm"
              className={cn(
                "px-4 py-1 font-medium transition-all duration-300 bg-theme-primary-10 text-theme-primary",
                isSticky && "shadow-sm"
              )}
              onPress={toggleTagVisibility}
            >
              {showAllTags ? (
                <>
                  <span className="hidden sm:inline">Show as single row</span>
                  <span className="sm:hidden">Single row</span>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    className="ml-1.5 transition-transform group-hover:-translate-y-0.5 dark:text-default-300"
                  >
                    <path
                      d="M3 10h18M3 14h18"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </>
              ) : (
                <>
                  <span className="hidden sm:inline">
                    Show all {tags.length} tags
                  </span>
                  <span className="sm:hidden">All tags</span>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    className="ml-1.5 transition-transform group-hover:translate-y-0.5 dark:text-default-300"
                  >
                    <path
                      d="M4 4h16v7H4V4zm0 9h16v7H4v-7z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </>
              )}
            </Button>
          )}
        </div>
        
        <TagsList
          tags={tags}
          basePath={basePath}
          resetPath={resetPath}
          total={total}
          showAllTags={showAllTags}
          visibleTags={visibleTags}
          isAnyTagActive={isAnyTagActive}
        />
      </div>
    </div>
  );
} 