import connectDB from "@/config/db";
import Review from "@/models/Review";
import Order from "@/models/Order";
import Product from "@/models/Product";
import { AppError } from "@/lib/api-response";
import mongoose from "mongoose";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

const PUBLIC_REVIEW_SELECT =
  "_id productId rating title body isVerifiedPurchase userName userImageUrl createdAt updatedAt";
const OWNER_REVIEW_SELECT =
  "_id productId rating title body isVerifiedPurchase userName userImageUrl createdAt updatedAt";
const ADMIN_REVIEW_SELECT =
  "_id productId rating title body isVerifiedPurchase userName userImageUrl isHidden createdAt updatedAt";

const emptyBreakdown = {
  1: 0,
  2: 0,
  3: 0,
  4: 0,
  5: 0,
};

const normalizePagination = (pagination = {}) => {
  const page = Math.max(Number(pagination.page) || DEFAULT_PAGE, 1);
  const limit = Math.min(Math.max(Number(pagination.limit) || DEFAULT_LIMIT, 1), MAX_LIMIT);
  return { page, limit, skip: (page - 1) * limit };
};

const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

const ensureObjectId = (value, label = "ID") => {
  if (!isValidObjectId(value)) {
    throw new AppError(`Invalid ${label}`, 400);
  }
};

const normalizeBreakdown = (breakdown = {}) => ({
  1: Number(breakdown?.[1] || 0),
  2: Number(breakdown?.[2] || 0),
  3: Number(breakdown?.[3] || 0),
  4: Number(breakdown?.[4] || 0),
  5: Number(breakdown?.[5] || 0),
});

const serializeReview = (review, { includeHidden = false } = {}) => {
  if (!review) return null;

  const normalized = JSON.parse(JSON.stringify(review));
  const base = {
    ...normalized,
    _id: normalized._id?.toString?.() || "",
    productId: normalized.productId?.toString?.() || "",
  };

  if (!includeHidden) {
    delete base.isHidden;
  }

  delete base.userId;
  delete base.orderId;
  delete base.__v;

  return base;
};

const withTransaction = async (callback) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const result = await callback(session);
    await session.commitTransaction();
    return result;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

const recalculateProductRating = async (productId, session) => {
  ensureObjectId(productId, "product ID");

  const [aggResult] = await Review.aggregate([
    {
      $match: {
        productId: new mongoose.Types.ObjectId(productId),
        isHidden: false,
      },
    },
    {
      $group: {
        _id: null,
        averageRating: { $avg: "$rating" },
        totalReviews: { $sum: 1 },
        count1: { $sum: { $cond: [{ $eq: ["$rating", 1] }, 1, 0] } },
        count2: { $sum: { $cond: [{ $eq: ["$rating", 2] }, 1, 0] } },
        count3: { $sum: { $cond: [{ $eq: ["$rating", 3] }, 1, 0] } },
        count4: { $sum: { $cond: [{ $eq: ["$rating", 4] }, 1, 0] } },
        count5: { $sum: { $cond: [{ $eq: ["$rating", 5] }, 1, 0] } },
      },
    },
  ]).session(session);

  const stats = aggResult || {
    averageRating: 0,
    totalReviews: 0,
    count1: 0,
    count2: 0,
    count3: 0,
    count4: 0,
    count5: 0,
  };

  const roundedAverage = Math.round((Number(stats.averageRating) || 0) * 10) / 10;
  const updateQuery = Product.updateOne(
    { _id: productId },
    {
      $set: {
        averageRating: roundedAverage,
        totalReviews: stats.totalReviews,
        "ratingBreakdown.1": stats.count1,
        "ratingBreakdown.2": stats.count2,
        "ratingBreakdown.3": stats.count3,
        "ratingBreakdown.4": stats.count4,
        "ratingBreakdown.5": stats.count5,
      },
    }
  );

  await updateQuery.session(session);

  return {
    averageRating: roundedAverage,
    totalReviews: stats.totalReviews,
    ratingBreakdown: normalizeBreakdown({
      1: stats.count1,
      2: stats.count2,
      3: stats.count3,
      4: stats.count4,
      5: stats.count5,
    }),
  };
};

export const fetchReviewRecordById = async (reviewId) => {
  ensureObjectId(reviewId, "review ID");

  return Review.findById(reviewId)
    .select("+userId +orderId +isHidden +isVerifiedPurchase")
    .lean();
};

