
export const normalizeProductRecord = (product) => ({
  ...product,
  image: Array.isArray(product?.image) ? product.image : [],
});
