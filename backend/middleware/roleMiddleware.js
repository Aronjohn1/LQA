module.exports = function roleMiddleware(requiredRole) {
  return (req, res, next) => {
    if (!req.user)
      return res.status(401).json({ message: "Unauthorized. No user data." });

    const actual = String(req.user.role || req.user.category || "").toLowerCase();
    const required = String(requiredRole || "").toLowerCase();

    if (actual !== required)
      return res.status(403).json({ message: "Forbidden. Access denied." });

    next();
  };
};

