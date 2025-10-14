import { and, eq, desc, asc, lte, sql, isNull, or, gte, countDistinct, type SQL } from 'drizzle-orm';
import { db } from '../drizzle';
import {
  clientProfiles,
  accounts,
  userRoles,
  roles,
  type ClientProfile,
  type NewClientProfile
} from '../schema';
import type { AdapterAccountType } from 'next-auth/adapters';
import type { ClientStatus, ClientPlan, ClientAccountType, ClientProfileWithAuth, ClientAccount } from './types';
import { extractUsernameFromEmail, ensureUniqueUsername } from './utils';
import { comparePasswords } from '@/lib/auth/credentials';

// ===================== Client Profile CRUD =====================

/**
 * Create a new client profile
 * @param data - Client profile data
 * @returns Created client profile
 */
export async function createClientProfile(data: {
  userId: string;
  email: string;
  name: string;
  displayName?: string;
  username?: string;
  bio?: string;
  jobTitle?: string;
  company?: string;
  status?: string;
  plan?: string;
  accountType?: string;
}): Promise<ClientProfile> {
  // Normalize email for consistency
  const normalizedEmail = data.email.toLowerCase().trim();

  // Generate a unique username if not provided
  let finalUsername = data.username;
  if (!finalUsername) {
    const extractedUsername = extractUsernameFromEmail(normalizedEmail);
    if (extractedUsername) {
      finalUsername = await ensureUniqueUsername(extractedUsername);
    } else {
      // Fallback: generate unique username from timestamp
      const timestamp = Date.now().toString().slice(-6);
      finalUsername = await ensureUniqueUsername(`user${timestamp}`);
    }
  } else {
    // Ensure provided username is also unique and normalized
    finalUsername = await ensureUniqueUsername(finalUsername.toLowerCase());
  }

  const insertData: NewClientProfile = {
    userId: data.userId,
    email: normalizedEmail,
    name: data.name,
    displayName: data.displayName || data.name,
    username: finalUsername,
    bio: data.bio || "Welcome! I'm a new user on this platform.",
    jobTitle: data.jobTitle || 'User',
    company: data.company || 'Unknown',
    status: (data.status as 'active' | 'inactive' | 'suspended' | 'trial') || 'active',
    plan: (data.plan as 'free' | 'standard' | 'premium') || 'free',
    accountType: (data.accountType as 'individual' | 'business' | 'enterprise') || 'individual'
  };

  const [profile] = await db.insert(clientProfiles).values(insertData).returning();

  return profile;
}

/**
 * Find client profile by ID
 * @param id - Client profile ID
 * @returns Client profile or null if not found
 */
export async function getClientProfileById(id: string): Promise<ClientProfile | null> {
  const [profile] = await db.select().from(clientProfiles).where(eq(clientProfiles.id, id));

  return profile || null;
}

/**
 * Find client profile by user ID
 * @param userId - User ID
 * @returns Client profile or null if not found
 */
export async function getClientProfileByUserId(userId: string): Promise<ClientProfile | null> {
  const [profile] = await db.select().from(clientProfiles).where(eq(clientProfiles.userId, userId));

  return profile || null;
}

/**
 * Find client profile by email
 * @param email - Client email
 * @returns Client profile or null if not found
 */
export async function getClientProfileByEmail(email: string): Promise<ClientProfile | null> {
  // Resolve deterministic profile via accounts (accounts.email will be unique after migration)
  const account = await getClientAccountByEmail(email);
  if (!account) return null;

  const [profile] = await db.select().from(clientProfiles).where(eq(clientProfiles.userId, account.userId)).limit(1);

  return profile || null;
}

/**
 * Update client profile
 * @param id - Client profile ID
 * @param data - Partial client profile data to update
 * @returns Updated client profile or null if not found
 */
export async function updateClientProfile(
  id: string,
  data: Partial<NewClientProfile>
): Promise<ClientProfile | null> {
  const [profile] = await db
    .update(clientProfiles)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(clientProfiles.id, id))
    .returning();

  return profile || null;
}

/**
 * Delete client profile
 * @param id - Client profile ID
 * @returns True if deleted, false otherwise
 */
export async function deleteClientProfile(id: string): Promise<boolean> {
  const [profile] = await db.delete(clientProfiles).where(eq(clientProfiles.id, id)).returning();

  return !!profile;
}

// ===================== Client Profile Listing & Search =====================

/**
 * Get all client profiles with pagination and authentication data
 * @param params - Query parameters for filtering and pagination
 * @returns Paginated client profiles with metadata
 */
