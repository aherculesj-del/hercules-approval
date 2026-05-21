import { getPostById } from "@/lib/post-storage";
import { NextResponse } from "next/server";

export async function GET(request, { params }) {
  try {
    const { id } = params;
    const post = getPostById(id);
    
    if (!post) {
      return NextResponse.json(
        { error: "Post não encontrado", postId: id },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, post });
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}