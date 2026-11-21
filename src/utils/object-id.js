import { ObjectId } from "mongodb";

// Thik 24 ta hex character hole ObjectId, na hole null (invalid id te crash hobe na)
export function toObjectId(id) {
  return /^[a-f\d]{24}$/i.test(String(id)) ? new ObjectId(String(id)) : null;
}