const {
  request_college,
  request_senior,
  request_junior,
  request_elementary,
  request_teacher,
  request_instructor,
  College,
  Senior,
  Junior,
  Elementary,
  Teacher,
  Instructor
} = require("../models");


const getRequestModel = (category) => {
  switch (category) {
    case 'college': return request_college;
    case 'senior': return request_senior;
    case 'junior': return request_junior;
    case 'elementary': return request_elementary;
    case 'teacher': return request_teacher;
    case 'instructor': return request_instructor;
    default: return null;
  }
};


const getUserModel = (category) => {
  switch (category) {
    case 'college': return College;
    case 'senior': return Senior;
    case 'junior': return Junior;
    case 'elementary': return Elementary;
    case 'teacher': return Teacher;
    case 'instructor': return Instructor;
    default: return null;
  }
};


const createRequest = async (req, res) => {
  try {
    const { 
      user_id, 
      user_name, 
      user_category,
      request_data 
    } = req.body;

    console.log("=== CREATE REQUEST DEBUG ===");
    console.log("Received body:", JSON.stringify(req.body, null, 2));
    console.log("User ID from request:", user_id);
    console.log("User category from request:", user_category);
    console.log(" Request data:", JSON.stringify(request_data, null, 2));


    if (!user_id || !user_category || !request_data || !request_data.reason) {
      console.log(" Validation failed - missing fields");
      return res.status(400).json({
        message: "Missing required fields",
        received: { user_id, user_category, has_request_data: !!request_data }
      });
    }

    const RequestModel = getRequestModel(user_category);
    if (!RequestModel) {
      console.log(" Invalid category:", user_category);
      return res.status(400).json({
        message: "Invalid user category"
      });
    }


    const UserModel = getUserModel(user_category);
    const idField = `${user_category.charAt(0)}_id`;
    
    console.log(` Looking up user with ${idField} = ${user_id}`);
    
    const user = await UserModel.findOne({ 
      where: { [idField]: user_id } 
    });

    if (!user) {
      console.log(" User not found in database");
      console.log(`Searched for: ${idField} = ${user_id}`);
      return res.status(404).json({
        message: "User not found in database",
        searched: { field: idField, value: user_id }
      });
    }

    console.log(" User found:", user.toJSON());

  
    let requestPayload = {
      [idField]: user_id,
      reason: request_data.reason,
      status: 'pending'
    };

    switch (user_category) {
      case 'college':
  
        requestPayload.old_program = user.c_program || '';
        requestPayload.old_year_block = user.c_year_block || '';
        
    
        requestPayload.new_program = request_data.new_program || '';
        requestPayload.new_year_block = request_data.new_year_block || '';
        
        console.log("College request:", {
          old: { program: requestPayload.old_program, year_block: requestPayload.old_year_block },
          new: { program: requestPayload.new_program, year_block: requestPayload.new_year_block }
        });
        break;

      case 'senior':
        requestPayload.old_program = user.s_program || '';
        requestPayload.old_gradelevel = user.s_gradelevel || '';
        requestPayload.old_section = user.s_section || '';
        
        requestPayload.new_program = request_data.new_program || '';
        requestPayload.new_gradelevel = request_data.new_gradelevel || '';
        requestPayload.new_section = request_data.new_section || '';
        break;

      case 'junior':
        requestPayload.old_program = user.j_program || '';
        requestPayload.old_section = user.j_section || '';
        
        requestPayload.new_program = request_data.new_program || '';
        requestPayload.new_section = request_data.new_section || '';
        break;

      case 'elementary':
        requestPayload.old_section = user.e_section || '';
        
        requestPayload.new_section = request_data.new_section || '';
        break;

      case 'teacher':
        requestPayload.old_teacherlevel = user.t_teacherlevel || '';
        
        requestPayload.new_teacherlevel = request_data.new_teacherlevel || '';
        break;

      case 'instructor':
        requestPayload.old_instructorlevel = user.i_instructorlevel || '';
        
        requestPayload.new_instructorlevel = request_data.new_instructorlevel || '';
        break;
    }

    console.log("Final request payload:", JSON.stringify(requestPayload, null, 2));

    // Create the request
    const request = await RequestModel.create(requestPayload);
    console.log(" Request created successfully:", request.toJSON());

    res.status(201).json({
      message: "Request submitted successfully",
      request
    });

  } catch (error) {
    console.error(" Create Request Error:", error);
    console.error("Error stack:", error.stack);
    res.status(500).json({
      message: "Error submitting request",
      error: error.message,
      details: error.errors ? error.errors.map(e => e.message) : undefined
    });
  }
};


