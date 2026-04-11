import connectDB from "@/config/db";
import User from "@/models/User";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;
const DEFAULT_SORT_BY = "createdAt";
const DEFAULT_SORT_ORDER = "desc";
const ALLOWED_SORT_FIELDS = new Set([
  "createdAt",
  "updatedAt",
  "name",
  "email",
  "role",
]);

const escapeRegex = (value = "") =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

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

const buildUserFilters = (filters = {}) => {
  const query = {};

  if (filters.role) {
    query.role = filters.role;
  }

  if (filters.search) {
    const pattern = new RegExp(escapeRegex(filters.search.trim()), "i");
    query.$or = [{ name: pattern }, { email: pattern }];
  }

  return query;
};

const applyLean = (query, lean = true) => (lean ? query.lean() : query);

export const fetchUsers = async ({
  filters = {},
  pagination = {},
  sort = {},
  lean = true,
  select,
} = {}) => {
  await connectDB();

  const mongoFilters = buildUserFilters(filters);
  const { isPaginated, page, limit, skip } = normalizePagination(pagination);
  const { sortBy, sortOrder, sortOptions } = normalizeSort(sort);

  let usersQuery = User.find(mongoFilters).sort(sortOptions);

  if (isPaginated) {
    usersQuery = usersQuery.skip(skip).limit(limit);
  }

  if (select) {
    usersQuery = usersQuery.select(select);
  }

  usersQuery = applyLean(usersQuery, lean);

  const [users, total] = await Promise.all([
    usersQuery,
    User.countDocuments(mongoFilters),
  ]);

  return {
    items: users,
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

export const fetchUserById = async (userId, { lean = true, select } = {}) => {
  await connectDB();

  let query = User.findById(userId);

  if (select) {
    query = query.select(select);
  }

  query = applyLean(query, lean);

  return query;
};

export const fetchSellers = async (options = {}) =>
  fetchUsers({
    ...options,
    filters: {
      ...options.filters,
      role: "seller",
    },
  });