export async function getClientProfiles(params: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  plan?: string;
  accountType?: string;
  provider?: string;
}): Promise<{
  profiles: ClientProfileWithAuth[];
  total: number;
  page: number;
  totalPages: number;
  limit: number;
}> {
  const { page = 1, limit = 10, search, status, plan, accountType, provider } = params;
  const offset = (page - 1) * limit;

  const whereConditions: SQL[] = [];

  if (search) {
    const escapedSearch = search.replace(/\\/g, '\\\\').replace(/[%_]/g, '\\$&');

    whereConditions.push(
      sql`(${clientProfiles.username} ILIKE ${`%${escapedSearch}%`} OR
           ${clientProfiles.displayName} ILIKE ${`%${escapedSearch}%`} OR
           ${clientProfiles.company} ILIKE ${`%${escapedSearch}%`} OR
           ${clientProfiles.name} ILIKE ${`%${escapedSearch}%`} OR
           ${clientProfiles.email} ILIKE ${`%${escapedSearch}%`})`
    );
  }

  if (status) {
    whereConditions.push(eq(clientProfiles.status, status as ClientStatus));
  }

  if (plan) {
    whereConditions.push(eq(clientProfiles.plan, plan as ClientPlan));
  }

  if (accountType) {
    whereConditions.push(eq(clientProfiles.accountType, accountType as ClientAccountType));
  }

  if (provider) {
    whereConditions.push(
      sql`exists (
        select 1
        from ${accounts}
        where ${accounts.userId} = ${clientProfiles.userId}
          and ${accounts.provider} = ${provider}
      )`
    );
  }

  const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;

  // Get total count and exclude admins (roles.is_admin = false OR NULL)
  const countResult = await db
    .select({ count: sql<number>`count(distinct ${clientProfiles.id})` })
    .from(clientProfiles)
    .leftJoin(userRoles, eq(userRoles.userId, clientProfiles.userId))
    .leftJoin(roles, and(eq(userRoles.roleId, roles.id), eq(roles.isAdmin, true)))
    .where(whereClause ? and(whereClause, isNull(roles.id)) : isNull(roles.id));

  const total = Number((countResult[0] as unknown as { count: number })?.count || 0);

  // Get profiles with authentication data and exclude admins (roles.is_admin = false)
  const profiles = await db
    .select({
      // Client profile fields
      id: clientProfiles.id,
      userId: clientProfiles.userId,
      email: clientProfiles.email,
      name: clientProfiles.name,
      displayName: clientProfiles.displayName,
      username: clientProfiles.username,
      bio: clientProfiles.bio,
      jobTitle: clientProfiles.jobTitle,
      company: clientProfiles.company,
      industry: clientProfiles.industry,
      phone: clientProfiles.phone,
      website: clientProfiles.website,
      location: clientProfiles.location,
      avatar: clientProfiles.avatar,
      accountType: clientProfiles.accountType,
      status: clientProfiles.status,
      plan: clientProfiles.plan,
      timezone: clientProfiles.timezone,
      language: clientProfiles.language,
      twoFactorEnabled: clientProfiles.twoFactorEnabled,
      emailVerified: clientProfiles.emailVerified,
      totalSubmissions: clientProfiles.totalSubmissions,
      notes: clientProfiles.notes,
      tags: clientProfiles.tags,
      createdAt: clientProfiles.createdAt,
      updatedAt: clientProfiles.updatedAt,
      // Account fields - use subquery to avoid duplicate rows from multiple accounts
      accountProvider: sql<string>`coalesce(
        (SELECT provider FROM ${accounts}
         WHERE ${accounts.userId} = ${clientProfiles.userId}
         LIMIT 1),
        'unknown'
      )`
    })
    .from(clientProfiles)
    .leftJoin(userRoles, eq(userRoles.userId, clientProfiles.userId))
    .leftJoin(roles, and(eq(userRoles.roleId, roles.id), eq(roles.isAdmin, true)))
    .where(whereClause ? and(whereClause, isNull(roles.id)) : isNull(roles.id))
    .orderBy(desc(clientProfiles.createdAt))
    .limit(limit)
    .offset(offset);

  // Transform to enhanced type
  const enhancedProfiles: ClientProfileWithAuth[] = profiles.map((profile: (typeof profiles)[0]) => ({
    ...profile,
    accountType: profile.accountType || 'individual',
    isActive: profile.status === 'active'
  }));

  return {
    profiles: enhancedProfiles,
    total,
    page,
    totalPages: Math.ceil(total / limit),
    limit
  };
}

// ===================== Client Statistics =====================

/**
 * Get client profile statistics (basic)
 * @returns Basic client statistics
 */