const getMyRequests = async (req, res) => {
  try {
    const { user_id, user_category } = req.query;

    console.log("=== GET MY REQUESTS ===");
    console.log("User ID:", user_id);
    console.log("User Category:", user_category);

    if (!user_id || !user_category) {
      return res.status(400).json({
        message: "User ID and category required"
      });
    }

    const RequestModel = getRequestModel(user_category);
    if (!RequestModel) {
      return res.status(400).json({
        message: "Invalid user category"
      });
    }

    const idField = `${user_category.charAt(0)}_id`;
    const requests = await RequestModel.findAll({
      where: { [idField]: user_id },
      order: [['id', 'DESC']] 
    });

    console.log(` Found ${requests.length} requests for user ${user_id}`);
    res.json(requests);

  } catch (error) {
    console.error("Get My Requests Error:", error);
    res.status(500).json({
      message: "Error fetching requests",
      error: error.message
    });
  }
};


const getAllRequests = async (req, res) => {
  try {
    const { status, category } = req.query;

    console.log("=== GET ALL REQUESTS ===");
    console.log("Filters:", { status, category });

    const requestModels = [
      { model: request_college, category: 'college', userModel: College, nameField: 'c_name', idField: 'c_id' },
      { model: request_senior, category: 'senior', userModel: Senior, nameField: 's_name', idField: 's_id' },
      { model: request_junior, category: 'junior', userModel: Junior, nameField: 'j_name', idField: 'j_id' },
      { model: request_elementary, category: 'elementary', userModel: Elementary, nameField: 'e_name', idField: 'e_id' },
      { model: request_teacher, category: 'teacher', userModel: Teacher, nameField: 't_name', idField: 't_id' },
      { model: request_instructor, category: 'instructor', userModel: Instructor, nameField: 'i_name', idField: 'i_id' }
    ];

    let allRequests = [];

    for (const { model, category: cat, userModel, nameField, idField } of requestModels) {
      if (category && category !== 'all' && category !== cat) {
        continue;
      }

      let where = {};
      if (status && status !== 'all') {
        where.status = status;
      }

      const requests = await model.findAll({
        where,
        order: [['id', 'DESC']] 
      });

      console.log(`Found ${requests.length} requests in ${cat} category`);

  
      const requestsWithNames = await Promise.all(
        requests.map(async (req) => {
          const reqJson = req.toJSON();
          try {
            const user = await userModel.findOne({
              where: { [idField]: reqJson[idField] }
            });
            return {
              ...reqJson,
              user_category: cat,
              user_name: user ? user[nameField] : 'Unknown User'
            };
          } catch (err) {
            console.error(`Error fetching user for ${cat}:`, err);
            return {
              ...reqJson,
              user_category: cat,
              user_name: 'Unknown User'
            };
          }
        })
      );

      allRequests = [...allRequests, ...requestsWithNames];
    }


    allRequests.sort((a, b) => {
      if (a.status === 'pending' && b.status !== 'pending') return -1;
      if (a.status !== 'pending' && b.status === 'pending') return 1;
      return b.id - a.id; 
    });

    console.log(` Total requests found: ${allRequests.length}`);
    res.json(allRequests);

  } catch (error) {
    console.error("Get All Requests Error:", error);
    res.status(500).json({
      message: "Error fetching requests",
      error: error.message
    });
  }
};


