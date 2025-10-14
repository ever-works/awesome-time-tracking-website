import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { ItemRepository } from '@/lib/repositories/item.repository';
import { UpdateItemRequest } from '@/lib/types/item';

const itemRepository = new ItemRepository();

/**
 * @swagger
 * /api/admin/items/{id}:
 *   get:
 *     tags: ["Admin - Items"]
 *     summary: "Get item by ID"
 *     description: "Retrieves a specific item by its ID with complete details including metadata, status, categories, tags, and all associated information. Requires admin privileges."
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - name: "id"
 *         in: "path"
 *         required: true
 *         schema:
 *           type: string
 *         description: "Item ID"
 *         example: "item_123abc"
 *     responses:
 *       200:
 *         description: "Item retrieved successfully"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: "#/components/schemas/Item"
 *               required: ["success", "data"]
 *             example:
 *               success: true
 *               data:
 *                 id: "item_123abc"
 *                 name: "Awesome Productivity Tool"
 *                 slug: "awesome-productivity-tool"
 *                 description: "A powerful tool to boost your productivity"
 *                 source_url: "https://example.com/tool"
 *                 category: ["productivity", "business"]
 *                 tags: ["saas", "productivity", "collaboration"]
 *                 featured: true
 *                 icon_url: "https://example.com/icon.png"
 *                 status: "approved"
 *                 created_at: "2024-01-20T10:30:00.000Z"
 *                 updated_at: "2024-01-20T14:45:00.000Z"
 *                 review_notes: "Great tool, approved for listing"
 *                 views: 1234
 *                 votes: 89
 *                 rating: 4.5
 *       401:
 *         description: "Unauthorized - Admin access required"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Unauthorized. Admin access required."
 *       404:
 *         description: "Item not found"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Item not found"
 *       500:
 *         description: "Internal server error"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Failed to fetch item"
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check admin authentication
    const session = await auth();
    if (!session?.user?.isAdmin) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Admin access required." },
        { status: 401 }
      );
    }

    const resolvedParams = await params;
    const item = await itemRepository.findById(resolvedParams.id);
    
    if (!item) {
      return NextResponse.json(
        { success: false, error: "Item not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: item,
    });

  } catch (error) {
    console.error('Failed to fetch item:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch item' 
      },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/admin/items/{id}:
 *   put:
 *     tags: ["Admin - Items"]
 *     summary: "Update item"
 *     description: "Updates a specific item's properties including name, description, categories, tags, status, and other metadata. All fields are optional and only provided fields will be updated. Requires admin privileges."
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - name: "id"
 *         in: "path"
 *         required: true
 *         schema:
 *           type: string
 *         description: "Item ID"
 *         example: "item_123abc"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: "Item name"
 *                 example: "Updated Productivity Tool"
 *               slug:
 *                 type: string
 *                 description: "URL-friendly slug"
 *                 example: "updated-productivity-tool"
 *               description:
 *                 type: string
 *                 description: "Item description"
 *                 example: "An enhanced tool to boost your productivity"
 *               source_url:
 *                 type: string
 *                 format: uri
 *                 description: "Source URL of the item"
 *                 example: "https://example.com/updated-tool"
 *               category:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: "Item categories"
 *                 example: ["productivity", "business", "automation"]
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: "Item tags"
 *                 example: ["saas", "productivity", "automation", "ai"]
 *               featured:
 *                 type: boolean
 *                 description: "Whether the item is featured"
 *                 example: true
 *               icon_url:
 *                 type: string
 *                 format: uri
 *                 description: "URL to the item's icon"
 *                 example: "https://example.com/updated-icon.png"
 *               status:
 *                 type: string
 *                 enum: ["draft", "pending", "approved", "rejected"]
 *                 description: "Item status"
 *                 example: "approved"
 *     responses:
 *       200:
 *         description: "Item updated successfully"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: "#/components/schemas/Item"
 *                 message:
 *                   type: string
 *                   description: "Success message"
 *                   example: "Item updated successfully"
 *               required: ["success", "data", "message"]
 *             example:
 *               success: true
 *               data:
 *                 id: "item_123abc"
 *                 name: "Updated Productivity Tool"
 *                 slug: "updated-productivity-tool"
 *                 description: "An enhanced tool to boost your productivity"
 *                 source_url: "https://example.com/updated-tool"
 *                 category: ["productivity", "business", "automation"]
 *                 tags: ["saas", "productivity", "automation", "ai"]
 *                 featured: true
 *                 icon_url: "https://example.com/updated-icon.png"
 *                 status: "approved"
 *                 created_at: "2024-01-20T10:30:00.000Z"
 *                 updated_at: "2024-01-20T16:45:00.000Z"
 *               message: "Item updated successfully"
 *       401:
 *         description: "Unauthorized - Admin access required"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Unauthorized. Admin access required."
 *       404:
 *         description: "Item not found"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Item not found"
 *       500:
 *         description: "Internal server error"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Failed to update item"
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check admin authentication
    const session = await auth();
    if (!session?.user?.isAdmin) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Admin access required." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const resolvedParams = await params;
    const updateData: UpdateItemRequest = {
      id: resolvedParams.id,
      ...body,
    };

    const item = await itemRepository.update(resolvedParams.id, updateData);

    return NextResponse.json({
      success: true,
      data: item,
      message: "Item updated successfully",
    });

  } catch (error) {
    console.error('Failed to update item:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to update item' 
      },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/admin/items/{id}:
 *   delete:
 *     tags: ["Admin - Items"]
 *     summary: "Delete item"
 *     description: "Permanently deletes a specific item from the system. This action cannot be undone. All associated data including votes, comments, and analytics will be removed. Requires admin privileges."
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - name: "id"
 *         in: "path"
 *         required: true
 *         schema:
 *           type: string
 *         description: "Item ID to delete"
 *         example: "item_123abc"
 *     responses:
 *       200:
 *         description: "Item deleted successfully"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   description: "Success message"
 *                   example: "Item deleted successfully"
 *               required: ["success", "message"]
 *             example:
 *               success: true
 *               message: "Item deleted successfully"
 *       401:
 *         description: "Unauthorized - Admin access required"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Unauthorized. Admin access required."
 *       404:
 *         description: "Item not found"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Item not found"
 *       500:
 *         description: "Internal server error"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Failed to delete item"
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check admin authentication
    const session = await auth();
    if (!session?.user?.isAdmin) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Admin access required." },
        { status: 401 }
      );
    }

    const resolvedParams = await params;
    await itemRepository.delete(resolvedParams.id);

    return NextResponse.json({
      success: true,
      message: "Item deleted successfully",
    });

  } catch (error) {
    console.error('Failed to delete item:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to delete item' 
      },
      { status: 500 }
    );
  }
} 