export async function getClientProfileStats() {
  const totalResult = await db.select({ count: sql`count(*)` }).from(clientProfiles);

  const activeResult = await db
    .select({ count: sql`count(*)` })
    .from(clientProfiles)
    .where(eq(clientProfiles.status, 'active'));

  const inactiveResult = await db
    .select({ count: sql`count(*)` })
    .from(clientProfiles)
    .where(eq(clientProfiles.status, 'inactive'));

  const planStats = await db
    .select({ plan: clientProfiles.plan, count: sql`count(*)` })
    .from(clientProfiles)
    .groupBy(clientProfiles.plan);

  const accountTypeStats = await db
    .select({ accountType: clientProfiles.accountType, count: sql`count(*)` })
    .from(clientProfiles)
    .groupBy(clientProfiles.accountType);

  const byPlan: Record<string, number> = {};
  planStats.forEach((stat) => {
    byPlan[stat.plan || 'unknown'] = Number(stat.count);
  });

  const byAccountType: Record<string, number> = {};
  accountTypeStats.forEach((stat) => {
    byAccountType[stat.accountType || 'unknown'] = Number(stat.count);
  });

  return {
    total: Number(totalResult[0]?.count || 0),
    active: Number(activeResult[0]?.count || 0),
    inactive: Number(inactiveResult[0]?.count || 0),
    byPlan,
    byAccountType
  };
}

/**
 * Get comprehensive client statistics with multiple dimensions
 * Returns detailed analytics including provider distribution, plan analysis, and activity metrics
 * @returns Enhanced client statistics
 */
export async function getEnhancedClientStats(): Promise<{
  overview: {
    total: number;
    active: number;
    inactive: number;
    suspended: number;
    trial: number;
  };
  byProvider: {
    credentials: number;
    google: number;
    github: number;
    facebook: number;
    twitter: number;
    linkedin: number;
    other: number;
  };
  byPlan: Record<string, number>;
  byAccountType: Record<string, number>;
  byStatus: Record<string, number>;
  activity: {
    newThisWeek: number;
    newThisMonth: number;
    activeThisWeek: number;
    activeThisMonth: number;
  };
  growth: {
    weeklyGrowth: number;
    monthlyGrowth: number;
  };
}> {
  // Get comprehensive stats with joins
  const statsResult = await db
    .select({
      status: clientProfiles.status,
      plan: clientProfiles.plan,
      accountType: clientProfiles.accountType,
      provider: accounts.provider,
      count: countDistinct(clientProfiles.id)
    })
    .from(clientProfiles)
    .leftJoin(accounts, eq(clientProfiles.userId, accounts.userId))
    .leftJoin(userRoles, eq(userRoles.userId, clientProfiles.userId))
    .leftJoin(roles, and(eq(userRoles.roleId, roles.id), eq(roles.isAdmin, true)))
    .where(isNull(roles.id))
    .groupBy(clientProfiles.status, clientProfiles.plan, clientProfiles.accountType, accounts.provider);

  // Get total count
  const totalResult = await db
    .select({ count: countDistinct(clientProfiles.id) })
    .from(clientProfiles)
    .leftJoin(userRoles, eq(userRoles.userId, clientProfiles.userId))
    .leftJoin(roles, and(eq(userRoles.roleId, roles.id), eq(roles.isAdmin, true)))
    .where(isNull(roles.id));

  const total = Number((totalResult[0] as unknown as { count: number })?.count || 0);

  // Initialize counters
  const byStatus: Record<string, number> = { active: 0, inactive: 0, suspended: 0, trial: 0 };
  const byPlan: Record<string, number> = { free: 0, standard: 0, premium: 0 };
  const byAccountType: Record<string, number> = { individual: 0, business: 0, enterprise: 0 };
  const byProvider = {
    credentials: 0,
    google: 0,
    github: 0,
    facebook: 0,
    twitter: 0,
    linkedin: 0,
    other: 0
  };

  // Process results
  for (const row of statsResult) {
    const count = Number(row.count);
    const status = row.status || 'active'; // Use a valid default
    const plan = row.plan || 'free';
    const accountType = row.accountType || 'individual';
    const provider = row.provider || 'unknown';

    // Count by status
    if (status in byStatus) {
      byStatus[status] += count;
    }

    // Count by plan
    if (plan in byPlan) {
      byPlan[plan] += count;
    }

    // Count by account type
    if (accountType in byAccountType) {
      byAccountType[accountType] += count;
    }

    // Count by provider
    const knownProviders = ['credentials', 'google', 'github', 'facebook', 'twitter', 'linkedin'] as const;
    if (knownProviders.includes(provider as (typeof knownProviders)[number])) {
      byProvider[provider as keyof typeof byProvider] += count;
    } else {
      byProvider.other += count;
    }
  }

  // Get activity metrics
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // New clients this week
  const newThisWeekResult = await db
    .select({ count: countDistinct(clientProfiles.id) })
    .from(clientProfiles)
    .leftJoin(userRoles, eq(userRoles.userId, clientProfiles.userId))
    .leftJoin(roles, and(eq(userRoles.roleId, roles.id), eq(roles.isAdmin, true)))
    .where(and(isNull(roles.id), gte(clientProfiles.createdAt, oneWeekAgo)));

  const newThisWeek = Number(newThisWeekResult[0]?.count || 0);

  // New clients this month
  const newThisMonthResult = await db
    .select({ count: countDistinct(clientProfiles.id) })
    .from(clientProfiles)
    .leftJoin(userRoles, eq(userRoles.userId, clientProfiles.userId))
    .leftJoin(roles, and(eq(userRoles.roleId, roles.id), eq(roles.isAdmin, true)))
    .where(and(isNull(roles.id), gte(clientProfiles.createdAt, oneMonthAgo)));

  const newThisMonth = Number(newThisMonthResult[0]?.count || 0);

  // Active clients this week (have activity or recent login)
  const activeThisWeekResult = await db
    .select({ count: countDistinct(clientProfiles.id) })
    .from(clientProfiles)
    .leftJoin(userRoles, eq(userRoles.userId, clientProfiles.userId))
    .leftJoin(roles, and(eq(userRoles.roleId, roles.id), eq(roles.isAdmin, true)))
    .where(
      and(
        isNull(roles.id),
        eq(clientProfiles.status, 'active'),
        or(gte(clientProfiles.updatedAt, oneWeekAgo), gte(clientProfiles.createdAt, oneWeekAgo))
      )
    );

  const activeThisWeek = Number(activeThisWeekResult[0]?.count || 0);

  // Active clients this month
  const activeThisMonthResult = await db
    .select({ count: countDistinct(clientProfiles.id) })
    .from(clientProfiles)
    .leftJoin(userRoles, eq(userRoles.userId, clientProfiles.userId))
    .leftJoin(roles, and(eq(userRoles.roleId, roles.id), eq(roles.isAdmin, true)))
    .where(
      and(
        isNull(roles.id),
        eq(clientProfiles.status, 'active'),
        or(gte(clientProfiles.updatedAt, oneMonthAgo), gte(clientProfiles.createdAt, oneMonthAgo))
      )
    );

  const activeThisMonth = Number(activeThisMonthResult[0]?.count || 0);

  // Calculate growth rates (simplified - could be enhanced with historical data)
  const weeklyGrowth = total > 0 ? Math.round((newThisWeek / total) * 100) : 0;
  const monthlyGrowth = total > 0 ? Math.round((newThisMonth / total) * 100) : 0;

  return {
    overview: {
      total,
      active: byStatus.active,
      inactive: byStatus.inactive,
      suspended: byStatus.suspended,
      trial: byStatus.trial
    },
    byProvider,
    byPlan,
    byAccountType,
    byStatus,
    activity: {
      newThisWeek,
      newThisMonth,
      activeThisWeek,
      activeThisMonth
    },
    growth: {
      weeklyGrowth,
      monthlyGrowth
    }
  };
}