const updateRequestStatus = async (req, res) => {
  try {
    const { id, category } = req.params;
    const { status, admin_response } = req.body;

    console.log("=== UPDATE REQUEST DEBUG ===");
    console.log("Category:", category);
    console.log("Request ID:", id);
    console.log("New status:", status);
    console.log("Admin response:", admin_response);

    if (!status || !['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        message: "Invalid status. Must be 'approved' or 'rejected'"
      });
    }

    if (!category) {
      return res.status(400).json({
        message: "Category is required"
      });
    }

    const RequestModel = getRequestModel(category);
    if (!RequestModel) {
      return res.status(400).json({
        message: "Invalid category"
      });
    }

    const request = await RequestModel.findByPk(id);
    if (!request) {
      return res.status(404).json({
        message: "Request not found"
      });
    }

    console.log("Found request:", request.toJSON());


    request.status = status;
    if (admin_response) {
      request.admin_response = admin_response;
    }
    request.reviewed_at = new Date();
    await request.save();

    console.log(" Request updated");

 
    if (status === 'approved') {
      await updateUserRecord(request, category);
      console.log(" User record updated");
    }

    res.json({
      message: `Request ${status} successfully`,
      request
    });

  } catch (error) {
    console.error("Update Request Error:", error);
    res.status(500).json({
      message: "Error updating request",
      error: error.message
    });
  }
};



const updateUserRecord = async (request, category) => {
  try {
    const UserModel = getUserModel(category);
    if (!UserModel) return;

    const idField = `${category.charAt(0)}_id`;
    const userId = request[idField];
    
    let updateData = {};

    switch (category) {
      case 'college':
      
        if (request.new_program && request.new_program !== '') {
          updateData.c_program = request.new_program;
        }
        if (request.new_year_block && request.new_year_block !== '') {
          updateData.c_year_block = request.new_year_block;
        }
        break;

      case 'senior':
        if (request.new_program && request.new_program !== '') {
          updateData.s_program = request.new_program;
        }
        if (request.new_gradelevel && request.new_gradelevel !== '') {
          updateData.s_gradelevel = request.new_gradelevel;
        }
        if (request.new_section && request.new_section !== '') {
          updateData.s_section = request.new_section;
        }
        break;

      case 'junior':
        if (request.new_program && request.new_program !== '') {
          updateData.j_program = request.new_program;
        }
        if (request.new_section && request.new_section !== '') {
          updateData.j_section = request.new_section;
        }
        break;

      case 'elementary':
        if (request.new_section && request.new_section !== '') {
          updateData.e_section = request.new_section;
        }
        break;

      case 'teacher':
        if (request.new_teacherlevel && request.new_teacherlevel !== '') {
          updateData.t_teacherlevel = request.new_teacherlevel;
        }
        break;

      case 'instructor':
        if (request.new_instructorlevel && request.new_instructorlevel !== '') {
          updateData.i_instructorlevel = request.new_instructorlevel;
        }
        break;
    }

    console.log("Updating user with data:", updateData);

    if (Object.keys(updateData).length > 0) {
      await UserModel.update(updateData, {
        where: { [idField]: userId }
      });
      console.log(` Updated ${category} user ${userId}`);
    } else {
      console.log(`ℹNo fields to update for ${category} user ${userId}`);
    }

  } catch (error) {
    console.error("Update User Record Error:", error);
    throw error;
  }
};


const getRequestDetails = async (req, res) => {
  try {
    const { id, category } = req.params;

    console.log("=== GET REQUEST DETAILS ===");
    console.log("ID:", id);
    console.log("Category:", category);

    if (!category) {
      return res.status(400).json({
        message: "Category is required"
      });
    }

    const RequestModel = getRequestModel(category);
    if (!RequestModel) {
      return res.status(400).json({
        message: "Invalid category"
      });
    }

    const request = await RequestModel.findByPk(id);
    if (!request) {
      return res.status(404).json({
        message: "Request not found"
      });
    }

    // Get user info
    const UserModel = getUserModel(category);
    const idField = `${category.charAt(0)}_id`;
    const nameField = `${category.charAt(0)}_name`;
    const userId = request[idField];
    
    const user = await UserModel.findOne({
      where: { [idField]: userId }
    });

    const response = {
      ...request.toJSON(),
      user_name: user ? user[nameField] : 'Unknown',
      user_category: category
    };

    console.log(" Found request details");
    res.json(response);

  } catch (error) {
    console.error("Get Request Details Error:", error);
    res.status(500).json({
      message: "Error fetching request details",
      error: error.message
    });
  }
};


