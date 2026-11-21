import { getCollections } from "../config/db.js";
import { CATEGORIES, SERVICE_MODES } from "../constants.js";
import { toObjectId } from "../utils/object-id.js";
import { validateServiceInput } from "../utils/validate-service.js";

const SORTS = {
  newest: { createdAt: -1, _id: -1 },
  "price-asc": { basePrice: 1, _id: 1 },
  "price-desc": { basePrice: -1, _id: 1 },
};

// User er search text ke regex e dhokar age special character neutralize kori
function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// GET /api/services?search=&category=&mode=&sort=&page=&limit=
export async function getServices(req, res, next) {
  try {
    const { services } = await getCollections();

    const search = String(req.query.search ?? "").trim();
    const category = String(req.query.category ?? "");
    const mode = String(req.query.mode ?? "");
    const sort = SORTS[req.query.sort] ? req.query.sort : "newest";
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 12, 1), 50);

    const filter = { approvalStatus: "approved", isAvailable: true };

    if (search) {
      const regex = new RegExp(escapeRegex(search), "i");
      filter.$or = [{ title: regex }, { category: regex }];
    }
    if (CATEGORIES.includes(category)) filter.category = category;
    if (SERVICE_MODES.includes(mode)) filter.serviceMode = mode;

    const [items, total] = await Promise.all([
      services
        .find(filter)
        .sort(SORTS[sort])
        .skip((page - 1) * limit)
        .limit(limit)
        .toArray(),
      services.countDocuments(filter),
    ]);

    res.json({
      services: items,
      total,
      page,
      limit,
      totalPages: Math.max(Math.ceil(total / limit), 1),
    });
  } catch (error) {
    next(error);
  }
}

// GET /api/services/:id (shudhu approved + available)
export async function getServiceById(req, res, next) {
  try {
    const _id = toObjectId(req.params.id);
    if (!_id) return res.status(404).json({ message: "Service not found" });

    const { services, users } = await getCollections();
    const service = await services.findOne({
      _id,
      approvalStatus: "approved",
      isAvailable: true,
    });
    if (!service) return res.status(404).json({ message: "Service not found" });

    const technician = await users.findOne(
      { email: service.technicianEmail },
      { projection: { _id: 0, name: 1, image: 1, area: 1, bio: 1 } }
    );

    res.json({ service, technician });
  } catch (error) {
    next(error);
  }
}