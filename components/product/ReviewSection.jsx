"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth, useClerk, useUser } from "@clerk/nextjs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Spinner } from "@heroui/react";
import {
  ArrowLeftRight,
  EyeOff,
  Flag,
  MessageSquareText,
  PencilLine,
  ShieldCheck,
  Star,
  Trash2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import toast from "react-hot-toast";
import { useUserStore } from "@/store/useUserStore";
import {
  adminDeleteReviewRequest,
  adminFetchProductReviewsRequest,
  adminFetchRatingStatsRequest,
  adminHideReviewRequest,
  adminUnhideReviewRequest,
  createReviewRequest,
  deleteReviewRequest,
  fetchProductRatingSummaryRequest,
  fetchProductReviewsRequest,
  fetchReviewEligibilityRequest,
  updateReviewRequest,
} from "@/lib/api/reviews";

const DEFAULT_FORM = {
  rating: 5,
  title: "",
  body: "",
};

const formatDate = (value) => {
  if (!value) return "";
  try {
    return new Date(value).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "";
  }
};

const getReviewerName = (name) => {
  const normalized = String(name || "").trim();
  if (!normalized || normalized.toLowerCase() === "new user") {
    return "Verified Customer";
  }
  return normalized;
};

const StarRating = ({ rating = 0, size = "w-4 h-4", interactive = false, onChange }) => {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, index) => {
        const active = index < Math.round(rating);
        const Icon = Star;
        return interactive ? (
          <button
            key={index}
            type="button"
            aria-label={`${index + 1} star${index === 0 ? "" : "s"}`}
            onClick={() => onChange?.(index + 1)}
            className={`${size} transition-transform hover:scale-110`}
          >
            <Icon className={`${size} ${active ? "fill-orange-400 text-orange-400" : "text-gray-300"}`} />
          </button>
        ) : (
          <Icon
            key={index}
            className={`${size} ${active ? "fill-orange-400 text-orange-400" : "text-gray-300"}`}
          />
        );
      })}
    </div>
  );
};

const RatingDistribution = ({ breakdown, totalReviews }) => {
  const maxCount = Math.max(...Object.values(breakdown || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }), 1);

  return (
    <div className="space-y-2">
      {[5, 4, 3, 2, 1].map((rating) => {
        const count = Number(breakdown?.[rating] || 0);
        const width = totalReviews > 0 ? Math.max((count / maxCount) * 100, count > 0 ? 8 : 0) : 0;

        return (
          <div key={rating} className="flex items-center gap-3 text-sm">
            <div className="w-16 flex items-center gap-1 text-gray-600">
              <span>{rating}</span>
              <Star className="w-3.5 h-3.5 fill-orange-400 text-orange-400" />
            </div>
            <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-linear-to-r from-orange-400 to-amber-500"
                style={{ width: `${width}%` }}
              />
            </div>
            <div className="w-14 text-right text-gray-500">{count}</div>
          </div>
        );
      })}
    </div>
  );
};