export const findDeliveredOrderForProduct = async (userId, productId) => {
  await connectDB();
  ensureObjectId(productId, "product ID");

  const order = await Order.findOne({
    userId,
    status: "delivered",
    "items.product": new mongoose.Types.ObjectId(productId),
  })
    .select("_id")
    .lean();

  return order ? order._id : null;
};

export const createReview = async (userId, productId, payload, userSnapshot) => {
  await connectDB();
  ensureObjectId(productId, "product ID");

  const product = await Product.findById(productId).select("_id").lean();
  if (!product) throw new AppError("Product not found", 404);

  try {
    return await withTransaction(async (session) => {
      const order = await Order.findOne({
        userId,
        status: "delivered",
        "items.product": new mongoose.Types.ObjectId(productId),
      })
        .select("_id")
        .session(session)
        .lean();

      if (!order) {
        throw new AppError("You can only review products you have purchased and received.", 403);
      }

      const existing = await Review.findOne({ productId, userId })
        .select("_id")
        .session(session)
        .lean();

      if (existing) {
        throw new AppError("You have already reviewed this product.", 409);
      }

      const [review] = await Review.create(
        [
          {
            productId,
            userId,
            orderId: order._id,
            rating: payload.rating,
            title: payload.title,
            body: payload.body,
            isVerifiedPurchase: true,
            userName: userSnapshot.name,
            userImageUrl: userSnapshot.imageUrl || "",
          },
        ],
        { session }
      );

      await recalculateProductRating(productId, session);

      return serializeReview(review.toObject());
    });
  } catch (error) {
    if (error?.code === 11000) {
      throw new AppError("You have already reviewed this product.", 409);
    }
    throw error;
  }
};

export const updateReview = async (reviewId, userId, payload) => {
  await connectDB();
  ensureObjectId(reviewId, "review ID");

  return withTransaction(async (session) => {
    const review = await Review.findOne({ _id: reviewId, userId })
      .select("+userId +orderId +isHidden +isVerifiedPurchase")
      .session(session);

    if (!review) throw new AppError("Review not found or unauthorized", 404);

    const previousRating = review.rating;

    if (payload.rating !== undefined) review.rating = payload.rating;
    if (payload.title !== undefined) review.title = payload.title;
    if (payload.body !== undefined) review.body = payload.body;

    await review.save({ session });

    if (payload.rating !== undefined && payload.rating !== previousRating) {
      await recalculateProductRating(review.productId, session);
    }

    return serializeReview(review.toObject());
  });
};

export const deleteReview = async (reviewId, userId) => {
  await connectDB();
  ensureObjectId(reviewId, "review ID");

  return withTransaction(async (session) => {
    const review = await Review.findOne({ _id: reviewId, userId })
      .select("+userId +orderId +isHidden +isVerifiedPurchase")
      .session(session);

    if (!review) throw new AppError("Review not found or unauthorized", 404);

    await Review.deleteOne({ _id: reviewId }).session(session);
    await recalculateProductRating(review.productId, session);

    return true;
  });
};

export const fetchProductReviews = async (productId, { pagination = {} } = {}) => {
  await connectDB();
  ensureObjectId(productId, "product ID");

  const { page, limit, skip } = normalizePagination(pagination);

  const [reviews, total] = await Promise.all([
    Review.find({ productId, isHidden: false })
      .select(PUBLIC_REVIEW_SELECT)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Review.countDocuments({ productId, isHidden: false }),
  ]);

  return {
    reviews: reviews.map((review) => serializeReview(review)),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
      hasNextPage: skip + limit < total,
      hasPrevPage: page > 1,
    },
  };
};

export const fetchReviewById = async (reviewId) => {
  await connectDB();
  const review = await fetchReviewRecordById(reviewId);
  return review ? serializeReview(review) : null;
};

export const fetchUserReviewForProduct = async (userId, productId) => {
  await connectDB();
  ensureObjectId(productId, "product ID");

  const review = await Review.findOne({ productId, userId })
    .select(OWNER_REVIEW_SELECT)
    .lean();

  return review ? serializeReview(review) : null;
};

