import connectDB from "@/config/db";
import Product from "@/models/product";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;
const DEFAULT_SORT_BY = "createdAt";
const DEFAULT_SORT_ORDER = "desc";
const ALLOWED_SORT_FIELDS = new Set([
  "createdAt",
  "updatedAt",
  "name",
  "price",
  "offerPrice",
  "rating",
  "category",
]);

const escapeRegex = (value = "") =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const normalizeNumber = (value) => {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  const normalized = Number(value);
  return Number.isFinite(normalized) ? normalized : undefined;
};

const normalizePagination = (pagination = {}) => {
  const isPaginated =
    pagination.page !== undefined ||
    pagination.limit !== undefined ||
    pagination.page === 0 ||
    pagination.limit === 0;

  const page = Math.max(Number(pagination.page) || DEFAULT_PAGE, 1);
  const limit = isPaginated
    ? Math.min(Math.max(Number(pagination.limit) || DEFAULT_LIMIT, 1), MAX_LIMIT)
    : null;

  return {
    isPaginated,
    page,
    limit,
    skip: isPaginated ? (page - 1) * limit : 0,
  };
};

const normalizeSort = (sort = {}) => {
  const sortBy = ALLOWED_SORT_FIELDS.has(sort.sortBy)
    ? sort.sortBy
    : DEFAULT_SORT_BY;
  const sortOrder = String(sort.sortOrder).toLowerCase() === "asc" ? "asc" : "desc";

  return {
    sortBy,
    sortOrder,
    sortOptions: { [sortBy]: sortOrder === "asc" ? 1 : -1 },
  };
};

const buildProductFilters = (filters = {}) => {
  const query = {};

  if (filters.userId) {
    query.userId = filters.userId;
  }

  if (filters.category) {
    query.category = filters.category;
  }

  const minPrice = normalizeNumber(filters.minPrice);
  const maxPrice = normalizeNumber(filters.maxPrice);

  if (minPrice !== undefined || maxPrice !== undefined) {
    query.offerPrice = {};
    if (minPrice !== undefined) query.offerPrice.$gte = minPrice;
    if (maxPrice !== undefined) query.offerPrice.$lte = maxPrice;
  }

  if (filters.search) {
    const pattern = new RegExp(escapeRegex(filters.search.trim()), "i");
    query.$or = [{ name: pattern }, { description: pattern }];
  }

  return query;
};

const applyLean = (query, lean = true) => (lean ? query.lean() : query);

const normalizeProductDocument = (product) => ({
  ...product,
  image: product.image || product.images || [],
});

export const fetchProducts = async ({
  filters = {},
  pagination = {},
  sort = {},
  lean = true,
  select,
} = {}) => {
  await connectDB();

  const mongoFilters = buildProductFilters(filters);
  const { isPaginated, page, limit, skip } = normalizePagination(pagination);
  const { sortBy, sortOrder, sortOptions } = normalizeSort(sort);

  let productsQuery = Product.find(mongoFilters).sort(sortOptions);

  if (isPaginated) {
    productsQuery = productsQuery.skip(skip).limit(limit);
  }

  if (select) {
    productsQuery = productsQuery.select(select);
  }

  productsQuery = applyLean(productsQuery, lean);

  const [products, total] = await Promise.all([
    productsQuery,
    Product.countDocuments(mongoFilters),
  ]);

  return {
    items: products.map(normalizeProductDocument),
    pagination: {
      page,
      limit: isPaginated ? limit : total,
      total,
      totalPages: isPaginated ? Math.ceil(total / limit) || 1 : 1,
      hasNextPage: isPaginated ? skip + limit < total : false,
      hasPrevPage: isPaginated ? page > 1 : false,
    },
    sort: {
      sortBy,
      sortOrder,
    },
    filters: mongoFilters,
  };
};

export const fetchSellerProducts = async ({
  userId,
  filters = {},
  ...options
} = {}) =>
  fetchProducts({
    ...options,
    filters: {
      ...filters,
      userId,
    },
  });

export const fetchProductById = async (productId, { lean = true, select } = {}) => {
  await connectDB();

  let query = Product.findById(productId);

  if (select) {
    query = query.select(select);
  }

  query = applyLean(query, lean);

  const product = await query;
  return product ? normalizeProductDocument(product) : null;
};

export const createProduct = async (payload) => {
  await connectDB();

  const createdProduct = await Product.create({
    userId: payload.userId,
    name: payload.name,
    description: payload.description,
    category: payload.category,
    price: Number(payload.price),
    offerPrice: Number(payload.offerPrice),
    rating: Number(payload.rating ?? 4.5),
    image: payload.image,
  });

  return normalizeProductDocument(createdProduct.toObject());
};
