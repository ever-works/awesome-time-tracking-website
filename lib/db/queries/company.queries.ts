import { and, eq, desc, asc, sql, or, ilike, type SQL } from 'drizzle-orm';
import { db } from '../drizzle';
import {
  companies,
  itemsCompanies,
  type Company,
  type NewCompany,
  type ItemCompany
} from '../schema';

// ===================== Company CRUD =====================

/**
 * Create a new company
 * @param data - Company data
 * @returns Created company
 */
export async function createCompany(data: {
  name: string;
  website?: string;
  domain?: string;
  slug?: string;
  status?: 'active' | 'inactive';
}): Promise<Company> {
  // Normalize domain and slug to lowercase
  const normalizedData: NewCompany = {
    name: data.name.trim(),
    website: data.website?.trim() || undefined,
    domain: data.domain?.toLowerCase().trim() || undefined,
    slug: data.slug?.toLowerCase().trim() || undefined,
    status: data.status || 'active'
  };

  const [company] = await db.insert(companies).values(normalizedData).returning();

  return company;
}

/**
 * Get company by ID
 * @param id - Company ID
 * @returns Company or null if not found
 */
export async function getCompanyById(id: string): Promise<Company | null> {
  const [company] = await db.select().from(companies).where(eq(companies.id, id)).limit(1);

  return company || null;
}

/**
 * Get company by slug
 * @param slug - Company slug (case-insensitive)
 * @returns Company or null if not found
 */
export async function getCompanyBySlug(slug: string): Promise<Company | null> {
  const normalizedSlug = slug.toLowerCase().trim();
  const [company] = await db
    .select()
    .from(companies)
    .where(sql`lower(${companies.slug}) = ${normalizedSlug}`)
    .limit(1);

  return company || null;
}

/**
 * Get company by domain
 * @param domain - Company domain (case-insensitive)
 * @returns Company or null if not found
 */
export async function getCompanyByDomain(domain: string): Promise<Company | null> {
  const normalizedDomain = domain.toLowerCase().trim();
  const [company] = await db
    .select()
    .from(companies)
    .where(sql`lower(${companies.domain}) = ${normalizedDomain}`)
    .limit(1);

  return company || null;
}

/**
 * Update company
 * @param id - Company ID
 * @param data - Partial company data to update
 * @returns Updated company or null if not found
 */
export async function updateCompany(
  id: string,
  data: Partial<Omit<NewCompany, 'id'>>
): Promise<Company | null> {
  // Normalize domain and slug if provided
  const normalizedData: Partial<NewCompany> = {
    ...data,
    domain: data.domain !== undefined ? data.domain?.toLowerCase().trim() || undefined : undefined,
    slug: data.slug !== undefined ? data.slug?.toLowerCase().trim() || undefined : undefined,
    updatedAt: new Date()
  };

  // Remove undefined values
	const updateData = Object.fromEntries(
		Object.entries(normalizedData).filter(([, value]) => value !== undefined)
	);

  const [company] = await db
    .update(companies)
    .set(updateData)
    .where(eq(companies.id, id))
    .returning();

  return company || null;
}

/**
 * Delete company
 * @param id - Company ID
 * @returns True if deleted, false otherwise
 */
export async function deleteCompany(id: string): Promise<boolean> {
  const [company] = await db.delete(companies).where(eq(companies.id, id)).returning();

  return !!company;
}

// ===================== Company Listing & Search =====================

/**
 * List companies with pagination and search
 * @param params - Query parameters for filtering and pagination
 * @returns Paginated companies with metadata
 */
