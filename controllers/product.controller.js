import { getAuth } from "@clerk/nextjs/server";
import authSeller from "@/lib/authSeller";
import {
  AppError,
  createSuccessResponse,
  withController,
} from "@/lib/api-response";
import { uploadImagesToCloudinary } from "@/lib/cloudinary";
import {
  createProduct,
  fetchProducts,
  fetchSellerProducts,
} from "@/services/product.service";

const getStringParam = (searchParams, key) => {
  const value = searchParams.get(key);
  return value?.trim() ? value.trim() : undefined;
};

const getProductQueryOptions = (searchParams) => ({
  filters: {
    category: getStringParam(searchParams, "category"),
    search: getStringParam(searchParams, "search"),
    minPrice: searchParams.get("minPrice"),
    maxPrice: searchParams.get("maxPrice"),
  },
  pagination: {
    page: searchParams.get("page"),
    limit: searchParams.get("limit"),
  },
  sort: {
    sortBy: getStringParam(searchParams, "sortBy"),
    sortOrder: getStringParam(searchParams, "sortOrder"),
  },
});

const requireSellerAuth = async (request) => {
  const { userId } = getAuth(request);

  if (!userId) {
    throw new AppError("Unauthorized", 401);
  }

  const isSeller = await authSeller(userId);

  if (!isSeller) {
    throw new AppError("Unauthorized", 401);
  }

  return userId;
};

export const listProductsController = withController(
  async (request) => {
    const searchParams = request.nextUrl.searchParams;
    const result = await fetchProducts(getProductQueryOptions(searchParams));

    return createSuccessResponse({
      success: true,
      products: result.items,
      pagination: result.pagination,
      sort: result.sort,
    });
  },
  {
    fallbackMessage: "Failed to fetch products",
    context: "GET /api/product/list",
  }
);

export const listSellerProductsController = withController(
  async (request) => {
    const userId = await requireSellerAuth(request);
    const searchParams = request.nextUrl.searchParams;
    const result = await fetchSellerProducts({
      userId,
      ...getProductQueryOptions(searchParams),
    });

    return createSuccessResponse({
      success: true,
      products: result.items,
      pagination: result.pagination,
      sort: result.sort,
    });
  },
  {
    fallbackMessage: "Failed to fetch seller products",
    context: "GET /api/product/seller-list",
  }
);

export const createProductController = withController(
  async (request) => {
    const userId = await requireSellerAuth(request);
    const formData = await request.formData();

    const name = formData.get("name");
    const description = formData.get("description");
    const price = formData.get("price");
    const category = formData.get("category");
    const offerPrice = formData.get("offerPrice");
    const files = formData
      .getAll("images")
      .filter((file) => typeof file?.arrayBuffer === "function" && file.size > 0);

    if (!name || !description || !price || !category || !offerPrice) {
      throw new AppError("All product fields are required", 400);
    }

    const image = await uploadImagesToCloudinary(files);

    const product = await createProduct({
      userId,
      name,
      description,
      category,
      price,
      offerPrice,
      image,
    });

    return createSuccessResponse(
      {
        success: true,
        message: "Product added successfully",
        product,
      },
      201
    );
  },
  {
    fallbackMessage: "Failed to add product",
    context: "POST /api/product/add",
  }
);
