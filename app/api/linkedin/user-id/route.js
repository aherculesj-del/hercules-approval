import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const response = await fetch("https://api.linkedin.com/v2/me", {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${process.env.LINKEDIN_ACCESS_TOKEN}`,
        "Accept": "application/json",
        "X-Requested-With": "XMLHttpRequest",
        "X-LinkedIn-Auth-Version": "2",
      }
    });

    const data = await response.json();

    return NextResponse.json({
      success: true,
      userId: data.id || data.entityUrn,
      rawData: data,
      message: "✅ User ID encontrado!"
    });

  } catch (error) {
    return NextResponse.json({ error: error.message, details: error }, { status: 500 });
  }
}