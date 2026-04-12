import { assets } from "../assets/assets.js";

export const normalizeProductRecord = (product) => ({
  ...product,
  image: Array.isArray(product?.image) ? product.image : [],
});
