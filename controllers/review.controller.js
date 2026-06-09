import { auth, clerkClient } from "@clerk/nextjs/server";
import { AppError, createSuccessResponse, withController } from "@/lib/api-response";
import authSeller from "@/lib/authSeller";
import { fetchUserById } from "@/services/user.service";
import User from "@/models/User";
import {
  createReview,
  updateReview,
  deleteReview,
  fetchProductReviews,
  fetchReviewRecordById,
  fetchUserReviewForProduct,
  fetchProductRatingSummary,
  findDeliveredOrderForProduct,
  adminFetchProductReviews,
  adminHideReview,
  adminUnhideReview,
  adminDeleteReview,
  adminFetchRatingStats,
} from "@/services/review.service";
import { PartialReviewSchema, ReviewSchema } from "@/lib/validation";

const requireAuth = async () => {
  const { userId } = await auth();
  if (!userId) throw new AppError("Unauthorized", 401);
  return userId;
};

const requireSellerAuth = async () => {
  const userId = await requireAuth();
  const isSeller = await authSeller(userId);
  if (!isSeller) throw new AppError("Unauthorized. Seller access required.", 403);
  return userId;
};

const getPaginationParams = (searchParams) => ({
  page: searchParams.get("page"),
  limit: searchParams.get("limit"),
});

