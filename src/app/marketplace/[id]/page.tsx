"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  MapPin,
  Clock,
  MessageCircle,
  Heart,
  Share2,
  ShieldCheck,
  Tag,
  Star,
  Loader2,
  Send,
  Flag,
  Ban,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { products as mockProducts } from "@/data/mock";
import ProductCard from "@/components/ProductCard";
import { useAuth } from "@/contexts/AuthContext";
import { createClient } from "@/lib/supabase/client";

interface ReviewWithProfile {
  id: string;
  reviewer_id: string;
  seller_id: string;
  listing_id: string | null;
  rating: number;
  comment: string | null;
  created_at: string;
  reviewer?: {
    full_name: string;
    avatar_url: string | null;
  };
}

function StarRating({
  rating,
  onRate,
  size = "sm",
}: {
  rating: number;
  onRate?: (r: number) => void;
  size?: "sm" | "lg";
}) {
  const sz = size === "lg" ? "w-6 h-6" : "w-4 h-4";
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onRate?.(star)}
          disabled={!onRate}
          className={onRate ? "cursor-pointer" : "cursor-default"}
        >
          <Star
            className={`${sz} ${
              star <= rating
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-300"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

function timeAgo(dateStr: string) {
  const seconds = Math.floor(
    (Date.now() - new Date(dateStr).getTime()) / 1000
  );
  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const supabase = createClient();

  const [product, setProduct] = useState<Record<string, unknown> | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<
    Record<string, unknown>[]
  >([]);
  const [reviews, setReviews] = useState<ReviewWithProfile[]>([]);
  const [avgRating, setAvgRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [loading, setLoading] = useState(true);
  const [useMock, setUseMock] = useState(false);

  // Review form
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const [reviewSuccess, setReviewSuccess] = useState(false);

  // Image gallery
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Report/Block
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [blockingUser, setBlockingUser] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);

  const fetchProduct = useCallback(async () => {
    const { data, error } = await supabase
      .from("products")
      .select("*, seller:profiles(*)")
      .eq("id", id)
      .single();

    if (error || !data) {
      const mock = mockProducts.find((p) => p.id === id);
      if (mock) {
        setProduct(mock as unknown as Record<string, unknown>);
        const related = mockProducts
          .filter((p) => p.category === mock.category && p.id !== mock.id)
          .slice(0, 4);
        setRelatedProducts(related as unknown as Record<string, unknown>[]);
        setUseMock(true);
      }
    } else {
      setProduct(data);
      // Fetch related
      const { data: related } = await supabase
        .from("products")
        .select("*, seller:profiles(*)")
        .eq("category", data.category)
        .neq("id", data.id)
        .eq("is_active", true)
        .limit(4);
      setRelatedProducts(related || []);
    }
    setLoading(false);
  }, [id, supabase]);

  const fetchReviews = useCallback(async () => {
    if (useMock || !product) return;

    const sellerId =
      (product as Record<string, unknown>).seller_id as string | undefined;
    if (!sellerId) return;

    const res = await fetch(`/api/reviews?seller_id=${sellerId}`);
    if (res.ok) {
      const data = await res.json();
      setReviews(data.reviews || []);
      setAvgRating(data.average_rating || 0);
      setTotalReviews(data.total_reviews || 0);
    }
  }, [product, useMock]);

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  useEffect(() => {
    if (product) fetchReviews();
  }, [product, fetchReviews]);

  useEffect(() => {
    if (!user || !product) return;
    const sellerId = (product as Record<string, unknown>).seller_id as string;
    if (!sellerId || sellerId === user.id) return;

    const checkBlocked = async () => {
      const res = await fetch("/api/users/block");
      if (res.ok) {
        const data = await res.json();
        const blocked = (data.blocks || []).some(
          (b: { blocked_id: string }) => b.blocked_id === sellerId
        );
        setIsBlocked(blocked);
      }
    };
    checkBlocked();
  }, [user, product]);

  const handleBlockUser = async () => {
    if (!user || !product) return;
    const sellerId = (product as Record<string, unknown>).seller_id as string;
    if (!sellerId) return;

    setBlockingUser(true);
    if (isBlocked) {
      await fetch(`/api/users/block?blocked_id=${sellerId}`, { method: "DELETE" });
      setIsBlocked(false);
    } else {
      await fetch("/api/users/block", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blocked_id: sellerId, reason: "Blocked from product page" }),
      });
      setIsBlocked(true);
    }
    setBlockingUser(false);
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !product || reviewRating === 0) return;

    setSubmittingReview(true);
    setReviewError("");
    setReviewSuccess(false);

    const sellerId = (product as Record<string, unknown>).seller_id as string;
    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        seller_id: sellerId,
        listing_id: id,
        rating: reviewRating,
        comment: reviewComment || null,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      setReviewError(data.error || "Failed to submit review");
    } else {
      setReviewSuccess(true);
      setReviewRating(0);
      setReviewComment("");
      fetchReviews();
    }
    setSubmittingReview(false);
  };

  const handleReport = async () => {
    if (!reportReason.trim()) return;
    setReportSubmitting(true);
    // Submit report via security reports
    await supabase.from("security_reports").insert({
      reporter_id: user?.id || null,
      title: `Product Report: ${(product as Record<string, unknown>)?.title || id}`,
      description: reportReason,
      category: "other",
      severity: "medium",
      location: "Marketplace",
      is_anonymous: !user,
    });
    setReportSubmitting(false);
    setShowReportModal(false);
    setReportReason("");
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 text-center">
        <p className="text-gray-500 text-lg">Product not found</p>
        <Link
          href="/marketplace"
          className="mt-4 inline-block text-green-600 font-medium hover:text-green-700"
        >
          Back to Marketplace
        </Link>
      </div>
    );
  }

  // Handle both mock and DB product shapes
  const p = product as Record<string, unknown>;
  const title = (p.title as string) || "";
  const price = (p.price as number) || 0;
  const description = (p.description as string) || "";
  const category = (p.category as string) || "";
  const condition = (p.condition as string) || "";
  const location = (p.location as string) || "EKSU Campus";
  const createdAt =
    (p.createdAt as string) ||
    (p.created_at ? timeAgo(p.created_at as string) : "");
  const isPromoted = (p.is_promoted as boolean) || false;

  // Images handling
  const images: string[] = [];
  if (p.image) images.push(p.image as string);
  if (p.images && Array.isArray(p.images)) {
    (p.images as string[]).forEach((img) => {
      if (img && !images.includes(img)) images.push(img);
    });
  }
  if (images.length === 0)
    images.push("https://via.placeholder.com/400");

  // Seller info
  const seller = p.seller as Record<string, unknown> | undefined;
  const sellerName =
    (seller?.full_name as string) || (seller?.name as string) || "Seller";
  const sellerAvatar =
    (seller?.avatar_url as string) ||
    (seller?.avatar as string) ||
    `https://api.dicebear.com/9.x/initials/svg?seed=${sellerName}`;
  const sellerDepartment =
    (seller?.department as string) || "";
  const sellerLevel = (seller?.level as string) || "";
  const sellerId = (p.seller_id as string) || (seller?.id as string) || "";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 pb-24 md:pb-6">
      <Link
        href="/marketplace"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Marketplace
      </Link>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Image Gallery */}
        <div className="space-y-3">
          <div className="relative aspect-square rounded-xl overflow-hidden bg-gray-100">
            {isPromoted && (
              <div className="absolute top-3 left-3 z-10 flex items-center gap-1 px-2 py-1 bg-amber-500 text-white text-xs font-medium rounded-full">
                <Sparkles className="w-3 h-3" />
                Featured
              </div>
            )}
            <img
              src={images[currentImageIndex]}
              alt={title}
              className="w-full h-full object-cover"
            />
            {images.length > 1 && (
              <>
                <button
                  onClick={() =>
                    setCurrentImageIndex((i) =>
                      i === 0 ? images.length - 1 : i - 1
                    )
                  }
                  className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 bg-black/50 text-white rounded-full hover:bg-black/70"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() =>
                    setCurrentImageIndex((i) =>
                      i === images.length - 1 ? 0 : i + 1
                    )
                  }
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-black/50 text-white rounded-full hover:bg-black/70"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {images.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentImageIndex(i)}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        i === currentImageIndex ? "bg-white" : "bg-white/50"
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
          {images.length > 1 && (
            <div className="grid grid-cols-6 gap-2">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentImageIndex(i)}
                  className={`aspect-square rounded-lg overflow-hidden border-2 transition-colors ${
                    i === currentImageIndex
                      ? "border-green-500"
                      : "border-transparent"
                  }`}
                >
                  <img
                    src={img}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div>
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
                {category}
              </span>
              <h1 className="text-2xl font-bold text-gray-900 mt-3">
                {title}
              </h1>
            </div>
            <div className="flex gap-2">
              <button className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors">
                <Heart className="w-5 h-5" />
              </button>
              <button className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-full transition-colors">
                <Share2 className="w-5 h-5" />
              </button>
              <button
                onClick={() => setShowReportModal(true)}
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                title="Report this listing"
              >
                <Flag className="w-5 h-5" />
              </button>
              {user && sellerId && user.id !== sellerId && (
                <button
                  onClick={handleBlockUser}
                  disabled={blockingUser}
                  className={`p-2 rounded-full transition-colors ${
                    isBlocked
                      ? "text-red-500 bg-red-50 hover:bg-red-100"
                      : "text-gray-400 hover:text-red-500 hover:bg-red-50"
                  }`}
                  title={isBlocked ? "Unblock this seller" : "Block this seller"}
                >
                  <Ban className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>

          <p className="text-3xl font-bold text-green-700 mt-4">
            ₦{price.toLocaleString()}
          </p>

          <div className="flex flex-wrap gap-4 mt-4 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              {location}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {createdAt}
            </span>
            <span className="flex items-center gap-1">
              <Tag className="w-4 h-4" />
              {condition}
            </span>
          </div>

          {/* Seller Rating Summary */}
          {!useMock && totalReviews > 0 && (
            <div className="flex items-center gap-2 mt-3">
              <StarRating rating={Math.round(avgRating)} />
              <span className="text-sm text-gray-600">
                {avgRating.toFixed(1)} ({totalReviews} review
                {totalReviews !== 1 ? "s" : ""})
              </span>
            </div>
          )}

          <div className="mt-6">
            <h2 className="font-semibold text-gray-900">Description</h2>
            <p className="text-gray-600 text-sm mt-2 leading-relaxed">
              {description}
            </p>
          </div>

          {/* Seller info */}
          <div className="mt-6 p-4 bg-gray-50 rounded-xl">
            <div className="flex items-center gap-3">
              <img
                src={sellerAvatar}
                alt={sellerName}
                className="w-12 h-12 rounded-full bg-gray-200"
              />
              <div>
                <p className="font-semibold text-gray-900">{sellerName}</p>
                <p className="text-sm text-gray-500">
                  {sellerDepartment}
                  {sellerLevel && ` · ${sellerLevel}`}
                </p>
              </div>
              <div className="ml-auto flex items-center gap-1 text-green-600 text-xs">
                <ShieldCheck className="w-4 h-4" />
                Verified
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-6 flex gap-3">
            <Link
              href="/messages"
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors"
            >
              <MessageCircle className="w-5 h-5" />
              Message Seller
            </Link>
            <button className="px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors">
              Make Offer
            </button>
          </div>

          <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
            <p className="text-xs text-yellow-800">
              <strong>Safety tip:</strong> Always meet in a public place on
              campus. Never send money before seeing the item. Report suspicious
              listings.
            </p>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      {!useMock && (
        <div className="mt-12">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-400" />
            Reviews & Ratings
            {totalReviews > 0 && (
              <span className="text-sm font-normal text-gray-500">
                ({totalReviews} review{totalReviews !== 1 ? "s" : ""})
              </span>
            )}
          </h2>

          {/* Review Summary */}
          {totalReviews > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <p className="text-4xl font-bold text-gray-900">
                    {avgRating.toFixed(1)}
                  </p>
                  <StarRating rating={Math.round(avgRating)} size="lg" />
                  <p className="text-sm text-gray-500 mt-1">
                    {totalReviews} review{totalReviews !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Submit Review Form */}
          {user && sellerId && user.id !== sellerId && (
            <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
              <h3 className="font-semibold text-gray-900 mb-4">
                Leave a Review
              </h3>
              <form onSubmit={handleSubmitReview} className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-2">
                    Your Rating
                  </label>
                  <StarRating
                    rating={reviewRating}
                    onRate={setReviewRating}
                    size="lg"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">
                    Comment (optional)
                  </label>
                  <textarea
                    rows={3}
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Share your experience with this seller..."
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                  />
                </div>
                {reviewError && (
                  <p className="text-sm text-red-600">{reviewError}</p>
                )}
                {reviewSuccess && (
                  <p className="text-sm text-green-600">
                    Review submitted successfully!
                  </p>
                )}
                <button
                  type="submit"
                  disabled={submittingReview || reviewRating === 0}
                  className="flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white font-medium text-sm rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                >
                  {submittingReview ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  Submit Review
                </button>
              </form>
            </div>
          )}

          {/* Reviews List */}
          {reviews.length > 0 ? (
            <div className="space-y-4">
              {reviews.map((review) => (
                <div
                  key={review.id}
                  className="bg-white rounded-xl border border-gray-200 p-4"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <img
                      src={
                        review.reviewer?.avatar_url ||
                        `https://api.dicebear.com/9.x/initials/svg?seed=${review.reviewer?.full_name || "U"}`
                      }
                      alt={review.reviewer?.full_name || "User"}
                      className="w-10 h-10 rounded-full bg-gray-200"
                    />
                    <div>
                      <p className="font-medium text-gray-900 text-sm">
                        {review.reviewer?.full_name || "Anonymous"}
                      </p>
                      <div className="flex items-center gap-2">
                        <StarRating rating={review.rating} />
                        <span className="text-xs text-gray-400">
                          {timeAgo(review.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                  {review.comment && (
                    <p className="text-sm text-gray-600">{review.comment}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 bg-white rounded-xl border border-gray-200">
              <Star className="w-12 h-12 text-gray-200 mx-auto" />
              <p className="text-gray-500 mt-2">No reviews yet</p>
              <p className="text-gray-400 text-sm">
                Be the first to review this seller
              </p>
            </div>
          )}
        </div>
      )}

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="mt-12">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Similar Products
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {relatedProducts.map((rp) => (
              <ProductCard
                key={rp.id as string}
                product={rp as { id: string; title: string; price: number }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Flag className="w-5 h-5 text-red-500" />
              Report This Listing
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Help keep the marketplace safe by reporting inappropriate listings
            </p>
            <textarea
              rows={4}
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              placeholder="Describe the issue..."
              className="w-full mt-4 px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setShowReportModal(false)}
                className="flex-1 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleReport}
                disabled={reportSubmitting || !reportReason.trim()}
                className="flex-1 py-2.5 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 text-sm flex items-center justify-center gap-2"
              >
                {reportSubmitting && (
                  <Loader2 className="w-4 h-4 animate-spin" />
                )}
                Submit Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