// ===================== Client Account Management =====================

/**
 * Create a client account record in the accounts table
 * @param userId - User ID (references users.id)
 * @param email - Client email
 * @param passwordHash - Hashed password
 * @returns Created account or null if failed
 */
export async function createClientAccount(
  userId: string,
  email: string,
  passwordHash: string
): Promise<ClientAccount | null> {
  try {
    const normalizedEmail = email.toLowerCase().trim();

    const [account] = await db
      .insert(accounts)
      .values({
        userId,
        type: 'credentials' as AdapterAccountType,
        provider: 'credentials',
        providerAccountId: normalizedEmail,
        email: normalizedEmail,
        passwordHash
      })
      .returning();

    return (account as ClientAccount) || null;
  } catch (error) {
    console.error('Error creating client account:', error);
    return null;
  }
}

/**
 * Get client account by email (credentials provider only)
 * @param email - Client email
 * @returns Account or null if not found
 */
export async function getClientAccountByEmail(email: string): Promise<ClientAccount | null> {
  try {
    const normalizedEmail = email.toLowerCase().trim();

    // Get credentials account specifically (not OAuth accounts)
    const [account] = await db
      .select()
      .from(accounts)
      .where(and(eq(accounts.provider, 'credentials'), eq(accounts.email, normalizedEmail)))
      .limit(1);

    return account || null;
  } catch (error) {
    console.error('Error getting client account by email:', error);
    return null;
  }
}

/**
 * Check if user has access to client routes (has account record)
 * @param userId - User ID
 * @returns True if user has client access, false otherwise
 */
export async function hasClientAccess(userId: string): Promise<boolean> {
  try {
    // Check if account exists for the user (accounts.userId references users.id)
    const [account] = await db.select().from(accounts).where(eq(accounts.userId, userId)).limit(1);

    return !!account;
  } catch (error) {
    console.error('Error checking client access:', error);
    return false;
  }
}

/**
 * Verify client password
 * @param email - Client email
 * @param password - Plain text password to verify
 * @returns True if password is valid, false otherwise
 */
export async function verifyClientPassword(email: string, password: string): Promise<boolean> {
  try {
    const normalizedEmail = email.toLowerCase().trim();

    // Get credentials account specifically (not OAuth accounts)
    const [account] = await db
      .select()
      .from(accounts)
      .where(and(eq(accounts.provider, 'credentials'), eq(accounts.email, normalizedEmail)))
      .limit(1);

    if (!account) {
      return false;
    }

    if (!account.passwordHash) {
      return false;
    }

    const isValid = await comparePasswords(password, account.passwordHash);

    return isValid;
  } catch (error) {
    console.error('Error verifying client password:', error);
    return false;
  }
}

