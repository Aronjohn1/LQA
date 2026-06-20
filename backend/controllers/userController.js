const { College, Senior, Junior, Elementary, Teacher, Instructor, User, Op } = require("../models");
const { hashPassword, getNextSystemId } = require("../utils/accountSecurity");

const modelMap = {
  college: { 
    model: College, 
    idField: "c_id", 
    nameField: "c_name",
    validFields: ["c_id", "c_name", "c_program", "c_year_block", "password", "profile_image"]
  },
  senior: { 
    model: Senior, 
    idField: "s_id", 
    nameField: "s_name",
    validFields: ["s_id", "s_name", "s_program", "s_gradelevel", "s_section", "password", "profile_image"]
  },
  seniorHigh: { 
    model: Senior, 
    idField: "s_id", 
    nameField: "s_name",
    validFields: ["s_id", "s_name", "s_program", "s_gradelevel", "s_section", "password", "profile_image"]
  },
  junior: { 
    model: Junior, 
    idField: "j_id", 
    nameField: "j_name",
    validFields: ["j_id", "j_name", "j_program", "j_section", "password", "profile_image"]
  },
  juniorHigh: { 
    model: Junior, 
    idField: "j_id", 
    nameField: "j_name",
    validFields: ["j_id", "j_name", "j_program", "j_section", "password", "profile_image"]
  },
  elementary: { 
    model: Elementary, 
    idField: "e_id", 
    nameField: "e_name",
    validFields: ["e_id", "e_name", "e_program", "e_section", "password", "profile_image"]
  },
  teacher: { 
    model: Teacher, 
    idField: "t_id", 
    nameField: "t_name",
    validFields: ["t_id", "t_name", "t_teacherlevel", "password", "profile_image"]
  },
  instructor: { 
    model: Instructor, 
    idField: "i_id", 
    nameField: "i_name",
    validFields: ["i_id", "i_name", "i_instructorlevel", "password", "profile_image"]
  },
  admin: { 
    model: User, 
    idField: "user_id", 
    nameField: "user_name", 
    passwordField: "pass", 
    role: "admin", 
    prefix: "AD", 
    pad: 4,
    validFields: ["user_id", "user_name", "pass", "role", "profile_image"]
  },
  librarian: { 
    model: User, 
    idField: "user_id", 
    nameField: "user_name", 
    passwordField: "pass", 
    role: "librarian", 
    prefix: "LB", 
    pad: 5,
    validFields: ["user_id", "user_name", "pass", "role", "profile_image"]
  }
};

function getEntry(category) {
  return modelMap[String(category || "").trim()];
}

function removeEmptyPassword(data, passwordField) {
  if (data[passwordField] === "" || data[passwordField] === undefined) {
    delete data[passwordField];
  }
}

function excludePasswordFromResponse(data) {
  
  const cleaned = data.toJSON ? data.toJSON() : (data.dataValues || data);
  return { ...cleaned };
}

async function prepareUserPayload(entry, payload, isUpdate = false) {
  const passwordField = entry.passwordField || "password";
  const data = {};


  const validFields = entry.validFields || [];
  for (const field of validFields) {
    if (field in payload && payload[field] !== undefined && payload[field] !== null) {
      data[field] = payload[field];
    }
  }


  if (entry.role) {
    data.role = entry.role;
  }


  if (!isUpdate && !data[entry.idField] && entry.prefix) {
    data[entry.idField] = await getNextSystemId(User, entry.prefix, entry.pad);
  }

 
  if ("password" in payload || "pass" in payload) {
    const rawPassword = payload.password || payload.pass;
    if (rawPassword && String(rawPassword).trim()) {
      data[passwordField] = rawPassword; 
    }
  }
  

  if (passwordField === "password") {

    delete data.pass;
  } else if (passwordField === "pass") {

    delete data.password;
  }


  removeEmptyPassword(data, passwordField);

  return data;
}

const getUsers = async (req, res) => {
  try {
    const category = req.query.category || req.body.category;
    
    if (!category) {
      return res.status(400).json({ message: "Category is required" });
    }

    const entry = getEntry(category);
    if (!entry) {
      return res.status(400).json({ message: `Invalid category: ${category}` });
    }

    const data = await entry.model.findAll();

    const jsonData = data.map(row => excludePasswordFromResponse(row));
    
    res.json(jsonData);
  } catch (err) {
    console.error("Get users error:", err);
    res.status(500).json({ message: "Error fetching users", error: err.message });
  }
};

