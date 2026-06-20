
const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const authMiddleware = require("../middleware/authMiddleware");



router.post("/login", authController.login);

router.post("/change-password", authMiddleware, authController.changePassword);
router.get("/test-user", authMiddleware, authController.testUser);
router.get("/users/all", authMiddleware, authController.getAllUsers);

module.exports = router;
