
const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');


router.get("/profile", 
  profileController.verifyToken,      
  profileController.getuserprofile   
);


router.post("/upload/:identifier", 
  profileController.verifyToken,
  profileController.upload.fields([
    { name: 'profile', maxCount: 1 },
    { name: 'profile_image', maxCount: 1 }
  ]),
  (req, res, next) => {
    req.file = req.files?.profile?.[0] || req.files?.profile_image?.[0];
    next();
  },
  profileController.postuploadidentifier            
);

module.exports = router;
