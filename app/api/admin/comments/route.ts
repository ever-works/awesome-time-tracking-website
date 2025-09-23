import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db/drizzle";
import { comments, clientProfiles } from "@/lib/db/schema";
import { and, count, desc, eq, isNull, sql, type SQL } from "drizzle-orm";
import { checkDatabaseAvailability } from "@/lib/utils/database-check";

export const runtime = "nodejs";

interface ListResponseUser {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
}

interface ListResponseComment {
  id: string;
  content: string;
  rating: number | null;
  userId: string;
  itemId: string;
  createdAt: Date | null;
  updatedAt: Date | null;
  user: ListResponseUser;
}


export async function GET(request: Request) {
  try {
    // Check database availability first
    const dbCheck = checkDatabaseAvailability();
    if (dbCheck) return dbCheck;

    const session = await auth();
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get("page") || 1);
    const limit = Number(searchParams.get("limit") || 10);
    const search = (searchParams.get("search") || "").trim();
    const offset = (page - 1) * limit;

    const whereConditions: SQL[] = [isNull(comments.deletedAt)];
    if (search) {
      const escaped = search.replace(/\\/g, "\\\\").replace(/[%_]/g, "\\$&");
      whereConditions.push(
        sql`(${comments.content} ILIKE ${`%${escaped}%`} OR ${clientProfiles.name} ILIKE ${`%${escaped}%`} OR ${clientProfiles.email} ILIKE ${`%${escaped}%`})`
      );
    }
    const whereClause = whereConditions.length > 1 ? and(...whereConditions) : whereConditions[0];

    // Get total count - we need to recreate the where clause for count query
    const countWhereConditions: SQL[] = [isNull(comments.deletedAt)];
    if (search) {
      const escaped = search.replace(/[%_\\]/g, '\\$&');
      // For count, we need to check if user exists via subquery instead of join
      countWhereConditions.push(
        sql`(${comments.content} ILIKE ${`%${escaped}%`} OR EXISTS (
          SELECT 1 FROM ${clientProfiles}
          WHERE ${clientProfiles.id} = ${comments.userId}
          AND (${clientProfiles.name} ILIKE ${`%${escaped}%`} OR ${clientProfiles.email} ILIKE ${`%${escaped}%`})
        ))`
      );
    }
    const countWhereClause = countWhereConditions.length > 1 ? and(...countWhereConditions) : countWhereConditions[0];

    const totalResult = await db
      .select({ count: count() })
      .from(comments)
      .where(countWhereClause);
    const total = Number(totalResult[0]?.count || 0);

    const rows = await db
      .select({
        id: comments.id,
        content: comments.content,
        rating: comments.rating,
        userId: comments.userId,
        itemId: comments.itemId,
        createdAt: comments.createdAt,
        updatedAt: comments.updatedAt,
        user: {
          id: clientProfiles.id,
          name: clientProfiles.name,
          email: clientProfiles.email,
          image: clientProfiles.avatar,
        },
      })
      .from(comments)
      .leftJoin(clientProfiles, eq(comments.userId, clientProfiles.id))
      .where(whereClause)
      .orderBy(desc(comments.createdAt))
      .limit(limit)
      .offset(offset);

    const data: ListResponseComment[] = rows.map((r: any) => ({
      id: r.id,
      content: r.content ?? "",
      rating: r.rating ?? null,
      userId: r.userId ?? "",
      itemId: r.itemId ?? "",
      createdAt: r.createdAt ?? null,
      updatedAt: r.updatedAt ?? null,
      user: r.user
        ? {
            id: r.user.id ?? "",
            name: r.user.name ?? null,
            email: r.user.email ?? null,
            image: r.user.image ?? null,
          }
        : {
            id: "",
            name: "Unknown User",
            email: "",
            image: null,
          },
    }));

    return NextResponse.json({
      comments: data,
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    });
  } catch (error) {
    console.error("Failed to list comments:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}


