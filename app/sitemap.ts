import { MetadataRoute } from "next";
import { fetchItems } from "@/lib/content";

// Types
interface RouteConfig {
  path: string;
  priority: number;
  changeFrequency: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
}

interface SitemapEntry {
  url: string;
  lastModified: Date;
  changeFrequency: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority: number;
}

// Constants
const DEFAULT_PRIORITIES = {
  HOME: 1.0,
  MAIN: 0.9,
  SECONDARY: 0.8,
  TERTIARY: 0.7,
  LOW: 0.5,
} as const

const DEFAULT_CHANGE_FREQUENCIES = {
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
} as const

const DEFAULT_BASE_URL = 'https://ever.works'

// Configuration
const STATIC_ROUTES: RouteConfig[] = [
  { 
    path: '', 
    priority: DEFAULT_PRIORITIES.HOME, 
    changeFrequency: DEFAULT_CHANGE_FREQUENCIES.DAILY 
  },
  { 
    path: '/about', 
    priority: DEFAULT_PRIORITIES.SECONDARY, 
    changeFrequency: DEFAULT_CHANGE_FREQUENCIES.WEEKLY 
  },
  { 
    path: '/contact', 
    priority: DEFAULT_PRIORITIES.SECONDARY, 
    changeFrequency: DEFAULT_CHANGE_FREQUENCIES.WEEKLY 
  },
  { 
    path: '/help', 
    priority: DEFAULT_PRIORITIES.MAIN, 
    changeFrequency: DEFAULT_CHANGE_FREQUENCIES.WEEKLY 
  },
  { 
    path: '/pricing', 
    priority: DEFAULT_PRIORITIES.MAIN, 
    changeFrequency: DEFAULT_CHANGE_FREQUENCIES.WEEKLY 
  },
  { 
    path: '/blog', 
    priority: DEFAULT_PRIORITIES.SECONDARY, 
    changeFrequency: DEFAULT_CHANGE_FREQUENCIES.DAILY 
  },
  { 
    path: '/settings', 
    priority: DEFAULT_PRIORITIES.LOW, 
    changeFrequency: DEFAULT_CHANGE_FREQUENCIES.MONTHLY 
  },
  { 
    path: '/categories', 
    priority: DEFAULT_PRIORITIES.MAIN, 
    changeFrequency: DEFAULT_CHANGE_FREQUENCIES.DAILY 
  },
  { 
    path: '/tags', 
    priority: DEFAULT_PRIORITIES.MAIN, 
    changeFrequency: DEFAULT_CHANGE_FREQUENCIES.DAILY 
  },
  { 
    path: '/submit', 
    priority: DEFAULT_PRIORITIES.TERTIARY, 
    changeFrequency: DEFAULT_CHANGE_FREQUENCIES.WEEKLY 
  },
  { 
    path: '/privacy-policy', 
    priority: DEFAULT_PRIORITIES.LOW, 
    changeFrequency: DEFAULT_CHANGE_FREQUENCIES.MONTHLY 
  },
  { 
    path: '/terms-of-service', 
    priority: DEFAULT_PRIORITIES.LOW, 
    changeFrequency: DEFAULT_CHANGE_FREQUENCIES.MONTHLY 
  },
  { 
    path: '/cookies', 
    priority: DEFAULT_PRIORITIES.LOW, 
    changeFrequency: DEFAULT_CHANGE_FREQUENCIES.MONTHLY 
  },
]

const PAGINATION_ROUTES = [
  '/tags/paging',
  '/categories/paging',
]

// Helper functions
const getBaseUrl = (): string => {
  return process.env.NEXT_PUBLIC_SITE_URL || DEFAULT_BASE_URL;
};

const sanitizeSlug = (slug: string): string => {
  // Remove any potentially dangerous characters and ensure valid URL format
  return slug
    .replace(/[^a-zA-Z0-9\-_]/g, '-')
    .replace(/--+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
};

const validateSlug = (slug: string): boolean => {
  // Ensure slug is safe and not empty
  return Boolean(slug && slug.length > 0 && slug.length < 200 && /^[a-zA-Z0-9\-_]+$/.test(slug));
};

const generateStaticRoutes = (baseUrl: string): SitemapEntry[] => {
  return STATIC_ROUTES.map((route) => ({
    url: `${baseUrl}${route.path}`,
    lastModified: new Date(),
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
};

const generatePaginationRoutes = (baseUrl: string): SitemapEntry[] => {
  return PAGINATION_ROUTES.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: DEFAULT_CHANGE_FREQUENCIES.WEEKLY,
    priority: DEFAULT_PRIORITIES.LOW,
  }));
};

const generateLocaleRoutes = (baseUrl: string): SitemapEntry[] => {
  const locales = ['en', 'fr', 'es', 'de', 'ar', 'zh'];
  const routes: SitemapEntry[] = [];

  locales.forEach((locale) => {
    STATIC_ROUTES.forEach((route) => {
      if (locale !== 'en') { // Skip default locale prefix
        routes.push({
          url: `${baseUrl}/${locale}${route.path}`,
          lastModified: new Date(),
          changeFrequency: route.changeFrequency,
          priority: route.priority,
        });
      }
    });
  });

  return routes;
};

const generateDynamicRoutes = async (baseUrl: string): Promise<SitemapEntry[]> => {
  try {
    const { items, categories, tags } = await fetchItems()

    return [
      // Items - validate and sanitize slugs
      ...items
        .filter((item) => item.slug && validateSlug(item.slug))
        .map((item) => ({
          url: `${baseUrl}/items/${sanitizeSlug(item.slug)}`,
          lastModified: item.updatedAt,
          changeFrequency: DEFAULT_CHANGE_FREQUENCIES.WEEKLY,
          priority: item.featured ? DEFAULT_PRIORITIES.MAIN : DEFAULT_PRIORITIES.SECONDARY,
        })),
      // Categories - validate and sanitize IDs
      ...categories
        .filter((category) => category.id && validateSlug(category.id))
        .map((category) => ({
          url: `${baseUrl}/categories/category/${sanitizeSlug(category.id)}`,
          lastModified: new Date(),
          changeFrequency: DEFAULT_CHANGE_FREQUENCIES.WEEKLY,
          priority: DEFAULT_PRIORITIES.SECONDARY,
        })),
      // Tags - validate and sanitize IDs
      ...tags
        .filter((tag) => tag.id && validateSlug(tag.id))
        .map((tag) => ({
          url: `${baseUrl}/tags/${sanitizeSlug(tag.id)}`,
          lastModified: new Date(),
          changeFrequency: DEFAULT_CHANGE_FREQUENCIES.WEEKLY,
          priority: DEFAULT_PRIORITIES.TERTIARY,
        })),
    ]
  } catch (error) {
    console.error('Failed to generate dynamic routes:', error)
    return []
  }
}

// Main sitemap generator
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    const baseUrl = getBaseUrl()

    const [
      staticRoutes,
      paginationRoutes,
      localeRoutes,
      dynamicRoutes,
    ] = await Promise.all([
      Promise.resolve(generateStaticRoutes(baseUrl)),
      Promise.resolve(generatePaginationRoutes(baseUrl)),
      Promise.resolve(generateLocaleRoutes(baseUrl)),
      generateDynamicRoutes(baseUrl),
    ])

    return [
      ...staticRoutes,
      ...dynamicRoutes,
      ...paginationRoutes,
      ...localeRoutes,
    ]
  } catch (error) {
    console.error('Error generating sitemap:', error)
    // Return basic sitemap with static routes in case of error
    const baseUrl = getBaseUrl()
    return generateStaticRoutes(baseUrl)
  }
} 