const jwt = require("jsonwebtoken");

const SECRET = process.env.JWT_SECRET || "your_jwt_secret";

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: "No token" });

  const token = authHeader.split(" ")[1];
  try {
    req.user = jwt.verify(token, SECRET);
    next();
  } catch (err) {
    res.status(403).json({ message: "Invalid token" });
  }
};

const requireAdmin = (req, res, next) => {
  const role = String(req.user?.role || "").toLowerCase();
  if (role === "admin") return next();
  res.status(403).json({ message: "Admin access required" });
};

const requireLibrarian = (req, res, next) => {
  const role = String(req.user?.role || "").toLowerCase();
  if (role === "librarian" || role === "librarian staff") return next();
  res.status(403).json({ message: "Librarian access required" });
};

module.exports = authenticateToken;
module.exports.requireAdmin = requireAdmin;
module.exports.requireLibrarian = requireLibrarian;
