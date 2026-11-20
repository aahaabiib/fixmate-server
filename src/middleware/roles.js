function requireRole(role) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    if (req.user.role !== role) {
      return res.status(403).json({ message: `Forbidden: ${role} access only` });
    }
    next();
  };
}

export const verifyCustomer = requireRole("customer");
export const verifyTechnician = requireRole("technician");
export const verifyAdmin = requireRole("admin");