export async function listCompanies(params: {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'active' | 'inactive';
  sortBy?: 'name' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}): Promise<{
  companies: Company[];
  total: number;
  page: number;
  totalPages: number;
  limit: number;
  activeCount: number;
  inactiveCount: number;
}> {
  const { page = 1, limit = 10, search, status, sortBy = 'createdAt', sortOrder = 'desc' } = params;
  const offset = (page - 1) * limit;

  const whereConditions: SQL[] = [];

  // Search by name or domain (case-insensitive)
  if (search) {
    const escapedSearch = search.replace(/\\/g, '\\\\').replace(/[%_]/g, '\\$&');
    whereConditions.push(
      or(
        ilike(companies.name, `%${escapedSearch}%`),
        ilike(companies.domain, `%${escapedSearch}%`)
      )!
    );
  }

  // Filter by status
  if (status) {
    whereConditions.push(eq(companies.status, status));
  }

  const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;

  // Get total count for filtered results
  const countResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(companies)
    .where(whereClause);

  const total = Number(countResult[0]?.count || 0);

  // Get global active/inactive counts (unfiltered)
  const activeResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(companies)
    .where(eq(companies.status, 'active'));

  const inactiveResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(companies)
    .where(eq(companies.status, 'inactive'));

  const activeCount = Number(activeResult[0]?.count || 0);
  const inactiveCount = Number(inactiveResult[0]?.count || 0);

  // Build sort clause
  let sortClause;
  switch (sortBy) {
    case 'name':
      sortClause = sortOrder === 'asc' ? asc(companies.name) : desc(companies.name);
      break;
    case 'updatedAt':
      sortClause = sortOrder === 'asc' ? asc(companies.updatedAt) : desc(companies.updatedAt);
      break;
    case 'createdAt':
    default:
      sortClause = sortOrder === 'asc' ? asc(companies.createdAt) : desc(companies.createdAt);
      break;
  }

  // Get companies with pagination
  const companyList = await db
    .select()
    .from(companies)
    .where(whereClause)
    .orderBy(sortClause)
    .limit(limit)
    .offset(offset);

  return {
    companies: companyList,
    total,
    page,
    totalPages: Math.ceil(total / limit),
    limit,
    activeCount,
    inactiveCount
  };
}

/**
 * Get companies count by status
 * @returns Count of companies by status
 */
export async function getCompaniesStats(): Promise<{
  total: number;
  active: number;
  inactive: number;
}> {
  const totalResult = await db.select({ count: sql`count(*)` }).from(companies);

  const activeResult = await db
    .select({ count: sql`count(*)` })
    .from(companies)
    .where(eq(companies.status, 'active'));

  const inactiveResult = await db
    .select({ count: sql`count(*)` })
    .from(companies)
    .where(eq(companies.status, 'inactive'));

  return {
    total: Number(totalResult[0]?.count || 0),
    active: Number(activeResult[0]?.count || 0),
    inactive: Number(inactiveResult[0]?.count || 0)
  };
}

// ===================== Item-Company Association =====================

/**
 * Link item to company (idempotent - duplicate link is no-op)
 * @param itemSlug - Item slug (normalized to lowercase)
 * @param companyId - Company ID
 * @returns Created or existing association with success indicator
 * @throws Error with friendly message if company doesn't exist
 */
export async function linkItemToCompany(
  itemSlug: string,
  companyId: string
): Promise<{ association: ItemCompany; created: boolean }> {
  const normalizedSlug = itemSlug.toLowerCase().trim();

  try {
    // Check if company exists
    const company = await getCompanyById(companyId);
    if (!company) {
      throw new Error(`Company with ID "${companyId}" does not exist.`);
    }

    // Check if association already exists (idempotent check)
    const existing = await db
      .select()
      .from(itemsCompanies)
      .where(eq(itemsCompanies.itemSlug, normalizedSlug))
      .limit(1);

    if (existing.length > 0) {
      // Already linked, return existing (idempotent - no-op)
      return { association: existing[0], created: false };
    }

    // Create new association
    const [association] = await db
      .insert(itemsCompanies)
      .values({
        itemSlug: normalizedSlug,
        companyId
      })
      .returning();

    return { association, created: true };
  } catch (error) {
    // Handle unique constraint violation with friendly message
    if (error instanceof Error) {
      if (error.message.includes('unique constraint') || error.message.includes('duplicate key')) {
        // This shouldn't happen due to our check above, but handle it gracefully
        const existing = await db
          .select()
          .from(itemsCompanies)
          .where(eq(itemsCompanies.itemSlug, normalizedSlug))
          .limit(1);

        if (existing.length > 0) {
          return { association: existing[0], created: false };
        }

        throw new Error(`Item "${normalizedSlug}" is already linked to another company. Each item can only belong to one company.`);
      }

      if (error.message.includes('foreign key constraint') || error.message.includes('does not exist')) {
        throw new Error(`Company with ID "${companyId}" does not exist.`);
      }
    }

    throw error;
  }
}

