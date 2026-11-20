import { createRemoteJWKSet, jwtVerify } from "jose";
import { getCollections } from "../config/db.js";

let jwks;
function getJwks() {
  if (!jwks) {
    jwks = createRemoteJWKSet(new URL(`${process.env.AUTH_URL}/api/auth/jwks`));
  }
  return jwks;
}

export async function verifyToken(req, res, next) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ message: "Unauthorized: token missing" });
  }

  let payload;
  try {
    ({ payload } = await jwtVerify(token, getJwks(), {
      issuer: process.env.AUTH_URL,
      audience: process.env.AUTH_URL,
    }));
  } catch {
    return res.status(401).json({ message: "Unauthorized: invalid or expired token" });
  }

  try {
    const { users } = await getCollections();
    const dbUser = await users.findOne({ email: payload.email });
    if (!dbUser) {
      return res.status(401).json({ message: "Unauthorized: user not found" });
    }

    req.user = {
      id: String(dbUser._id),
      name: dbUser.name,
      email: dbUser.email,
      role: dbUser.role || "customer",
    };
    next();
  } catch (error) {
    next(error);
  }
}