const resolveAuthorSnapshot = async (userId) => {
  const dbUser = await fetchUserById(userId, { select: "name imageUrl email" });

  const getFallbackName = async () => {
    try {
      const client = await clerkClient();
      const clerkUser = await client.users.getUser(userId);
      const fullName = `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim();
      return {
        name:
          fullName ||
          clerkUser.username ||
          clerkUser.emailAddresses?.[0]?.emailAddress?.split("@")?.[0] ||
          "Verified Customer",
        imageUrl: clerkUser.imageUrl || "",
      };
    } catch {
      return {
        name: "Verified Customer",
        imageUrl: "",
      };
    }
  };

  if (!dbUser) {
    return getFallbackName();
  }

  const normalizedName = String(dbUser.name || "").trim();
  if (normalizedName && normalizedName !== "New User") {
    return {
      name: normalizedName,
      imageUrl: dbUser.imageUrl || "",
    };
  }

  const fallback = await getFallbackName();
  if (fallback.name && fallback.name !== "Verified Customer") {
    await User.updateOne(
      { _id: userId },
      {
        $set: {
          name: fallback.name,
          imageUrl: fallback.imageUrl || dbUser.imageUrl || "",
        },
      }
    );
  }

  return {
    name: fallback.name,
    imageUrl: fallback.imageUrl || dbUser.imageUrl || "",
  };
};

export const getProductReviewsController = withController(
  async (request, { params }) => {
    const { productId } = await params;
    if (!productId) throw new AppError("Product ID is required", 400);

    const searchParams = request.nextUrl.searchParams;
    const result = await fetchProductReviews(productId, {
      pagination: getPaginationParams(searchParams),
    });

    return createSuccessResponse({ success: true, ...result });
  },
  { fallbackMessage: "Failed to fetch reviews", context: "GET /api/review/product/[productId]" }
);

export const getProductRatingSummaryController = withController(
  async (request, { params }) => {
    const { productId } = await params;
    if (!productId) throw new AppError("Product ID is required", 400);

    const summary = await fetchProductRatingSummary(productId);
    return createSuccessResponse({ success: true, ...summary });
  },
  {
    fallbackMessage: "Failed to fetch rating summary",
    context: "GET /api/review/product/[productId]/summary",
  }
);

export const createReviewController = withController(
  async (request, { params }) => {
    const userId = await requireAuth();
    const { productId } = await params;
    if (!productId) throw new AppError("Product ID is required", 400);

    const body = await request.json();
    const validation = ReviewSchema.safeParse(body);
    if (!validation.success) {
      const errorMessages = validation.error.errors.map((entry) => entry.message).join(", ");
      throw new AppError(errorMessages, 400);
    }

    const authorSnapshot = await resolveAuthorSnapshot(userId);
    const review = await createReview(userId, productId, validation.data, authorSnapshot);

    return createSuccessResponse(
      {
        success: true,
        message: "Review added successfully",
        review,
      },
      201
    );
  },
  { fallbackMessage: "Failed to create review", context: "POST /api/review/product/[productId]" }
);

export const getReviewByIdController = withController(
  async (request, { params }) => {
    const userId = await requireAuth();
    const { reviewId } = await params;
    if (!reviewId) throw new AppError("Review ID is required", 400);

    const reviewRecord = await fetchReviewRecordById(reviewId);
    if (!reviewRecord) throw new AppError("Review not found", 404);

    const isSeller = await authSeller(userId);
    if (!isSeller && reviewRecord.userId !== userId) {
      throw new AppError("Review not found", 404);
    }

    const review = JSON.parse(JSON.stringify(reviewRecord));
    delete review.userId;
    delete review.orderId;
    delete review.__v;
    if (!isSeller) {
      delete review.isHidden;
    }

    return createSuccessResponse({ success: true, review });
  },
  { fallbackMessage: "Failed to fetch review", context: "GET /api/review/[reviewId]" }
);

export const updateReviewController = withController(
  async (request, { params }) => {
    const userId = await requireAuth();
    if (await authSeller(userId)) {
      throw new AppError("Review editing is disabled for seller accounts.", 403);
    }
    const { reviewId } = await params;
    if (!reviewId) throw new AppError("Review ID is required", 400);

    const body = await request.json();
    const validation = PartialReviewSchema.safeParse(body);
    if (!validation.success) {
      const errorMessages = validation.error.errors.map((entry) => entry.message).join(", ");
      throw new AppError(errorMessages, 400);
    }

    const review = await updateReview(reviewId, userId, validation.data);
    return createSuccessResponse({ success: true, message: "Review updated successfully", review });
  },
  { fallbackMessage: "Failed to update review", context: "PATCH /api/review/[reviewId]" }
);

export const deleteReviewController = withController(
  async (request, { params }) => {
    const userId = await requireAuth();
    const { reviewId } = await params;
    if (!reviewId) throw new AppError("Review ID is required", 400);

    await deleteReview(reviewId, userId);
    return createSuccessResponse({ success: true, message: "Review deleted successfully" });
  },
  { fallbackMessage: "Failed to delete review", context: "DELETE /api/review/[reviewId]" }
);

export const getReviewEligibilityController = withController(
  async (request, { params }) => {
    const userId = await requireAuth();
    const { productId } = await params;
    if (!productId) throw new AppError("Product ID is required", 400);

    const [orderId, existingReview] = await Promise.all([
      findDeliveredOrderForProduct(userId, productId),
      fetchUserReviewForProduct(userId, productId),
    ]);

    return createSuccessResponse({
      success: true,
      canReview: !!orderId && !existingReview,
      hasReviewed: !!existingReview,
      existingReview: existingReview || null,
    });
  },
  {
    fallbackMessage: "Failed to check review eligibility",
    context: "GET /api/review/eligibility/[productId]",
  }
);

export const adminGetProductReviewsController = withController(
  async (request, { params }) => {
    await requireSellerAuth();
    const { productId } = await params;
    if (!productId) throw new AppError("Product ID is required", 400);

    const searchParams = request.nextUrl.searchParams;
    const result = await adminFetchProductReviews(productId, {
      pagination: getPaginationParams(searchParams),
    });

    return createSuccessResponse({ success: true, ...result });
  },
  {
    fallbackMessage: "Failed to fetch reviews",
    context: "GET /api/review/admin/product/[productId]",
  }
);

export const adminGetRatingStatsController = withController(
  async (request) => {
    await requireSellerAuth();

    const productId = request.nextUrl.searchParams.get("productId") || null;
    const stats = await adminFetchRatingStats(productId);

    return createSuccessResponse({ success: true, stats });
  },
  { fallbackMessage: "Failed to fetch rating stats", context: "GET /api/review/admin/stats" }
);

export const adminHideReviewController = withController(
  async (request, { params }) => {
    await requireSellerAuth();
    const { reviewId } = await params;
    if (!reviewId) throw new AppError("Review ID is required", 400);

    const review = await adminHideReview(reviewId);
    return createSuccessResponse({ success: true, message: "Review hidden successfully", review });
  },
  { fallbackMessage: "Failed to hide review", context: "PATCH /api/review/admin/[reviewId]/hide" }
);

export const adminUnhideReviewController = withController(
  async (request, { params }) => {
    await requireSellerAuth();
    const { reviewId } = await params;
    if (!reviewId) throw new AppError("Review ID is required", 400);

    const review = await adminUnhideReview(reviewId);
    return createSuccessResponse({ success: true, message: "Review restored successfully", review });
  },
  { fallbackMessage: "Failed to restore review", context: "PATCH /api/review/admin/[reviewId]/unhide" }
);

export const adminDeleteReviewController = withController(
  async (request, { params }) => {
    await requireSellerAuth();
    const { reviewId } = await params;
    if (!reviewId) throw new AppError("Review ID is required", 400);

    await adminDeleteReview(reviewId);
    return createSuccessResponse({ success: true, message: "Review permanently deleted" });
  },
  { fallbackMessage: "Failed to delete review", context: "DELETE /api/review/admin/[reviewId]" }
);
