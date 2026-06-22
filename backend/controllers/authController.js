const jwt = require("jsonwebtoken");
const { User, College, Teacher, Instructor, Senior, Junior, Elementary, Op } = require("../models");
const { hashPassword, verifyPassword, isBcryptHash } = require("../utils/accountSecurity");

const SECRET = process.env.JWT_SECRET;

async function comparePassword(plainPassword, storedPassword) {
  if (!plainPassword || !storedPassword) return false;
  if (isBcryptHash(storedPassword)) {
     return await verifyPassword(plainPassword, storedPassword);
  }
  return plainPassword === storedPassword;
}

const USER_TYPES = [
  { prefix: "G", model: College, col: "c_id", nameCol: "c_name", category: "college" },
  { prefix: "T", model: Teacher, col: "t_id", nameCol: "t_name", category: "teacher" },
  { prefix: "I", model: Instructor, col: "i_id", nameCol: "i_name", category: "instructor" },
  { prefix: "S", model: Senior, col: "s_id", nameCol: "s_name", category: "senior" },
  { prefix: "J", model: Junior, col: "j_id", nameCol: "j_name", category: "junior" },
  { prefix: "E", model: Elementary, col: "e_id", nameCol: "e_name", category: "elementary" }
];

function signToken(payload) {
  return jwt.sign(payload, SECRET, { expiresIn: "7d" });
}

function normalizeRole(role) {
  return String(role || "").trim().toLowerCase();
}

function normalizeInput(value) {
  return String(value || "").trim();
}

function isEqualIgnoreCase(a, b) {
  return String(a || "").trim().toLowerCase() === String(b || "").trim().toLowerCase();
}

async function findSystemUser(userId) {
  const normalized = normalizeInput(userId);
  const user = await User.findOne({
    where: {
      [Op.or]: [
        { user_id: normalized },
        { user_name: normalized }
      ]
    }
  });

  if (user) return user;

  const allSystemUsers = await User.findAll();
  return allSystemUsers.find(u =>
    isEqualIgnoreCase(u.user_id, normalized) ||
    isEqualIgnoreCase(u.user_name, normalized)
  );
}

function buildSystemResponse(systemUser) {
  const role = normalizeRole(systemUser.role);
  const token = signToken({
    id: systemUser.id,
    user_id: systemUser.user_id,
    role,
    category: role,
    name: systemUser.user_name
  });

  return {
    message: "Login successful",
    token,
    role,
    category: role,
    user_id: systemUser.user_id,
    id: systemUser.user_id,
    name: systemUser.user_name,
    user_name: systemUser.user_name,
    profile_image: systemUser.profile_image || null
  };
}

function buildPersonResponse(user, userType) {
  const { prefix, col, nameCol, category } = userType;
  const token = signToken({
    id: user.id,
    user_id: user[col],
    role: prefix,
    category,
    name: user[nameCol]
  });

  const response = {
    message: "Login successful",
    token,
    role: prefix,
    category,
    name: user[nameCol],
    id: user[col],
    [col]: user[col],
    [nameCol]: user[nameCol],
    profile_image: user.profile_image || null
  };

  if (category === "college") {
    response.c_program = user.c_program;
    response.c_year_block = user.c_year_block;
  } else if (category === "senior") {
    response.s_program = user.s_program;
    response.s_gradelevel = user.s_gradelevel;
    response.s_section = user.s_section;
  } else if (category === "junior") {
    response.j_program = user.j_program;
    response.j_section = user.j_section;
  } else if (category === "elementary") {
    response.e_program = user.e_program;
    response.e_section = user.e_section;
  } else if (category === "teacher") {
    response.t_teacherlevel = user.t_teacherlevel;
  } else if (category === "instructor") {
    response.i_instructorlevel = user.i_instructorlevel;
  }

  return response;
}

const login = async (req, res) => {
  try {
    const userId = normalizeInput(req.body.user_id);
    const password = String(req.body.password || "");

    if (!userId || !password) {
      return res.status(400).json({ message: "User ID and password are required" });
    }

    const systemUser = await findSystemUser(userId);

    if (systemUser) {
      const passwordValid = await comparePassword(password, systemUser.pass);
      if (!passwordValid) return res.status(401).json({ message: "Incorrect password" });
      return res.json(buildSystemResponse(systemUser));
    }

    for (const userType of USER_TYPES) {
      let user = await userType.model.findOne({ where: { [userType.col]: userId } });
      if (!user) {
        const allUsers = await userType.model.findAll();
        user = allUsers.find(u => isEqualIgnoreCase(u[userType.col], userId));
      }
      if (!user) continue;

      const passwordValid = await comparePassword(password, user.password);
      if (!passwordValid) return res.status(401).json({ message: "Incorrect password" });
      return res.json(buildPersonResponse(user, userType));
    }

    return res.status(404).json({ message: "User not found" });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user?.user_id;
    const category = req.user?.category;

    if (!userId) return res.status(401).json({ message: "Not authorized" });
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Current and new password are required" });
    }
    if (String(newPassword).length < 6) {
      return res.status(400).json({ message: "New password must be at least 6 characters" });
    }

    if (category === "admin" || category === "librarian") {
      const user = await User.findOne({ where: { user_id: userId } });
      if (!user) return res.status(404).json({ message: "User not found" });

      const passwordValid = await comparePassword(currentPassword, user.pass);
      if (!passwordValid) {
        return res.status(401).json({ message: "Incorrect current password" });
      }

      await User.update({ pass: newPassword }, { where: { id: user.id } });
      return res.json({ message: "Password updated successfully" });
    }

    const userType = USER_TYPES.find(type => type.category === category);
    if (!userType) return res.status(400).json({ message: "Unsupported account type" });

    const user = await userType.model.findOne({ where: { [userType.col]: userId } });
    if (!user) return res.status(404).json({ message: "User not found" });

    const passwordValid = await comparePassword(currentPassword, user.password);
    if (!passwordValid) {
      return res.status(401).json({ message: "Incorrect current password" });
    }

    await userType.model.update(
      { password: newPassword },
      { where: { id: user.id } }
    );
    return res.json({ message: "Password updated successfully" });
  } catch (err) {
    console.error("Change password error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

const testUser = async (req, res) => {
  res.json({
    message: "JWT decoded successfully",
    user: req.user,
    checks: {
      hasId: Boolean(req.user.id),
      hasUserId: Boolean(req.user.user_id),
      hasRole: Boolean(req.user.role),
      hasCategory: Boolean(req.user.category),
      hasName: Boolean(req.user.name)
    }
  });
};

const getAllUsers = async (req, res) => {
  try {
    const people = await Promise.all(
      USER_TYPES.map(async ({ model, col, nameCol, category }) => {
        const users = await model.findAll();
        return users.map(user => ({
          id: user[col],
          name: user[nameCol],
          category,
          source: model.name
        }));
      })
    );

    const systemUsers = await User.findAll();
    const users = [
      ...people.flat(),
      ...systemUsers.map(user => ({
        id: user.user_id,
        name: user.user_name,
        category: normalizeRole(user.role),
        source: "User"
      }))
    ];

    res.json({ total: users.length, users });
  } catch (err) {
    console.error("Get all users error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  login,
  changePassword,
  testUser,
  getAllUsers,
  USER_TYPES,
  SECRET
};
