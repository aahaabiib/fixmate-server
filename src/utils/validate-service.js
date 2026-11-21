import { CATEGORIES, SERVICE_MODES } from "../constants.js";

// Body theke shudhu allowed field nei. approvalStatus, technicianEmail ei sob client theke newa hoy na.
export function validateServiceInput(body = {}) {
  const data = {
    title: String(body.title ?? "").trim(),
    category: String(body.category ?? ""),
    description: String(body.description ?? "").trim(),
    image: String(body.image ?? "").trim(),
    basePrice: Number(body.basePrice),
    estimatedDuration: String(body.estimatedDuration ?? "").trim(),
    serviceMode: String(body.serviceMode ?? ""),
    serviceArea: String(body.serviceArea ?? "").trim(),
  };

  let error = "";
  if (data.title.length < 3) error = "Title must be at least 3 characters";
  else if (!CATEGORIES.includes(data.category)) error = "Invalid category";
  else if (data.description.length < 20)
    error = "Description must be at least 20 characters";
  else if (!/^https?:\/\//i.test(data.image)) error = "Service image is required";
  else if (!Number.isFinite(data.basePrice) || data.basePrice <= 0)
    error = "Base price must be a positive number";
  else if (!data.estimatedDuration) error = "Estimated duration is required";
  else if (!SERVICE_MODES.includes(data.serviceMode)) error = "Invalid service mode";
  else if (!data.serviceArea) error = "Service area is required";

  return { data, error };
}