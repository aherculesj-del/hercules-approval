import { getPost } from "@/lib/post-cache";
import { NextResponse } from "next/server";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const postId = searchParams.get("id");
  
  if (!postId) {
    return NextResponse.json({ error: "ID nao fornecido" }, { status: 400 });
  }
  
  const data = getPost(postId);
  
  if (!data) {
    return NextResponse.json({ error: "Post nao encontrado" }, { status: 404 });
  }
  
  return NextResponse.json(data);
}
