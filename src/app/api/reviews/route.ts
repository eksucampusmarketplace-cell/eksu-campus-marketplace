import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { searchParams } = new URL(req.url);
  const sellerId = searchParams.get("seller_id");

  if (!sellerId) {
    return NextResponse.json(
      { error: "seller_id is required" },
      { status: 400 }
    );
  }

  const { data: reviews } = await supabase
    .from("reviews")
    .select("*, reviewer:reviewer_id(full_name, username, avatar_url)")
    .eq("seller_id", sellerId)
    .order("created_at", { ascending: false });

  const allReviews = reviews || [];
  const avgRating =
    allReviews.length > 0
      ? allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length
      : 0;

  return NextResponse.json({
    reviews: allReviews,
    average_rating: Math.round(avgRating * 10) / 10,
    total_reviews: allReviews.length,
  });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { seller_id, listing_id, rating, comment } = await req.json();

  if (!seller_id || !rating || rating < 1 || rating > 5) {
    return NextResponse.json(
      { error: "Valid seller_id and rating (1-5) are required" },
      { status: 400 }
    );
  }

  if (seller_id === user.id) {
    return NextResponse.json(
      { error: "Cannot review yourself" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("reviews")
    .upsert(
      {
        reviewer_id: user.id,
        seller_id,
        listing_id: listing_id || null,
        rating,
        comment: comment || null,
      },
      { onConflict: "reviewer_id,listing_id" }
    )
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ review: data });
}