export const fetchProductRatingSummary = async (productId) => {
  await connectDB();
  ensureObjectId(productId, "product ID");

  const product = await Product.findById(productId)
    .select("rating averageRating totalReviews ratingBreakdown")
    .lean();

  if (!product) throw new AppError("Product not found", 404);

  return {
    rating: Number(product.rating ?? 4.5),
    averageRating: Number(product.averageRating || 0),
    totalReviews: Number(product.totalReviews || 0),
    ratingBreakdown: normalizeBreakdown(product.ratingBreakdown || emptyBreakdown),
  };
};

export const adminFetchProductReviews = async (productId, { pagination = {} } = {}) => {
  await connectDB();
  ensureObjectId(productId, "product ID");

  const { page, limit, skip } = normalizePagination(pagination);

  const [reviews, total] = await Promise.all([
    Review.find({ productId })
      .select(ADMIN_REVIEW_SELECT)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Review.countDocuments({ productId }),
  ]);

  return {
    reviews: reviews.map((review) => serializeReview(review, { includeHidden: true })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
      hasNextPage: skip + limit < total,
      hasPrevPage: page > 1,
    },
  };
};

export const adminHideReview = async (reviewId) => {
  await connectDB();
  ensureObjectId(reviewId, "review ID");

  return withTransaction(async (session) => {
    const review = await Review.findById(reviewId)
      .select("+userId +orderId +isHidden +isVerifiedPurchase")
      .session(session);

    if (!review) throw new AppError("Review not found", 404);

    review.isHidden = true;
    await review.save({ session });
    await recalculateProductRating(review.productId, session);

    return serializeReview(review.toObject(), { includeHidden: true });
  });
};

export const adminUnhideReview = async (reviewId) => {
  await connectDB();
  ensureObjectId(reviewId, "review ID");

  return withTransaction(async (session) => {
    const review = await Review.findById(reviewId)
      .select("+userId +orderId +isHidden +isVerifiedPurchase")
      .session(session);

    if (!review) throw new AppError("Review not found", 404);

    review.isHidden = false;
    await review.save({ session });
    await recalculateProductRating(review.productId, session);

    return serializeReview(review.toObject(), { includeHidden: true });
  });
};

export const adminDeleteReview = async (reviewId) => {
  await connectDB();
  ensureObjectId(reviewId, "review ID");

  return withTransaction(async (session) => {
    const review = await Review.findById(reviewId)
      .select("+userId +orderId +isHidden +isVerifiedPurchase")
      .session(session);

    if (!review) throw new AppError("Review not found", 404);

    await Review.deleteOne({ _id: reviewId }).session(session);
    await recalculateProductRating(review.productId, session);

    return true;
  });
};

export const adminFetchRatingStats = async (productId = null) => {
  await connectDB();

  const matchStage = productId
    ? (() => {
        ensureObjectId(productId, "product ID");
        return { $match: { productId: new mongoose.Types.ObjectId(productId) } };
      })()
    : { $match: {} };

  const stats = await Review.aggregate([
    matchStage,
    {
      $group: {
        _id: null,
        totalReviews: { $sum: 1 },
        hiddenReviews: { $sum: { $cond: ["$isHidden", 1, 0] } },
        averageRating: { $avg: "$rating" },
        count1: { $sum: { $cond: [{ $eq: ["$rating", 1] }, 1, 0] } },
        count2: { $sum: { $cond: [{ $eq: ["$rating", 2] }, 1, 0] } },
        count3: { $sum: { $cond: [{ $eq: ["$rating", 3] }, 1, 0] } },
        count4: { $sum: { $cond: [{ $eq: ["$rating", 4] }, 1, 0] } },
        count5: { $sum: { $cond: [{ $eq: ["$rating", 5] }, 1, 0] } },
      },
    },
  ]);

  if (stats.length === 0) {
    return {
      totalReviews: 0,
      hiddenReviews: 0,
      averageRating: 0,
      ratingBreakdown: { ...emptyBreakdown },
    };
  }

  const current = stats[0];

  return {
    totalReviews: current.totalReviews,
    hiddenReviews: current.hiddenReviews,
    averageRating: Math.round((Number(current.averageRating) || 0) * 10) / 10,
    ratingBreakdown: {
      1: current.count1,
      2: current.count2,
      3: current.count3,
      4: current.count4,
      5: current.count5,
    },
  };
};
