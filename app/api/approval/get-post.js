import { NextResponse } from "next/server";

const postCache = new Map();

export async function POST(request) {
  const { postId, data } = await request.json();
  postCache.set(postId, data);
  return NextResponse.json({ success: true });
}

export async function GET(request, { params }) {
  const { id } = params;
  const data = postCache.get(id);
  
  if (!data) {
    return NextResponse.json({ error: "Post não encontrado" }, { status: 404 });
  }
  
  return NextResponse.json(data);
}
