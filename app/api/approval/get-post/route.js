import { NextResponse } from "next/server";

const postCache = new Map();

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const postId = searchParams.get("id");
  
  if (!postId) {
    return NextResponse.json({ error: "ID nao fornecido" }, { status: 400 });
  }
  
  const data = postCache.get(postId);
  
  if (!data) {
    return NextResponse.json({ error: "Post nao encontrado" }, { status: 404 });
  }
  
  return NextResponse.json(data);
}

export function setPostCache(postId, data) {
  postCache.set(postId, data);
}
