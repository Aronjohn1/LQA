const express = require("express");
const router = express.Router();
const {
  getUsers,
  addUser,
  importUsers,
  updateUser,
  deleteUser,
  deleteAllUsers,
  getTotalUserCounts,
  batchDeleteUsers,
  resetPassword
} = require("../controllers/userController");

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const authController = require("../controllers/authController");
const profileController = require("../controllers/profileController");

router.get("/counts", getTotalUserCounts);

router.get("/profile",
  authMiddleware,
  profileController.getuserprofile
);

router.post("/change-password",
  authMiddleware,
  authController.changePassword
);

router.post("/reset-password",
  authMiddleware,
  roleMiddleware("admin"),
  resetPassword
);

router.get("/", 
  authMiddleware,                   
  roleMiddleware("admin"),          
  getUsers
);

router.post("/", 
  authMiddleware,                    
  roleMiddleware("admin"),         
  addUser
);

router.post("/import", 
  authMiddleware,                    
  roleMiddleware("admin"),          
  importUsers
);

// ⚠️ CRITICAL: These specific routes MUST come BEFORE /:id
router.delete("/batch", 
  authMiddleware,                    
  roleMiddleware("admin"),          
  batchDeleteUsers
);

router.delete("/delete-all", 
  authMiddleware,                    
  roleMiddleware("admin"),         
  deleteAllUsers
);

// /:id routes must come LAST
router.put("/:id", 
  authMiddleware,                    
  roleMiddleware("admin"),          
  updateUser
);

router.delete("/:id", 
  authMiddleware,                    
  roleMiddleware("admin"),          
  deleteUser
);

module.exports = router;
