require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");

const db = require("./models");
const { ensureSystemAccounts } = require("./utils/accountSecurity");

const authRoutes = require("./routes/auth");
const protectedRoutes = require("./routes/protected");
const userRoutes = require("./routes/user");
const profileRoutes = require("./routes/profile");
const attendanceRoutes = require("./routes/attendance");
const requestRoutes = require("./routes/request");

const app = express();
const PORT = process.env.PORT || 1000;

app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://lqa-ten.vercel.app"
  ],
  credentials: true
}));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

app.use("/api/requests", requestRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/protected", protectedRoutes);
app.use("/api/user", userRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", database: "postgresql", orm: "prisma" });
});

app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({
    message: "Internal server error",
    detail: process.env.NODE_ENV === "production" ? undefined : err.message
  });
});

async function startServer() {
  try {
    await db.prisma.$connect();
    await ensureSystemAccounts(db);

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("Startup failed:", err.message);
    await db.prisma.$disconnect();
    process.exit(1);
  }
}

function handleShutdown() {
  db.prisma.$disconnect().finally(() => process.exit(0));
}

process.on('SIGINT', handleShutdown);
process.on('SIGTERM', handleShutdown);

startServer();