const ReviewCard = ({
  review,
  isOwnReview,
  isAdminView,
  onEdit,
  onDelete,
  onHide,
  onUnhide,
  onAdminDelete,
}) => (
  <article
    className={`rounded-2xl border p-4 shadow-sm transition-shadow hover:shadow-md ${
      review.isHidden ? "border-amber-200 bg-amber-50/40" : "border-gray-100 bg-white"
    }`}
  >
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-start gap-2.5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-orange-100 to-amber-100 text-xs font-semibold text-orange-700">
          {getReviewerName(review.userName)
            .split(" ")
            .map((part) => part[0])
            .slice(0, 2)
            .join("")
            .toUpperCase()}
        </div>
        <div>
          <div className="flex flex-wrap items-center gap-1.5">
            <p className="text-sm font-semibold text-gray-900">{getReviewerName(review.userName)}</p>
            {review.isVerifiedPurchase ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-semibold text-green-700">
                <ShieldCheck className="h-3 w-3" />
                Verified Purchase
              </span>
            ) : null}
            {review.isHidden ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                <EyeOff className="h-3 w-3" />
                Hidden
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-xs text-gray-500">{formatDate(review.createdAt)}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {isOwnReview && !isAdminView && (
          <>
            <button
              type="button"
              onClick={() => onEdit(review)}
              className="inline-flex items-center gap-1 rounded-full border border-gray-200 px-2.5 py-1 text-[11px] font-medium text-gray-700 hover:bg-gray-50"
            >
              <PencilLine className="h-3 w-3" />
              Edit
            </button>
            <button
              type="button"
              onClick={() => onDelete(review)}
              className="inline-flex items-center gap-1 rounded-full border border-red-200 px-2.5 py-1 text-[11px] font-medium text-red-600 hover:bg-red-50"
            >
              <Trash2 className="h-3 w-3" />
              Delete
            </button>
          </>
        )}

        {isAdminView && (
          <>
            {!review.isHidden ? (
              <button
                type="button"
                onClick={() => onHide(review)}
                className="inline-flex items-center gap-1 rounded-full border border-gray-200 px-2.5 py-1 text-[11px] font-medium text-gray-700 hover:bg-gray-50"
              >
                <EyeOff className="h-3 w-3" />
                Hide
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onUnhide(review)}
                className="inline-flex items-center gap-1 rounded-full border border-gray-200 px-2.5 py-1 text-[11px] font-medium text-gray-700 hover:bg-gray-50"
              >
                <ArrowLeftRight className="h-3 w-3" />
                Restore
              </button>
            )}
            <button
              type="button"
              onClick={() => onAdminDelete(review)}
              className="inline-flex items-center gap-1 rounded-full border border-red-200 px-2.5 py-1 text-[11px] font-medium text-red-600 hover:bg-red-50"
            >
              <Trash2 className="h-3 w-3" />
              Delete
            </button>
          </>
        )}
      </div>
    </div>

    <div className="mt-3 flex items-center gap-2">
      <StarRating rating={review.rating} size="w-3.5 h-3.5" />
      <span className="text-xs font-semibold text-gray-700">{review.rating.toFixed(1)}</span>
    </div>

    <h4 className="mt-2 text-sm font-semibold text-gray-900">{review.title}</h4>
    <p className="mt-1.5 whitespace-pre-wrap text-sm leading-5 text-gray-600">{review.body}</p>
  </article>
);

const ReviewForm = ({
  form,
  setForm,
  isSubmitting,
  isSignedIn,
  isAdminView,
  canReview,
  hasReviewed,
  isEligibilityLoading,
  onSubmit,
  onSignIn,
  onReset,
}) => {
  if (isAdminView && hasReviewed) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        <p className="font-semibold">Admin accounts cannot edit review content or ratings.</p>
        <p className="mt-1">
          You can still use the moderation tools below to hide, restore, or delete reviews.
        </p>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-4">
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-white p-2 text-orange-600 shadow-sm">
            <MessageSquareText className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-900">Write a review</h3>
            <p className="mt-1 text-sm text-gray-600">
              Sign in to share your experience with this product.
            </p>
            <button
              type="button"
              onClick={onSignIn}
              className="mt-3 inline-flex items-center gap-2 rounded-full bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700"
            >
              Sign in to review
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isSignedIn && isEligibilityLoading && !hasReviewed) {
    return (
      <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <Spinner size="sm" />
          <div>
            <p className="text-sm font-semibold text-gray-900">Checking your review access</p>
            <p className="mt-1 text-sm text-gray-600">
              Loading your delivery status and review eligibility.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!canReview && !hasReviewed) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        <p className="font-semibold">Review eligibility required</p>
        <p className="mt-1">
          Only customers with a delivered order containing this product can leave a review.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-gray-900">
            {hasReviewed ? "Edit your review" : "Write a review"}
          </h3>
          <p className="mt-1 text-sm text-gray-600">
            Share a quick title, rating, and a few details about how the product performed.
          </p>
        </div>
        {hasReviewed ? (
          <button
            type="button"
            onClick={onReset}
            className="text-sm font-medium text-gray-500 hover:text-gray-700"
          >
            Reset
          </button>
        ) : null}
      </div>

      <div className="mt-4 space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Rating</label>
          <StarRating
            rating={form.rating}
            interactive
            onChange={(value) => setForm((current) => ({ ...current, rating: value }))}
            size="w-4 h-4"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Title</label>
          <input
            value={form.title}
            onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
            placeholder="Short summary of your experience"
            className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-orange-500"
            maxLength={120}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Review</label>
          <textarea
            value={form.body}
            onChange={(event) => setForm((current) => ({ ...current, body: event.target.value }))}
            placeholder="Tell others what you liked, what could be better, and how you used it."
            className="min-h-28 w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-orange-500"
            maxLength={2000}
          />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 rounded-full bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting ? <Spinner size="sm" /> : null}
          {hasReviewed ? "Update review" : "Submit review"}
        </button>
        {hasReviewed ? (
          <p className="text-sm text-gray-500">
            You can edit or delete your review any time.
          </p>
        ) : null}
      </div>
    </form>
  );
};