// ===================== Admin Dashboard & Advanced Search =====================

/**
 * Get optimized admin dashboard data with clients and statistics in a single query
 * This reduces database round trips and improves dashboard performance
 * @param params - Dashboard query parameters
 * @returns Dashboard data with clients, stats, and pagination
 */
export async function getAdminDashboardData(params: {
  page: number;
  limit: number;
  // Basic filters
  search?: string;
  status?: string;
  plan?: string;
  accountType?: string;
  provider?: string;
  // Date range filters
  createdAfter?: Date;
  createdBefore?: Date;
  updatedAfter?: Date;
  updatedBefore?: Date;
}): Promise<{
  clients: ClientProfileWithAuth[];
  stats: {
    overview: {
      total: number;
      active: number;
      inactive: number;
      suspended: number;
      trial: number;
    };
    byProvider: {
      credentials: number;
      google: number;
      github: number;
      facebook: number;
      twitter: number;
      linkedin: number;
      other: number;
    };
    byPlan: Record<string, number>;
    byAccountType: Record<string, number>;
    byStatus: Record<string, number>;
    activity: {
      newThisWeek: number;
      newThisMonth: number;
      activeThisWeek: number;
      activeThisMonth: number;
    };
    growth: {
      weeklyGrowth: number;
      monthlyGrowth: number;
    };
  };
  pagination: {
    page: number;
    totalPages: number;
    total: number;
    limit: number;
  };
}> {
  const { page, limit, search, status, plan, accountType, provider, createdAfter, createdBefore, updatedAfter, updatedBefore } = params;
  const offset = (page - 1) * limit;

  const whereConditions: SQL[] = [];

  // Optimized search with proper escaping and index-friendly patterns
  if (search) {
    const escapedSearch = search.replace(/\\/g, '\\\\').replace(/[%_]/g, '\\$&');
    // Use ILIKE for case-insensitive search with proper escaping
    whereConditions.push(
      sql`(${clientProfiles.username} ILIKE ${`%${escapedSearch}%`} OR
           ${clientProfiles.displayName} ILIKE ${`%${escapedSearch}%`} OR
           ${clientProfiles.company} ILIKE ${`%${escapedSearch}%`} OR
           ${clientProfiles.name} ILIKE ${`%${escapedSearch}%`} OR
           ${clientProfiles.email} ILIKE ${`%${escapedSearch}%`})`
    );
  }

  // Add filters with proper type casting for enum values
  if (status) {
    whereConditions.push(eq(clientProfiles.status, status as ClientStatus));
  }

  if (plan) {
    whereConditions.push(eq(clientProfiles.plan, plan as ClientPlan));
  }

  if (accountType) {
    whereConditions.push(eq(clientProfiles.accountType, accountType as ClientAccountType));
  }

  if (provider) {
    whereConditions.push(
      sql`exists (
        select 1
        from ${accounts}
        where ${accounts.userId} = ${clientProfiles.userId}
          and ${accounts.provider} = ${provider}
      )`
    );
  }

  // Date range filters
  if (createdAfter) {
    whereConditions.push(gte(clientProfiles.createdAt, createdAfter));
  }

  if (createdBefore) {
    whereConditions.push(lte(clientProfiles.createdAt, createdBefore));
  }

  if (updatedAfter) {
    whereConditions.push(gte(clientProfiles.updatedAt, updatedAfter));
  }

  if (updatedBefore) {
    whereConditions.push(lte(clientProfiles.updatedAt, updatedBefore));
  }

  const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;

  // Optimized count query
  const countResult = await db
    .select({ count: sql<number>`count(distinct ${clientProfiles.id})` })
    .from(clientProfiles)
    .leftJoin(userRoles, eq(userRoles.userId, clientProfiles.userId))
    .leftJoin(roles, and(eq(userRoles.roleId, roles.id), eq(roles.isAdmin, true)))
    .where(whereClause ? and(whereClause, isNull(roles.id)) : isNull(roles.id));

  const total = Number((countResult[0] as unknown as { count: number })?.count || 0);

  // Optimized profile query with selective field selection and proper ordering
  const profiles = await db
    .select({
      // Client profile fields - only select what's needed
      id: clientProfiles.id,
      userId: clientProfiles.userId,
      email: clientProfiles.email,
      name: clientProfiles.name,
      displayName: clientProfiles.displayName,
      username: clientProfiles.username,
      bio: clientProfiles.bio,
      jobTitle: clientProfiles.jobTitle,
      company: clientProfiles.company,
      industry: clientProfiles.industry,
      phone: clientProfiles.phone,
      website: clientProfiles.website,
      location: clientProfiles.location,
      avatar: clientProfiles.avatar,
      accountType: clientProfiles.accountType,
      status: clientProfiles.status,
      plan: clientProfiles.plan,
      timezone: clientProfiles.timezone,
      language: clientProfiles.language,
      twoFactorEnabled: clientProfiles.twoFactorEnabled,
      emailVerified: clientProfiles.emailVerified,
      totalSubmissions: clientProfiles.totalSubmissions,
      notes: clientProfiles.notes,
      tags: clientProfiles.tags,
      createdAt: clientProfiles.createdAt,
      updatedAt: clientProfiles.updatedAt,
      // Account fields - use subquery to avoid duplicate rows from multiple accounts
      accountProvider: sql<string>`coalesce(
        (SELECT provider FROM ${accounts}
         WHERE ${accounts.userId} = ${clientProfiles.userId}
         LIMIT 1),
        'unknown'
      )`
    })
    .from(clientProfiles)
    .leftJoin(userRoles, eq(userRoles.userId, clientProfiles.userId))
    .leftJoin(roles, and(eq(userRoles.roleId, roles.id), eq(roles.isAdmin, true)))
    .where(whereClause ? and(whereClause, isNull(roles.id)) : isNull(roles.id))
    .orderBy(desc(clientProfiles.createdAt)) // Use indexed field for ordering
    .limit(limit)
    .offset(offset);

  // Transform to enhanced type with proper defaults
  const enhancedProfiles: ClientProfileWithAuth[] = profiles.map((profile: (typeof profiles)[0]) => ({
    ...profile,
    accountType: profile.accountType || 'individual',
    isActive: profile.status === 'active'
  }));

  // Get actual stats
  const stats = await getEnhancedClientStats();

  return {
    clients: enhancedProfiles,
    stats,
    pagination: {
      page,
      totalPages: Math.ceil(total / limit),
      total,
      limit
    }
  };
}