const getUserInfoForRequest = async (req, res) => {
  try {
    const { user_id, user_category } = req.query;

    console.log("=== GET USER INFO FOR REQUEST ===");
    console.log("User ID:", user_id);
    console.log("User Category:", user_category);


    if (!user_id || !user_category) {
      return res.status(400).json({
        message: "User ID and category are required"
      });
    }

    const UserModel = getUserModel(user_category);
    if (!UserModel) {
      return res.status(400).json({
        message: "Invalid user category"
      });
    }

    const idField = `${user_category.charAt(0)}_id`;
    const nameField = `${user_category.charAt(0)}_name`;
    
    console.log(`Looking for user: ${idField} = ${user_id}`);

  
    const user = await UserModel.findOne({
      where: { [idField]: user_id },
      attributes: { exclude: ['password', 'createdAt', 'updatedAt'] }
    });

    if (!user) {
      console.log(" User not found");
      return res.status(404).json({
        message: "User not found"
      });
    }

    console.log(" User found");


    let userInfo = {
      user_id: user[idField],
      user_name: user[nameField] || 'Unknown',
      user_category: user_category
    };


    switch (user_category) {
      case 'college':
        userInfo.old_info = {
          program: user.c_program || '',
          year_block: user.c_year_block || ''
        };
        break;

      case 'senior':
        userInfo.old_info = {
          program: user.s_program || '',
          gradelevel: user.s_gradelevel || '',
          section: user.s_section || ''
        };
        break;

      case 'junior':
        userInfo.old_info = {
          program: user.j_program || '',
          section: user.j_section || ''
        };
        break;

      case 'elementary':
        userInfo.old_info = {
          section: user.e_section || ''
        };
        break;

      case 'teacher':
        userInfo.old_info = {
          teacherlevel: user.t_teacherlevel || ''
        };
        break;

      case 'instructor':
        userInfo.old_info = {
          instructorlevel: user.i_instructorlevel || ''
        };
        break;
    }

    console.log(" Returning user info");
    res.json(userInfo);

  } catch (error) {
    console.error("Get User Info Error:", error);
    res.status(500).json({
      message: "Error fetching user information",
      error: error.message
    });
  }
};


const debugUsers = async (req, res) => {
  try {
    const { category } = req.query;
    
    console.log("=== DEBUG USERS ===");
    console.log("Category:", category);
    
    const UserModel = getUserModel(category);
    if (!UserModel) {
      return res.status(400).json({
        message: "Invalid category",
        valid_categories: ['college', 'senior', 'junior', 'elementary', 'teacher', 'instructor']
      });
    }
    
    const idField = `${category.charAt(0)}_id`;
    const nameField = `${category.charAt(0)}_name`;
    
    const users = await UserModel.findAll({
      attributes: [idField, nameField],
      limit: 20,
      order: [[idField, 'ASC']]
    });
    
    console.log(`Found ${users.length} users in ${category}:`);
    users.forEach((user, i) => {
      console.log(`  ${i + 1}. ${user[idField]} - ${user[nameField]}`);
    });
    
    res.json({
      category,
      count: users.length,
      users: users.map(u => ({
        id: u[idField],
        name: u[nameField]
      }))
    });
    
  } catch (error) {
    console.error("Debug users error:", error);
    res.status(500).json({ error: error.message });
  }
};

const testRoute = (req, res) => {
  console.log(" Test route hit!");
  res.json({ 
    message: "Request routes working!",
    timestamp: new Date(),
    requestPath: req.path,
    fullUrl: req.originalUrl,
    routes_available: [
      "POST /request - Create request",
      "GET /my-requests?user_id=&user_category= - Get user requests",
      "GET /requests?status=&category= - Get all requests (admin)",
      "GET /user-info?user_id=&user_category= - Get user info for request",
      "GET /request/:category/:id - Get request details",
      "PUT /request/:category/:id - Update request status"
    ]
  });
};


module.exports = {
  createRequest,
  getMyRequests,
  getAllRequests,
  updateRequestStatus,
  getRequestDetails,
  getUserInfoForRequest,
  debugUsers,
  testRoute
};