const getTotalUserCounts = async (req, res) => {
  try {
    const [
      collegeCount,
      seniorCount,
      juniorCount,
      elementaryCount,
      teacherCount,
      instructorCount,
      adminCount,
      librarianCount
    ] = await Promise.all([
      College.count(),
      Senior.count(),
      Junior.count(),
      Elementary.count(),
      Teacher.count(),
      Instructor.count(),
      User.count({ where: { role: "admin" } }),
      User.count({ where: { role: "librarian" } })
    ]);

    res.json({
      students: collegeCount + seniorCount + juniorCount + elementaryCount,
      teachers: teacherCount,
      instructors: instructorCount,
      admins: adminCount,
      librarians: librarianCount,
      breakdown: {
        college: collegeCount,
        seniorHigh: seniorCount,
        juniorHigh: juniorCount,
        elementary: elementaryCount
      }
    });
  } catch (err) {
    console.error("Get total counts error:", err);
    res.status(500).json({ message: "Error fetching total counts", error: err.message });
  }
};

const addUser = async (req, res) => {
  try {
    const { category, ...payload } = req.body;
    
    if (!category) {
      return res.status(400).json({ message: "Category is required" });
    }

    const entry = getEntry(category);
    if (!entry) {
      return res.status(400).json({ message: `Invalid category: ${category}` });
    }

   
    const data = await prepareUserPayload(entry, payload);
    
    if (!data[entry.idField]) {
      return res.status(400).json({ message: `${entry.idField} is required` });
    }


    const existing = await entry.model.findOne({ 
      where: { [entry.idField]: data[entry.idField] } 
    });

    if (existing) {
      return res.status(409).json({ message: `User ID ${data[entry.idField]} already exists` });
    }


    if (!data[entry.passwordField || "password"]) {
      return res.status(400).json({ message: "Password must be provided or generated" });
    }

    const result = await entry.model.create(data);
    const resultData = result.toJSON ? result.toJSON() : result.dataValues || result;
    
 
    const passwordFieldName = entry.passwordField || "password";
    const plainPassword = payload.password || payload.pass;
    

    const responseData = excludePasswordFromResponse(result);
    
    res.status(201).json({ 
      message: "User added successfully", 
      data: responseData,
      id: resultData[entry.idField],
      password: plainPassword 
    });
  } catch (err) {
    console.error("Add user error:", err);
    console.error("Error stack:", err.stack);
    console.error("Error details:", {
      message: err.message,
      code: err.code,
      meta: err.meta
    });
    
    res.status(500).json({ 
      message: "Error adding user", 
      error: err.message,
      details: process.env.NODE_ENV === 'development' ? err.toString() : undefined
    });
  }
};

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { category, ...payload } = req.body;
    
    const entry = getEntry(category);
    if (!entry) {
      return res.status(400).json({ message: "Invalid category" });
    }

    const data = await prepareUserPayload(entry, payload, true);
    const where = Number.isNaN(Number(id)) ? { [entry.idField]: id } : { id: Number(id) };
    
    const updated = await entry.model.update(data, { where });

    if (updated[0] === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    
    res.json({ message: "User updated successfully" });
  } catch (err) {
    console.error("Update user error:", err);
    res.status(500).json({ 
      message: "Error updating user", 
      error: err.message 
    });
  }
};