/**
 * Assign company to item (alias for linkItemToCompany for backward compatibility)
 * @param itemSlug - Item slug (normalized to lowercase)
 * @param companyId - Company ID
 * @returns Created association
 */
export async function assignCompanyToItem(itemSlug: string, companyId: string): Promise<ItemCompany> {
  const result = await linkItemToCompany(itemSlug, companyId);
  return result.association;
}

/**
 * Update item's company
 * @param itemSlug - Item slug (normalized to lowercase)
 * @param companyId - New company ID
 * @returns Updated association or null if not found
 */
export async function updateItemCompany(
  itemSlug: string,
  companyId: string
): Promise<ItemCompany | null> {
  const normalizedSlug = itemSlug.toLowerCase().trim();

  const [association] = await db
    .update(itemsCompanies)
    .set({ companyId, updatedAt: new Date() })
    .where(eq(itemsCompanies.itemSlug, normalizedSlug))
    .returning();

  return association || null;
}

/**
 * Unlink item from company (idempotent - unlink of non-existent mapping is no-op)
 * @param itemSlug - Item slug (normalized to lowercase)
 * @returns Success indicator (always true, idempotent)
 */
export async function unlinkItemFromCompany(itemSlug: string): Promise<{ success: boolean; deleted: boolean }> {
  const normalizedSlug = itemSlug.toLowerCase().trim();

  try {
    const [association] = await db
      .delete(itemsCompanies)
      .where(eq(itemsCompanies.itemSlug, normalizedSlug))
      .returning();

    return {
      success: true,
      deleted: !!association
    };
	} catch {
		// Even if error occurs, return success (idempotent - unlink of non-existent is no-op)
		return {
			success: true,
			deleted: false
		};
	}
}

/**
 * Remove company from item (alias for unlinkItemFromCompany for backward compatibility)
 * @param itemSlug - Item slug (normalized to lowercase)
 * @returns True if deleted, false otherwise
 */
export async function removeCompanyFromItem(itemSlug: string): Promise<boolean> {
  const result = await unlinkItemFromCompany(itemSlug);
  return result.deleted;
}

/**
 * Get company by item slug
 * @param itemSlug - Item slug (normalized to lowercase)
 * @returns Company or null if not associated
 */
export async function getCompanyByItemSlug(itemSlug: string): Promise<Company | null> {
  const normalizedSlug = itemSlug.toLowerCase().trim();

  const [result] = await db
    .select({
      id: companies.id,
      name: companies.name,
      website: companies.website,
      domain: companies.domain,
      slug: companies.slug,
      status: companies.status,
      createdAt: companies.createdAt,
      updatedAt: companies.updatedAt
    })
    .from(itemsCompanies)
    .innerJoin(companies, eq(itemsCompanies.companyId, companies.id))
    .where(eq(itemsCompanies.itemSlug, normalizedSlug))
    .limit(1);

  return result || null;
}

/**
 * Get company for an item (alias for getCompanyByItemSlug for backward compatibility)
 * @param itemSlug - Item slug (normalized to lowercase)
 * @returns Company or null if not associated
 */
export async function getCompanyForItem(itemSlug: string): Promise<Company | null> {
  return getCompanyByItemSlug(itemSlug);
}

/**
 * List items by company with pagination
 * @param companyId - Company ID
 * @param params - Pagination parameters
 * @returns List of item slugs associated with the company
 */
