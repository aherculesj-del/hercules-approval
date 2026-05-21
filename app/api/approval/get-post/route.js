import { kv } from "@vercel/kv";
import { NextResponse } from "next/server";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const postId = searchParams.get("id");
  
  if (!postId) {
    return NextResponse.json({ error: "ID nao fornecido" }, { status: 400 });
  }
  
  try {
    const data = await kv.get(postId);
    
    if (!data) {
      return NextResponse.json({ error: "Post nao encontrado" }, { status: 404 });
    }
    
    return NextResponse.json(JSON.parse(data));
  } catch (error) {
    console.error("Erro ao buscar do KV:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