/**
 * Advanced search with multiple criteria and complex filtering
 * Supports date ranges, multiple search fields, and saved filter presets
 * @param params - Advanced search parameters
 * @returns Search results with pagination and metadata
 */
export async function advancedClientSearch(params: {
  page: number;
  limit: number;
  // Basic filters
  search?: string;
  status?: string;
  plan?: string;
  accountType?: string;
  provider?: string;
  // Advanced filters
  dateRange?: {
    startDate?: Date;
    endDate?: Date;
  };
  createdAfter?: Date;
  createdBefore?: Date;
  updatedAfter?: Date;
  updatedBefore?: Date;
  // Field-specific searches
  emailDomain?: string;
  companySearch?: string;
  locationSearch?: string;
  industrySearch?: string;
  // Numeric filters
  minSubmissions?: number;
  maxSubmissions?: number;
  // Boolean filters
  hasAvatar?: boolean;
  hasWebsite?: boolean;
  hasPhone?: boolean;
  emailVerified?: boolean;
  twoFactorEnabled?: boolean;
  // Sort options
  sortBy?: 'createdAt' | 'updatedAt' | 'name' | 'email' | 'company' | 'totalSubmissions';
  sortOrder?: 'asc' | 'desc';
}): Promise<{
  clients: ClientProfileWithAuth[];
  pagination: {
    page: number;
    totalPages: number;
    total: number;
    limit: number;
  };
  searchMetadata: {
    appliedFilters: string[];
    searchTime: number;
    resultCount: number;
  };
}> {
  const {
    page,
    limit,
    search,
    status,
    plan,
    accountType,
    provider,
    dateRange,
    createdAfter,
    createdBefore,
    updatedAfter,
    updatedBefore,
    emailDomain,
    companySearch,
    locationSearch,
    industrySearch,
    minSubmissions,
    maxSubmissions,
    hasAvatar,
    hasWebsite,
    hasPhone,
    emailVerified,
    twoFactorEnabled,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = params;

  const offset = (page - 1) * limit;
  const whereConditions: SQL[] = [];
  const appliedFilters: string[] = [];

  // Basic text search across multiple fields
  if (search) {
    const escapedSearch = search.replace(/\\/g, '\\\\').replace(/[%_]/g, '\\$&');
    whereConditions.push(
      sql`(${clientProfiles.username} ILIKE ${`%${escapedSearch}%`} OR
           ${clientProfiles.displayName} ILIKE ${`%${escapedSearch}%`} OR
           ${clientProfiles.company} ILIKE ${`%${escapedSearch}%`} OR
           ${clientProfiles.name} ILIKE ${`%${escapedSearch}%`} OR
           ${clientProfiles.email} ILIKE ${`%${escapedSearch}%`} OR
           ${clientProfiles.bio} ILIKE ${`%${escapedSearch}%`} OR
           ${clientProfiles.jobTitle} ILIKE ${`%${escapedSearch}%`} OR
           ${clientProfiles.industry} ILIKE ${`%${escapedSearch}%`} OR
           ${clientProfiles.location} ILIKE ${`%${escapedSearch}%`})`
    );
    appliedFilters.push(`Search: "${search}"`);
  }

  // Status filter
  if (status) {
    whereConditions.push(eq(clientProfiles.status, status as ClientStatus));
    appliedFilters.push(`Status: ${status}`);
  }

  // Plan filter
  if (plan) {
    whereConditions.push(eq(clientProfiles.plan, plan as ClientPlan));
    appliedFilters.push(`Plan: ${plan}`);
  }

  // Account type filter
  if (accountType) {
    whereConditions.push(eq(clientProfiles.accountType, accountType as ClientAccountType));
    appliedFilters.push(`Type: ${accountType}`);
  }

  // Provider filter
  if (provider) {
    whereConditions.push(
      sql`exists (
        select 1
        from ${accounts}
        where ${accounts.userId} = ${clientProfiles.userId}
          and ${accounts.provider} = ${provider}
      )`
    );
    appliedFilters.push(`Provider: ${provider}`);
  }

  // Date range filters
  if (dateRange?.startDate) {
    whereConditions.push(gte(clientProfiles.createdAt, dateRange.startDate));
    appliedFilters.push(`Created after: ${dateRange.startDate.toLocaleDateString()}`);
  }

  if (dateRange?.endDate) {
    whereConditions.push(lte(clientProfiles.createdAt, dateRange.endDate));
    appliedFilters.push(`Created before: ${dateRange.endDate.toLocaleDateString()}`);
  }

  if (createdAfter) {
    whereConditions.push(gte(clientProfiles.createdAt, createdAfter));
    appliedFilters.push(`Created after: ${createdAfter.toLocaleDateString()}`);
  }

  if (createdBefore) {
    whereConditions.push(lte(clientProfiles.createdAt, createdBefore));
    appliedFilters.push(`Created before: ${createdBefore.toLocaleDateString()}`);
  }

  if (updatedAfter) {
    whereConditions.push(gte(clientProfiles.updatedAt, updatedAfter));
    appliedFilters.push(`Updated after: ${updatedAfter.toLocaleDateString()}`);
  }

  if (updatedBefore) {
    whereConditions.push(lte(clientProfiles.updatedAt, updatedBefore));
    appliedFilters.push(`Updated before: ${updatedBefore.toLocaleDateString()}`);
  }

  // Field-specific searches
  if (emailDomain) {
    whereConditions.push(sql`${clientProfiles.email} ILIKE ${`%@${emailDomain}%`}`);
    appliedFilters.push(`Email domain: ${emailDomain}`);
  }

  if (companySearch) {
    const escapedCompany = companySearch.replace(/\\/g, '\\\\').replace(/[%_]/g, '\\$&');
    whereConditions.push(sql`${clientProfiles.company} ILIKE ${`%${escapedCompany}%`}`);
    appliedFilters.push(`Company: "${companySearch}"`);
  }

  if (locationSearch) {
    const escapedLocation = locationSearch.replace(/\\/g, '\\\\').replace(/[%_]/g, '\\$&');
    whereConditions.push(sql`${clientProfiles.location} ILIKE ${`%${escapedLocation}%`}`);
    appliedFilters.push(`Location: "${locationSearch}"`);
  }

  if (industrySearch) {
    const escapedIndustry = industrySearch.replace(/\\/g, '\\\\').replace(/[%_]/g, '\\$&');
    whereConditions.push(sql`${clientProfiles.industry} ILIKE ${`%${escapedIndustry}%`}`);
    appliedFilters.push(`Industry: "${industrySearch}"`);
  }

  // Numeric filters
  if (minSubmissions !== undefined) {
    whereConditions.push(gte(clientProfiles.totalSubmissions, minSubmissions));
    appliedFilters.push(`Min submissions: ${minSubmissions}`);
  }

  if (maxSubmissions !== undefined) {
    whereConditions.push(lte(clientProfiles.totalSubmissions, maxSubmissions));
    appliedFilters.push(`Max submissions: ${maxSubmissions}`);
  }

  // Boolean filters
  if (hasAvatar !== undefined) {
    if (hasAvatar) {
      whereConditions.push(sql`${clientProfiles.avatar} IS NOT NULL AND ${clientProfiles.avatar} != ''`);
    } else {
      whereConditions.push(sql`(${clientProfiles.avatar} IS NULL OR ${clientProfiles.avatar} = '')`);
    }
    appliedFilters.push(`Has avatar: ${hasAvatar}`);
  }

  if (hasWebsite !== undefined) {
    if (hasWebsite) {
      whereConditions.push(sql`${clientProfiles.website} IS NOT NULL AND ${clientProfiles.website} != ''`);
    } else {
      whereConditions.push(sql`(${clientProfiles.website} IS NULL OR ${clientProfiles.website} = '')`);
    }
    appliedFilters.push(`Has website: ${hasWebsite}`);
  }

  if (hasPhone !== undefined) {
    if (hasPhone) {
      whereConditions.push(sql`${clientProfiles.phone} IS NOT NULL AND ${clientProfiles.phone} != ''`);
    } else {
      whereConditions.push(sql`(${clientProfiles.phone} IS NULL OR ${clientProfiles.phone} = '')`);
    }
    appliedFilters.push(`Has phone: ${hasPhone}`);
  }

  if (emailVerified !== undefined) {
    whereConditions.push(eq(clientProfiles.emailVerified, emailVerified));
    appliedFilters.push(`Email verified: ${emailVerified}`);
  }

  if (twoFactorEnabled !== undefined) {
    whereConditions.push(eq(clientProfiles.twoFactorEnabled, twoFactorEnabled));
    appliedFilters.push(`2FA enabled: ${twoFactorEnabled}`);
  }

  const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;

  // Get total count
  const countResult = await db
    .select({ count: sql<number>`count(distinct ${clientProfiles.id})` })
    .from(clientProfiles)
    .leftJoin(accounts, eq(clientProfiles.userId, accounts.userId))
    .leftJoin(userRoles, eq(userRoles.userId, clientProfiles.userId))
    .leftJoin(roles, and(eq(userRoles.roleId, roles.id), eq(roles.isAdmin, true)))
    .where(whereClause ? and(whereClause, isNull(roles.id)) : isNull(roles.id));

  const total = Number((countResult[0] as unknown as { count: number })?.count || 0);

  // Build sort clause
  let sortClause;
  switch (sortBy) {
    case 'createdAt':
      sortClause = sortOrder === 'asc' ? asc(clientProfiles.createdAt) : desc(clientProfiles.createdAt);
      break;
    case 'updatedAt':
      sortClause = sortOrder === 'asc' ? asc(clientProfiles.updatedAt) : desc(clientProfiles.updatedAt);
      break;
    case 'name':
      sortClause = sortOrder === 'asc' ? asc(clientProfiles.name) : desc(clientProfiles.name);
      break;
    case 'email':
      sortClause = sortOrder === 'asc' ? asc(clientProfiles.email) : desc(clientProfiles.email);
      break;
    case 'company':
      sortClause = sortOrder === 'asc' ? asc(clientProfiles.company) : desc(clientProfiles.company);
      break;
    case 'totalSubmissions':
      sortClause = sortOrder === 'asc' ? asc(clientProfiles.totalSubmissions) : desc(clientProfiles.totalSubmissions);
      break;
    default:
      sortClause = desc(clientProfiles.createdAt);
  }

  // Get profiles with sorting
  const profiles = await db
    .select({
      id: clientProfiles.id,
      userId: clientProfiles.userId,
      email: clientProfiles.email,
      name: clientProfiles.name,
      displayName: clientProfiles.displayName,
      username: clientProfiles.username,
      bio: clientProfiles.bio,
      jobTitle: clientProfiles.jobTitle,
      company: clientProfiles.company,
      industry: clientProfiles.industry,
      phone: clientProfiles.phone,
      website: clientProfiles.website,
      location: clientProfiles.location,
      avatar: clientProfiles.avatar,
      accountType: clientProfiles.accountType,
      status: clientProfiles.status,
      plan: clientProfiles.plan,
      timezone: clientProfiles.timezone,
      language: clientProfiles.language,
      twoFactorEnabled: clientProfiles.twoFactorEnabled,
      emailVerified: clientProfiles.emailVerified,
      totalSubmissions: clientProfiles.totalSubmissions,
      notes: clientProfiles.notes,
      tags: clientProfiles.tags,
      createdAt: clientProfiles.createdAt,
      updatedAt: clientProfiles.updatedAt,
      accountProvider: sql<string>`coalesce(
        (SELECT provider FROM ${accounts}
         WHERE ${accounts.userId} = ${clientProfiles.userId}
         LIMIT 1),
        'unknown'
      )`
    })
    .from(clientProfiles)
    .leftJoin(userRoles, eq(userRoles.userId, clientProfiles.userId))
    .leftJoin(roles, and(eq(userRoles.roleId, roles.id), eq(roles.isAdmin, true)))
    .where(whereClause ? and(whereClause, isNull(roles.id)) : isNull(roles.id))
    .orderBy(sortClause)
    .limit(limit)
    .offset(offset);

  // Transform to enhanced type
  const enhancedProfiles: ClientProfileWithAuth[] = profiles.map((profile: (typeof profiles)[0]) => ({
    ...profile,
    accountType: profile.accountType || 'individual',
    isActive: profile.status === 'active'
  }));

  return {
    clients: enhancedProfiles,
    pagination: {
      page,
      totalPages: Math.ceil(total / limit),
      total,
      limit
    },
    searchMetadata: {
      appliedFilters,
      searchTime: Date.now(),
      resultCount: total
    }
  };
}