export default function ReviewSection({
  productId,
  productName,
  initialSummary = null,
  initialReviews = null,
  initialEligibility = null,
}) {
  const { isSignedIn } = useAuth();
  const { user: clerkUser } = useUser();
  const { openSignIn } = useClerk();
  const isSeller = useUserStore((state) => state.isSeller);
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [editingReviewId, setEditingReviewId] = useState(null);

  const summaryQuery = useQuery({
    queryKey: ["review-summary", productId],
    queryFn: () => fetchProductRatingSummaryRequest(productId),
    enabled: !!productId,
    initialData: initialSummary || undefined,
    staleTime: 60 * 1000,
  });

  const eligibilityQuery = useQuery({
    queryKey: ["review-eligibility", productId],
    queryFn: () => fetchReviewEligibilityRequest(productId),
    enabled: !!productId && isSignedIn,
    initialData: initialEligibility || undefined,
    retry: false,
    staleTime: 30 * 1000,
  });

  const reviewListQuery = useQuery({
    queryKey: ["review-list", productId, page, isSeller],
    queryFn: () =>
      isSeller
        ? adminFetchProductReviewsRequest(productId, { page, limit: 5 })
        : fetchProductReviewsRequest(productId, { page, limit: 5 }),
    enabled: !!productId,
    initialData: page === 1 && initialReviews ? initialReviews : undefined,
    staleTime: 30 * 1000,
  });

  const adminStatsQuery = useQuery({
    queryKey: ["review-admin-stats", productId],
    queryFn: () => adminFetchRatingStatsRequest(productId),
    enabled: !!productId && isSignedIn && isSeller,
    retry: false,
    staleTime: 30 * 1000,
  });

  const reviewSummary = summaryQuery.data?.success ? summaryQuery.data : null;
  const reviewData = reviewListQuery.data?.success ? reviewListQuery.data : null;
  const eligibility = eligibilityQuery.data?.success ? eligibilityQuery.data : null;
  const isEligibilityLoading =
    !eligibility && (eligibilityQuery.isLoading || eligibilityQuery.isFetching);
  const existingReview = eligibility?.existingReview || null;
  const canReview = Boolean(eligibility?.canReview);
  const hasReviewed = Boolean(eligibility?.hasReviewed);
  const isAdminView = Boolean(isSeller);

  useEffect(() => {
    if (existingReview) {
      setEditingReviewId(existingReview._id);
      setForm({
        rating: Number(existingReview.rating || 5),
        title: existingReview.title || "",
        body: existingReview.body || "",
      });
      return;
    }

    setEditingReviewId(null);
    setForm(DEFAULT_FORM);
  }, [existingReview]);

  useEffect(() => {
    if (!hasReviewed && !isSignedIn) {
      setEditingReviewId(null);
      setForm(DEFAULT_FORM);
    }
  }, [hasReviewed, isSignedIn]);

  const effectiveRating = useMemo(() => {
    if (!reviewSummary || Number(reviewSummary.totalReviews || 0) === 0) return 0;
    return Number(reviewSummary.averageRating || 0);
  }, [reviewSummary]);

  const publicReviewList = reviewData?.reviews || [];
  const pagination = reviewData?.pagination;
  const authorName =
    clerkUser?.fullName?.trim() ||
    [clerkUser?.firstName, clerkUser?.lastName].filter(Boolean).join(" ").trim() ||
    clerkUser?.username?.trim() ||
    clerkUser?.primaryEmailAddress?.emailAddress?.split("@")?.[0] ||
    "";
  const authorImageUrl = clerkUser?.imageUrl || "";

  const createMutation = useMutation({
    mutationFn: (payload) =>
      createReviewRequest(productId, {
        ...payload,
        authorName,
        authorImageUrl,
      }),
    onSuccess: async (data) => {
      toast.success("Review added");
      setPage(1);
      if (data?.review?._id) {
        setEditingReviewId(data.review._id);
        setForm({
          rating: Number(data.review.rating || 5),
          title: data.review.title || "",
          body: data.review.body || "",
        });
      }
      await queryClient.invalidateQueries({ queryKey: ["review-summary", productId] });
      await queryClient.invalidateQueries({ queryKey: ["review-list", productId] });
      await queryClient.invalidateQueries({ queryKey: ["review-eligibility", productId] });
    },
    onError: (error) => toast.error(error?.message || "Failed to add review"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ reviewId, payload }) => updateReviewRequest(reviewId, payload),
    onSuccess: async (data) => {
      toast.success("Review updated");
      if (data?.review?._id) {
        setEditingReviewId(data.review._id);
        setForm({
          rating: Number(data.review.rating || 5),
          title: data.review.title || "",
          body: data.review.body || "",
        });
      }
      await queryClient.invalidateQueries({ queryKey: ["review-summary", productId] });
      await queryClient.invalidateQueries({ queryKey: ["review-list", productId] });
      await queryClient.invalidateQueries({ queryKey: ["review-eligibility", productId] });
    },
    onError: (error) => toast.error(error?.message || "Failed to update review"),
  });

  const deleteMutation = useMutation({
    mutationFn: (reviewId) => deleteReviewRequest(reviewId),
    onSuccess: async () => {
      toast.success("Review deleted");
      setEditingReviewId(null);
      setForm(DEFAULT_FORM);
      await queryClient.invalidateQueries({ queryKey: ["review-summary", productId] });
      await queryClient.invalidateQueries({ queryKey: ["review-list", productId] });
      await queryClient.invalidateQueries({ queryKey: ["review-eligibility", productId] });
    },
    onError: (error) => toast.error(error?.message || "Failed to delete review"),
  });

  const hideMutation = useMutation({
    mutationFn: (reviewId) => adminHideReviewRequest(reviewId),
    onSuccess: async () => {
      toast.success("Review hidden");
      await queryClient.invalidateQueries({ queryKey: ["review-summary", productId] });
      await queryClient.invalidateQueries({ queryKey: ["review-list", productId] });
      await queryClient.invalidateQueries({ queryKey: ["review-admin-stats", productId] });
    },
    onError: (error) => toast.error(error?.message || "Failed to hide review"),
  });

  const unhideMutation = useMutation({
    mutationFn: (reviewId) => adminUnhideReviewRequest(reviewId),
    onSuccess: async () => {
      toast.success("Review restored");
      await queryClient.invalidateQueries({ queryKey: ["review-summary", productId] });
      await queryClient.invalidateQueries({ queryKey: ["review-list", productId] });
      await queryClient.invalidateQueries({ queryKey: ["review-admin-stats", productId] });
    },
    onError: (error) => toast.error(error?.message || "Failed to restore review"),
  });

  const adminDeleteMutation = useMutation({
    mutationFn: (reviewId) => adminDeleteReviewRequest(reviewId),
    onSuccess: async () => {
      toast.success("Review deleted");
      await queryClient.invalidateQueries({ queryKey: ["review-summary", productId] });
      await queryClient.invalidateQueries({ queryKey: ["review-list", productId] });
      await queryClient.invalidateQueries({ queryKey: ["review-admin-stats", productId] });
    },
    onError: (error) => toast.error(error?.message || "Failed to delete review"),
  });

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!isSignedIn) {
      openSignIn();
      return;
    }

    if (editingReviewId) {
      await updateMutation.mutateAsync({
        reviewId: editingReviewId,
        payload: form,
      });
      return;
    }

    await createMutation.mutateAsync(form);
  };

  const handleEdit = (review) => {
    setEditingReviewId(review._id);
    setForm({
      rating: Number(review.rating || 5),
      title: review.title || "",
      body: review.body || "",
    });
  };

  const handleDeleteOwnReview = async (review) => {
    const confirmed = window.confirm("Delete your review? This cannot be undone.");
    if (!confirmed) return;
    await deleteMutation.mutateAsync(review._id);
  };

  const renderReviews = () => {
    if (reviewListQuery.isLoading) {
      return (
        <div className="py-12 text-center text-gray-500">
          <Spinner size="sm" />
        </div>
      );
    }

    if (!publicReviewList.length) {
      return (
        <div className="rounded-3xl border border-dashed border-gray-200 bg-gray-50 p-8 text-center text-sm text-gray-500">
          No customer reviews yet. Be the first to share feedback.
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {publicReviewList.map((review) => {
          const isOwnReview = Boolean(existingReview && existingReview._id === review._id);
          return (
            <ReviewCard
              key={review._id}
              review={review}
              isOwnReview={isOwnReview}
              isAdminView={isAdminView}
              onEdit={handleEdit}
              onDelete={handleDeleteOwnReview}
              onHide={(item) => hideMutation.mutate(item._id)}
              onUnhide={(item) => unhideMutation.mutate(item._id)}
              onAdminDelete={(item) => adminDeleteMutation.mutate(item._id)}
            />
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-5 rounded-3xl border border-gray-100 bg-white/95 p-4 shadow-sm md:p-5">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-orange-600">
            Customer reviews
          </p>
          <h2 className="mt-1.5 text-xl font-semibold text-gray-900 md:text-2xl">
            What buyers say about {productName}
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-gray-600">
            Ratings and verified feedback from customers who purchased and received this product.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 rounded-2xl border border-gray-100 bg-gray-50/80 p-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-semibold text-gray-900">
                {effectiveRating.toFixed(1)}
              </span>
              <Star className="h-4 w-4 fill-orange-400 text-orange-400" />
            </div>
            <p className="mt-1 text-xs text-gray-500">
              {reviewSummary?.totalReviews > 0
                ? `${reviewSummary.totalReviews} review${reviewSummary.totalReviews === 1 ? "" : "s"}`
                : "No reviews yet"}
            </p>
          </div>
          <div className="flex flex-col justify-center gap-1 text-sm text-gray-600">
            <p className="inline-flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-green-600" />
              Verified purchase checks
            </p>
            <p className="inline-flex items-center gap-2">
              <Flag className="h-4 w-4 text-orange-500" />
              Moderation ready
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900">Rating breakdown</h3>
          <p className="mt-1 text-sm text-gray-500">See how customers rated this product.</p>
          <div className="mt-4">
            <RatingDistribution
              breakdown={reviewSummary?.ratingBreakdown}
              totalReviews={reviewSummary?.totalReviews || 0}
            />
          </div>
          {isAdminView && adminStatsQuery.data?.success ? (
            <div className="mt-4 rounded-xl bg-gray-50 p-3 text-sm text-gray-600">
              <p className="font-semibold text-gray-900">Admin statistics</p>
              <p className="mt-1">Hidden reviews: {adminStatsQuery.data.stats?.hiddenReviews || 0}</p>
              <p>
                Visible reviews:
                {Math.max(
                  (adminStatsQuery.data.stats?.totalReviews || 0) -
                    (adminStatsQuery.data.stats?.hiddenReviews || 0),
                  0
                )}
              </p>
            </div>
          ) : null}
        </div>

        <div className="space-y-4">
          <ReviewForm
            form={form}
            setForm={setForm}
            isSubmitting={
              createMutation.isPending || updateMutation.isPending || deleteMutation.isPending
            }
            isSignedIn={isSignedIn}
            isAdminView={isAdminView}
            canReview={canReview}
            hasReviewed={hasReviewed}
            isEligibilityLoading={isEligibilityLoading}
            onSubmit={handleSubmit}
            onSignIn={openSignIn}
            onReset={() => {
              setEditingReviewId(existingReview?._id || null);
              if (existingReview) {
                setForm({
                  rating: Number(existingReview.rating || 5),
                  title: existingReview.title || "",
                  body: existingReview.body || "",
                });
                return;
              }
              setForm(DEFAULT_FORM);
            }}
          />

          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">
                  {isAdminView ? "All reviews" : "Latest reviews"}
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {isAdminView
                    ? "Visible and hidden reviews with moderation controls."
                    : "Public reviews shown in reverse chronological order."}
                </p>
              </div>
              {pagination?.totalPages > 1 ? (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                    className="rounded-full border border-gray-200 p-1.5 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronUp className="h-4 w-4 rotate-90" />
                  </button>
                  <span>
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <button
                    type="button"
                    disabled={page >= pagination.totalPages}
                    onClick={() => setPage((current) => current + 1)}
                    className="rounded-full border border-gray-200 p-1.5 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronDown className="h-4 w-4 rotate-90" />
                  </button>
                </div>
              ) : null}
            </div>

            <div className="mt-4">{renderReviews()}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