const importUsers = async (req, res) => {
  try {
    const { category, data } = req.body;
    const entry = getEntry(category);
    
    if (!entry) {
      return res.status(400).json({ message: `Invalid category: ${category}` });
    }
    if (!Array.isArray(data)) {
      return res.status(400).json({ message: "Import data must be an array" });
    }

    const processedData = [];
    let skipped = 0;

    for (const row of data) {
      if (!row[entry.idField]) {
        skipped++;
        continue;
      }

  
      const exists = await entry.model.findOne({ 
        where: { [entry.idField]: row[entry.idField] } 
      });
      if (exists) {
        skipped++;
        continue;
      }

   
      let password = row.password || row.pass;
      if (!password && row[entry.nameField]) {
        password = String(row[entry.nameField]).split(" ").filter(Boolean).pop();
      }
      if (!password) {
        password = "default123";
      }


      const payload = await prepareUserPayload(entry, {
        ...row,
        password
      });

      if (payload[entry.idField]) {
        processedData.push(payload);
      }
    }

    if (processedData.length === 0) {
      return res.status(400).json({ 
        message: "No new users to import",
        skipped: skipped
      });
    }

    const result = await entry.model.bulkCreate(processedData);
    res.json({ 
      message: "Users imported successfully", 
      imported: processedData.length,
      skipped: skipped,
      total: data.length
    });
  } catch (err) {
    console.error("Import users error:", err);
    res.status(500).json({ 
      message: "Error importing users", 
      error: err.message,
      details: process.env.NODE_ENV === 'development' ? err.toString() : undefined
    });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const category = req.query.category;
    
    if (!id) {
      return res.status(400).json({ message: "User ID is required" });
    }
    
    const entry = getEntry(category);
    if (!entry) {
      return res.status(400).json({ message: `Invalid category: ${category}` });
    }

    const where = Number.isNaN(Number(id)) ? { [entry.idField]: id } : { id: Number(id) };
    const numDeleted = await entry.model.destroy({ where });
    
    if (numDeleted === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "User deleted successfully", deletedCount: numDeleted });
  } catch (err) {
    console.error("Delete user error:", err);
    res.status(500).json({ 
      message: "Error deleting user", 
      error: err.message 
    });
  }
};

const batchDeleteUsers = async (req, res) => {
  try {
    const { ids, category } = req.body;
    
    if (!category || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "Category and user IDs are required" });
    }

    const entry = getEntry(category);
    if (!entry) {
      return res.status(400).json({ message: `Invalid category: ${category}` });
    }

    const numericIds = ids.map(id => Number(id)).filter(Number.isFinite);
    const stringIds = ids.map(String).filter(id => Number.isNaN(Number(id)));
    let deletedCount = 0;

    if (numericIds.length > 0) {
      deletedCount += await entry.model.destroy({ 
        where: { id: { [Op.in]: numericIds } } 
      });
    }
    if (stringIds.length > 0) {
      deletedCount += await entry.model.destroy({ 
        where: { [entry.idField]: { [Op.in]: stringIds } } 
      });
    }

    res.json({ 
      message: `${deletedCount} users deleted successfully`, 
      deletedCount 
    });
  } catch (err) {
    console.error("Batch delete users error:", err);
    res.status(500).json({ 
      message: "Error performing batch deletion", 
      error: err.message 
    });
  }
};

const deleteAllUsers = async (req, res) => {
  try {
    const category = req.query.category;
    
    if (!category) {
      return res.status(400).json({ message: "Category is required" });
    }

    const entry = getEntry(category);
    if (!entry) {
      return res.status(400).json({ message: `Invalid category: ${category}` });
    }

    const deletedCount = await entry.model.destroy({ where: {} });
    res.json({ 
      message: "All users deleted successfully", 
      deletedCount 
    });
  } catch (err) {
    console.error("Delete all users error:", err);
    res.status(500).json({ 
      message: "Error deleting all users", 
      error: err.message 
    });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { category, userId } = req.body;
    
    if (!category || !userId) {
      return res.status(400).json({ message: "Category and user ID are required" });
    }

    const entry = getEntry(category);
    if (!entry) {
      return res.status(400).json({ message: `Invalid category: ${category}` });
    }

    const passwordField = entry.passwordField || "password";
    

    const newPassword = generateSecurePassword();
    

    const user = await entry.model.findOne({
      where: { [entry.idField]: userId }
    });

    if (!user) {
      return res.status(404).json({ message: `User not found with ID: ${userId}` });
    }


    await user.update({ [passwordField]: newPassword });

    res.json({ 
      message: "Password reset successfully",
      password: newPassword,
      userId: userId
    });
  } catch (err) {
    console.error("Reset password error:", err);
    res.status(500).json({ 
      message: "Error resetting password", 
      error: err.message 
    });
  }
};


function generateSecurePassword() {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const special = '!@#$%^&*';
  
  const allChars = uppercase + lowercase + numbers + special;
  let password = '';
  

  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += special[Math.floor(Math.random() * special.length)];
  

  for (let i = 4; i < 12; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  

  return password.split('').sort(() => Math.random() - 0.5).join('');
}

module.exports = {
  getUsers,
  getTotalUserCounts,
  addUser,
  updateUser,
  importUsers,
  deleteUser,
  deleteAllUsers,
  batchDeleteUsers,
  resetPassword
};
