import toast from "react-hot-toast";

export const successToast = (message, id) =>
  toast.success(message, id ? { id } : undefined);

export const errorToast = (message, id) =>
  toast.error(message, id ? { id } : undefined);

export const loadingToast = (message, id) =>
  toast.loading(message, id ? { id } : undefined);

export const dismissToast = (id) => toast.dismiss(id);

