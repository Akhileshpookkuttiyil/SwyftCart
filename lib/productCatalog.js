
export const normalizeProductRecord = (product) => {
  if (!product) return null;
  
  // Create a deep copy and ensure serializable types
  const normalized = JSON.parse(JSON.stringify(product));
  
  return {
    ...normalized,
    _id: normalized._id?.toString() || "",
    image: Array.isArray(normalized?.image) ? normalized.image : [],
  };
};
