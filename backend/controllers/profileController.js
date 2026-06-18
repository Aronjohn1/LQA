const multer = require("multer");
const path = require("path");
const fs = require("fs");
const jwt = require("jsonwebtoken");
const { User, College, Senior, Junior, Elementary, Teacher, Instructor } = require("../models");

const SECRET = process.env.JWT_SECRET || "your_jwt_secret";
const API_ORIGIN = process.env.API_ORIGIN || "http://localhost:1000";

const userModels = [
  { name: "College", model: College, idField: "c_id", nameField: "c_name" },
  { name: "Senior", model: Senior, idField: "s_id", nameField: "s_name" },
  { name: "Junior", model: Junior, idField: "j_id", nameField: "j_name" },
  { name: "Elementary", model: Elementary, idField: "e_id", nameField: "e_name" },
  { name: "Teacher", model: Teacher, idField: "t_id", nameField: "t_name" },
  { name: "Instructor", model: Instructor, idField: "i_id", nameField: "i_name" },
  { name: "User", model: User, idField: "user_id", nameField: "user_name" }
];

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, "..", "uploads", "profile");
    if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const identifier = req.params.identifier || req.user?.user_id || "unknown";
    const safeIdentifier = String(identifier).replace(/[^a-zA-Z0-9-]/g, "_");
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `profile_${safeIdentifier}_${unique}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    cb(file.mimetype.startsWith("image/") ? null : new Error("Only image files are allowed"), file.mimetype.startsWith("image/"));
  },
  limits: { fileSize: 2 * 1024 * 1024 }
});

const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "No token provided" });

  try {
    req.user = jwt.verify(token, SECRET);
    req.userId = req.user.user_id;
    req.userRole = req.user.role;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

function withProfileUrl(data) {
  const result = { ...data };
  if (result.profile_image && !String(result.profile_image).startsWith("http")) {
    result.profile_image = `${API_ORIGIN}/uploads/profile/${result.profile_image}`;
  }
  return result;
}

async function findUserByIdentifier(identifier) {
  for (const config of userModels) {
    const user = await config.model.findOne({ where: { [config.idField]: identifier } });
    if (user) return { config, user };
  }
  return null;
}

const getuserprofile = async (req, res) => {
  try {
    const identifier = req.userId || req.user?.user_id;
    if (!identifier) return res.status(400).json({ message: "User ID not found" });

    const found = await findUserByIdentifier(identifier);
    if (!found) return res.status(404).json({ message: "User not found in database" });

    const data = found.user.toJSON();
    data.user_id = data[found.config.idField];
    data.user_name = data[found.config.nameField];
    data.role = data.role || req.userRole;

    delete data.pass;
    delete data.password;

    res.json(withProfileUrl(data));
  } catch (err) {
    console.error("Profile fetch error:", err);
    res.status(500).json({ message: "Error fetching profile", error: err.message });
  }
};

const postuploadidentifier = async (req, res) => {
  let uploadedFilePath = null;

  try {
    const identifier = req.params.identifier;
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    uploadedFilePath = req.file.path;
    const filename = req.file.filename;
    const found = await findUserByIdentifier(identifier);

    if (!found) {
      if (fs.existsSync(uploadedFilePath)) fs.unlinkSync(uploadedFilePath);
      return res.status(404).json({ message: "User not found", identifier });
    }

    const oldImage = found.user.profile_image;
    if (oldImage && oldImage !== filename && !String(oldImage).startsWith("http")) {
      const oldImagePath = path.join(__dirname, "..", "uploads", "profile", oldImage);
      if (fs.existsSync(oldImagePath)) fs.unlinkSync(oldImagePath);
    }

    await found.config.model.update(
      { profile_image: filename },
      { where: { [found.config.idField]: identifier } }
    );

    res.json({
      message: "Profile image uploaded successfully",
      filename,
      model: found.config.name,
      url: `${API_ORIGIN}/uploads/profile/${filename}`
    });
  } catch (err) {
    if (uploadedFilePath && fs.existsSync(uploadedFilePath)) fs.unlinkSync(uploadedFilePath);
    console.error("Profile upload error:", err);
    res.status(500).json({ message: "Error uploading image", error: err.message });
  }
};

module.exports = {
  getuserprofile,
  postuploadidentifier,
  verifyToken,
  upload
};
