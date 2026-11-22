import { getDb } from "../config/db.js";

const PHONE_REGEX = /^[0-9+\-\s()]{6,20}$/;

function shapeUser(u) {
  return {
    id: String(u._id),
    name: u.name || "",
    email: u.email,
    role: u.role || "customer",
    image: u.image || "",
    phone: u.phone || "",
    area: u.area || "",
    bio: u.bio || "",
    createdAt: u.createdAt || null,
  };
}

// GET /api/users/profile
export async function getProfile(req, res) {
  try {
    const db = await getDb();
    const user = await db.collection("user").findOne({ email: req.user.email });
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ user: shapeUser(user) });
  } catch (err) {
    console.error("getProfile error:", err.message);
    res.status(500).json({ message: "Could not load profile" });
  }
}

// PATCH /api/users/profile
// shudhu name, phone, area, bio, image change kora jay. role/email kokhono na.
export async function updateProfile(req, res) {
  try {
    const body = req.body || {};
    const set = {};

    if (body.name !== undefined) {
      const name = String(body.name).trim();
      if (name.length < 2 || name.length > 60) {
        return res.status(400).json({ message: "Name must be 2 to 60 characters" });
      }
      set.name = name;
    }

    if (body.phone !== undefined) {
      const phone = String(body.phone).trim();
      if (phone && !PHONE_REGEX.test(phone)) {
        return res.status(400).json({ message: "Enter a valid phone number" });
      }
      set.phone = phone;
    }

    if (body.area !== undefined) {
      const area = String(body.area).trim();
      if (area.length > 100) {
        return res.status(400).json({ message: "Area is too long (max 100)" });
      }
      set.area = area;
    }

    if (body.bio !== undefined) {
      const bio = String(body.bio).trim();
      if (bio.length > 300) {
        return res.status(400).json({ message: "Bio is too long (max 300)" });
      }
      set.bio = bio;
    }

    if (body.image !== undefined) {
      const image = String(body.image).trim();
      if (image && (!/^https:\/\//i.test(image) || image.length > 500)) {
        return res.status(400).json({ message: "Invalid image URL" });
      }
      set.image = image;
    }

    if (Object.keys(set).length === 0) {
      return res.status(400).json({ message: "Nothing to update" });
    }
    set.updatedAt = new Date();

    const db = await getDb();
    const users = db.collection("user");
    const result = await users.updateOne({ email: req.user.email }, { $set: set });
    if (result.matchedCount === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = await users.findOne({ email: req.user.email });
    res.json({ message: "Profile updated", user: shapeUser(user) });
  } catch (err) {
    console.error("updateProfile error:", err.message);
    res.status(500).json({ message: "Could not update profile" });
  }
}