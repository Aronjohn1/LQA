const express = require("express");
const router = express.Router();

const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");
const { User } = require("../models");

function sanitizeSystemUser(user) {
  if (!user) return null;
  const data = user.toJSON ? user.toJSON() : { ...user };
  delete data.pass;
  return data;
}

router.get("/", auth, async (req, res) => {
  try {
    const user = await User.findOne({ where: { user_id: req.user.user_id } });
    res.json({
      message: "Protected data",
      user: sanitizeSystemUser(user) || req.user
    });
  } catch (err) {
    console.error("Protected route error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/admin", auth, role("admin"), (req, res) => {
  res.json({ message: "Admin access granted", user: req.user });
});

router.get("/librarian", auth, role("librarian"), (req, res) => {
  res.json({ message: "Librarian access granted", user: req.user });
});

router.get("/student", auth, role("student"), (req, res) => {
  res.json({ message: "Student access granted", user: req.user });
});

router.get("/teacher", auth, role("teacher"), (req, res) => {
  res.json({ message: "Teacher access granted", user: req.user });
});

router.get("/instructor", auth, role("instructor"), (req, res) => {
  res.json({ message: "Instructor access granted", user: req.user });
});

module.exports = router;
