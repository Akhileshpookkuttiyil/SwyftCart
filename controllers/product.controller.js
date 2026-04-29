import { getAuth } from "@clerk/nextjs/server";
import { ProductSchema, PartialProductSchema } from "@/lib/validation";
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
  updateProduct,
  deleteProduct,
  fetchProductById,
} from "@/services/product.service";

const getStringParam = (searchParams, key) => {
  const value = searchParams.get(key);
  return value?.trim() ? value.trim() : undefined;
};

const getProductQueryOptions = (searchParams) => ({
  filters: {
    ids: getStringParam(searchParams, "ids"),
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

    const productData = {
      name: formData.get("name"),
      description: formData.get("description"),
      price: formData.get("price"),
      category: formData.get("category"),
      offerPrice: formData.get("offerPrice"),
      stock: formData.get("stock") || undefined,
    };

    const validation = ProductSchema.safeParse(productData);

    if (!validation.success) {
      const errorMessages = validation.error.errors.map((err) => err.message).join(", ");
      throw new AppError(errorMessages, 400);
    }

    const { name, description, price, category, offerPrice, stock } = validation.data;

    const files = formData
      .getAll("images")
      .filter((file) => typeof file?.arrayBuffer === "function" && file.size > 0);

    const image = await uploadImagesToCloudinary(files);

    if (!image || image.length === 0) {
      throw new AppError("At least one product image is required", 400);
    }

    const product = await createProduct({
      userId,
      name,
      description,
      category,
      price,
      offerPrice,
      image,
      stock,
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

export const updateProductController = withController(
  async (request, { params }) => {
    const userId = await requireSellerAuth(request);

    // In Next.js 15, params is a Promise that must be awaited
    const { id } = (await params) || {};
    if (!id) throw new AppError("Product ID is required", 400);

    const formData = await request.formData();

    const rawData = {
      name: formData.get("name") || undefined,
      description: formData.get("description") || undefined,
      price: formData.get("price") || undefined,
      category: formData.get("category") || undefined,
      offerPrice: formData.get("offerPrice") || undefined,
      stock: formData.get("stock") || undefined,
    };

    const validation = PartialProductSchema.safeParse(rawData);

    if (!validation.success) {
      const errorMessages = validation.error.errors.map((err) => err.message).join(", ");
      throw new AppError(errorMessages, 400);
    }

    let updateData = { ...validation.data };


    const imageItems = formData.getAll("images");
    if (imageItems.length > 0) {
      // Process all image items in parallel to prevent timeouts
      const processedImages = await Promise.all(
        imageItems.map(async (item) => {
          if (typeof item === 'string' && item.startsWith('http')) {
            return item;
          } else if (item && typeof item.arrayBuffer === 'function' && item.size > 0) {
            const uploaded = await uploadImagesToCloudinary([item]);
            return uploaded[0];
          }
          return null;
        })
      );
      updateData.image = processedImages.filter(Boolean);
    } // Note: Without new images, the existing image array remains unchanged in DB

    const updatedProduct = await updateProduct(id, userId, updateData);

    if (!updatedProduct) {
      throw new AppError("Product not found or unauthorized", 404);
    }

    return createSuccessResponse({
      success: true,
      message: "Product updated successfully",
      product: updatedProduct,
    });
  },
  {
    fallbackMessage: "Failed to update product",
    context: "PATCH /api/product/[id]",
  }
);

export const deleteProductController = withController(
  async (request, { params }) => {
    const userId = await requireSellerAuth(request);
    const { id } = (await params) || {};

    if (!id) throw new AppError("Product ID is required", 400);

    const isDeleted = await deleteProduct(id, userId);

    if (!isDeleted) {
      throw new AppError("Product not found or unauthorized", 404);
    }

    return createSuccessResponse({
      success: true,
      message: "Product deleted successfully",
    });
  },
  {
    fallbackMessage: "Failed to delete product",
    context: "DELETE /api/product/[id]",
  }
);

export const getProductController = withController(
  async (request, { params }) => {
    const { id } = (await params) || {};

    if (!id) throw new AppError("Product ID is required", 400);

    const product = await fetchProductById(id);

    if (!product) {
      throw new AppError("Product not found", 404);
    }

    return createSuccessResponse({
      success: true,
      product,
    });
  },
  {
    fallbackMessage: "Failed to fetch product",
    context: "GET /api/product/[id]",
  }
);

