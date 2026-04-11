import { assets } from "../assets/assets.js";

const getRuntimeImage = (image) => {
  if (typeof image === "string" && image.startsWith("asset:")) {
    return assets[image.replace("asset:", "")] || assets.upload_area;
  }

  return image || assets.upload_area;
};

export const normalizeProductRecord = (product) => ({
  ...product,
  _id: product?._id,
  price: Number(product?.price ?? 0),
  offerPrice: Number(product?.offerPrice ?? product?.price ?? 0),
  rating: Number(product?.rating ?? 4.5),
  image: (Array.isArray(product?.image)
    ? product.image
    : Array.isArray(product?.images)
      ? product.images
      : []
  ).map(getRuntimeImage),
});
