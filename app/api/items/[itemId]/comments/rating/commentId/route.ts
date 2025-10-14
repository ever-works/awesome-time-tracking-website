import { NextResponse } from "next/server";
import { getCommentById, updateCommentRating } from "@/lib/db/queries";

export async function PATCH(request: Request, { params }: { params: Promise<{ itemId: string; commentId: string }> }) {
    try {
        const { commentId } = await params;
        const { rating } = await request.json();
        console.log("============rating=============>", rating);
        const comment = await updateCommentRating(commentId, rating);
        return NextResponse.json(comment);
    } catch (error) {
        console.error("Failed to update comment rating:", error);
        return NextResponse.json({ error: "Failed to update comment rating" }, { status: 500 });
    }
}   

export async function GET(request: Request, { params }: { params: Promise<{ itemId: string; commentId: string }> }) {
    const { commentId } = await params;
    const comment = await getCommentById(commentId);
    return NextResponse.json(comment);
}