export async function listItemsByCompany(
  companyId: string,
  params?: { page?: number; limit?: number }
): Promise<{
  items: ItemCompany[];
  total: number;
  page: number;
  totalPages: number;
  limit: number;
}> {
  const { page = 1, limit = 50 } = params || {};
  const offset = (page - 1) * limit;

  // Get total count
  const countResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(itemsCompanies)
    .where(eq(itemsCompanies.companyId, companyId));

  const total = Number(countResult[0]?.count || 0);

  // Get items
  const items = await db
    .select()
    .from(itemsCompanies)
    .where(eq(itemsCompanies.companyId, companyId))
    .orderBy(desc(itemsCompanies.createdAt))
    .limit(limit)
    .offset(offset);

  return {
    items,
    total,
    page,
    totalPages: Math.ceil(total / limit),
    limit
  };
}

/**
 * Get all items for a company (alias for listItemsByCompany for backward compatibility)
 * @param companyId - Company ID
 * @param params - Pagination parameters
 * @returns List of item slugs associated with the company
 */
export async function getItemsForCompany(
  companyId: string,
  params?: { page?: number; limit?: number }
): Promise<{
  items: ItemCompany[];
  total: number;
  page: number;
  totalPages: number;
  limit: number;
}> {
  return listItemsByCompany(companyId, params);
}

/**
 * Check if item has a company assigned
 * @param itemSlug - Item slug (normalized to lowercase)
 * @returns True if item has company, false otherwise
 */
export async function itemHasCompany(itemSlug: string): Promise<boolean> {
  const normalizedSlug = itemSlug.toLowerCase().trim();

  const [association] = await db
    .select()
    .from(itemsCompanies)
    .where(eq(itemsCompanies.itemSlug, normalizedSlug))
    .limit(1);

  return !!association;
}

/**
 * Get companies with item count
 * @param params - Pagination and filter parameters
 * @returns Companies with their item counts
 */
export async function getCompaniesWithItemCount(params: {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'active' | 'inactive';
  sortBy?: 'name' | 'createdAt' | 'itemCount';
  sortOrder?: 'asc' | 'desc';
}): Promise<{
  companies: (Company & { itemCount: number })[];
  total: number;
  page: number;
  totalPages: number;
  limit: number;
}> {
  const { page = 1, limit = 10, search, status, sortBy = 'createdAt', sortOrder = 'desc' } = params;
  const offset = (page - 1) * limit;

  const whereConditions: SQL[] = [];

  // Search by name or domain
  if (search) {
    const escapedSearch = search.replace(/\\/g, '\\\\').replace(/[%_]/g, '\\$&');
    whereConditions.push(
      or(
        ilike(companies.name, `%${escapedSearch}%`),
        ilike(companies.domain, `%${escapedSearch}%`)
      )!
    );
  }

  // Filter by status
  if (status) {
    whereConditions.push(eq(companies.status, status));
  }

  const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;

  // Get total count
  const countResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(companies)
    .where(whereClause);

  const total = Number(countResult[0]?.count || 0);

  // Build sort clause
  let sortClause;
  if (sortBy === 'itemCount') {
    sortClause = sortOrder === 'asc' ? asc(sql`item_count`) : desc(sql`item_count`);
  } else if (sortBy === 'name') {
    sortClause = sortOrder === 'asc' ? asc(companies.name) : desc(companies.name);
  } else {
    sortClause = sortOrder === 'asc' ? asc(companies.createdAt) : desc(companies.createdAt);
  }

  // Get companies with item count
  const companyList = await db
    .select({
      id: companies.id,
      name: companies.name,
      website: companies.website,
      domain: companies.domain,
      slug: companies.slug,
      status: companies.status,
      createdAt: companies.createdAt,
      updatedAt: companies.updatedAt,
      itemCount: sql<number>`count(${itemsCompanies.itemSlug})`
    })
    .from(companies)
    .leftJoin(itemsCompanies, eq(companies.id, itemsCompanies.companyId))
    .where(whereClause)
    .groupBy(companies.id)
    .orderBy(sortClause)
    .limit(limit)
    .offset(offset);

  // Transform to proper type
  const companiesWithCount = companyList.map((row) => ({
    id: row.id,
    name: row.name,
    website: row.website,
    domain: row.domain,
    slug: row.slug,
    status: row.status,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    itemCount: Number(row.itemCount || 0)
  }));

  return {
    companies: companiesWithCount,
    total,
    page,
    totalPages: Math.ceil(total / limit),
    limit
  };
}
