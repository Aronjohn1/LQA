const {
  Attendancecollege,
  Attendancesenior,
  Attendancejunior,
  Attendanceelementary,
  Attendanceteacher,
  Attendanceinstructor,
  College,
  Senior,
  Junior,
  Elementary,
  Teacher,
  Instructor
} = require("../models");


const COOLDOWN_MINUTES = 1;


const formatTime12Hour = (time24) => {
  if (!time24) return null;
  
  const [hours, minutes] = time24.split(':');
  const hour = parseInt(hours);
  const min = minutes;
  
  if (hour === 0) {
    return `12:${min} AM`;
  } else if (hour < 12) {
    return `${hour}:${min} AM`;
  } else if (hour === 12) {
    return `12:${min} PM`;
  } else {
    return `${hour - 12}:${min} PM`;
  }
};



const normalizeString = (str) => {
  return str?.toString().trim().toLowerCase() || "";
};


const isSeniorHighStrand = (value) => {
  const strands = ["stem", "humss", "abm", "gas"];
  return strands.includes(normalizeString(value));
};
const verifyQRData = async (qrData) => {
  try {
    const parts = qrData.split(" | ").map(p => p.trim());
    console.log(" QR DATA RECEIVED:", qrData);
    console.log(" PARTS:", parts);
    console.log(" Number of parts:", parts.length);
    
    const id = parts[0] || "";
    const name = parts[1] || "";
    const program = parts[2] || "";
    const yearBlock = parts[3] || ""; 
    
    console.log(` PARSED: ID="${id}", Name="${name}", Program="${program}", YearBlock/Section="${yearBlock}"`);
    



if (id.includes("-T-") || program.toLowerCase().includes("teacher")) {
  console.log(" Checking Teacher...");
  currentUser = await Teacher.findOne({ where: { t_id: id } });
  if (currentUser) {
    console.log("Found teacher:", currentUser.t_name);
    category = "teacher";
    const validName = normalizeString(currentUser.t_name) === normalizeString(name);
    const validLevel = normalizeString(currentUser.t_teacherlevel) === normalizeString(program);
    console.log(` Teacher check: name=${validName}, level=${validLevel}`);
    return { valid: validName && validLevel, category, currentUser };
  }
  console.log(" Teacher not found in database with ID:", id);
}
    

else if (id.includes("-I-") || program.toLowerCase().includes("instructor")) {
  console.log(" Checking Instructor...");
  currentUser = await Instructor.findOne({ where: { i_id: id } });
  if (currentUser) {
    console.log(" Found instructor:", currentUser.i_name);
    category = "instructor";
    const validName = normalizeString(currentUser.i_name) === normalizeString(name);
    const validLevel = normalizeString(currentUser.i_instructorlevel) === normalizeString(program);
    console.log(`🔍 Instructor check: name=${validName}, level=${validLevel}`);
    console.log(`🔍 Database level: "${currentUser.i_instructorlevel}", QR level: "${program}"`);
    return { valid: validName && validLevel, category, currentUser };
  }
  console.log(" Instructor not found in database with ID:", id);
}
    
  
    else if (["1","2","3","4","5","6"].includes(program)) {
      currentUser = await Elementary.findOne({ where: { e_id: id } });
      if (currentUser) {
        category = "elementary";
        const validName = normalizeString(currentUser.e_name) === normalizeString(name);
        const validProgram = normalizeString(currentUser.e_program) === normalizeString(program);
        
       
        const qrSection = normalizeString(yearBlock);
        const dbSection = normalizeString(currentUser.e_section);
        
        const isValidSection = dbSection === qrSection;
        
        console.log(`Elementary verification: name=${validName}, grade=${validProgram}, section=${isValidSection}`);
        return { valid: validName && validProgram && isValidSection, category, currentUser };
      }
    }
    
 
    else if (["7","8","9","10"].includes(program)) {
      currentUser = await Junior.findOne({ where: { j_id: id } });
      if (currentUser) {
        category = "juniorHigh";
        const validName = normalizeString(currentUser.j_name) === normalizeString(name);
        const validProgram = normalizeString(currentUser.j_program) === normalizeString(program);
        
       
        const qrSection = normalizeString(yearBlock);
        const dbSection = normalizeString(currentUser.j_section);
        
        const validSection = dbSection === qrSection;
        
        console.log(`Junior High verification: name=${validName}, grade=${validProgram}, section=${validSection}`);
        return { valid: validName && validProgram && validSection, category, currentUser };
      }
    }
    
    

else if (isSeniorHighStrand(program)) {
  console.log(" Checking Senior High...");
  console.log("Program detected as Senior High strand:", program);
  currentUser = await Senior.findOne({ where: { s_id: id } });
  if (currentUser) {
    console.log("Found senior high student:", currentUser.s_name);
    category = "seniorHigh";
    const validName = normalizeString(currentUser.s_name) === normalizeString(name);
    const validProgram = normalizeString(currentUser.s_program) === normalizeString(program);
    


    const [qrGrade, qrSection] = yearBlock.split('-');
    const dbGrade = normalizeString(currentUser.s_gradelevel);
    const dbSection = normalizeString(currentUser.s_section);
    
    console.log(` QR Grade-Section: "${yearBlock}" -> Grade: "${qrGrade}", Section: "${qrSection}"`);
    console.log(` DB Grade: "${dbGrade}", DB Section: "${dbSection}"`);
    
    const validGrade = dbGrade === normalizeString(qrGrade || '');
    const validSection = dbSection === normalizeString(qrSection || '');
    
    console.log(`Senior High check: name=${validName}, strand=${validProgram}, grade=${validGrade}, section=${validSection}`);
    return { valid: validName && validProgram && validGrade && validSection, category, currentUser };
  }
  console.log("Senior High student not found in database with ID:", id);
}
    
 
    else if (id.includes("-G-")) {
      currentUser = await College.findOne({ where: { c_id: id } });
      if (currentUser) {
        category = "college";
        const validName = normalizeString(currentUser.c_name) === normalizeString(name);
        const validProgram = normalizeString(currentUser.c_program) === normalizeString(program);
        

        const qrYearBlock = normalizeString(yearBlock);
        const dbYearBlock = normalizeString(currentUser.c_year_block);
        
        const validYearBlock = dbYearBlock === qrYearBlock;
        
        console.log(`College verification: name=${validName}, program=${validProgram}, year-block=${validYearBlock}`);
        return { valid: validName && validProgram && validYearBlock, category, currentUser };
      }
    } 

    console.log("No matching category found");
    return { valid: false, category: null, currentUser: null };
  } catch (err) {
    console.error("verifyQRData error:", err);
    return { valid: false, category: null, currentUser: null };
  }
};


const recordAttendance = async (req, res) => {
  try {
    const { qrData } = req.body;
    if (!qrData) return res.status(400).json({ message: "QR data is required" });

    const verification = await verifyQRData(qrData);


    if (verification.currentUser && !verification.valid) {
      return res.status(400).json({ 
        message: "Your information has been updated! Please download your new QR code from your profile.",
        outdated: true
      });
    }
    

    if (!verification.currentUser || !verification.category) {
      return res.status(400).json({ message: "User not found or QR data is invalid." });
    }
    
    const { category } = verification;
    
    const parts = qrData.split(" | ").map(p => p.trim());
    const id = parts[0] || "";
    const name = parts[1] || "";
    const program = parts[2] || "";
    const yearBlock = parts[3] || "";
    const today = new Date().toISOString().split("T")[0];
    const now = new Date();

 
    let attendanceModel, recordData;
    
    switch (category) {
      case "teacher":
        attendanceModel = Attendanceteacher;
        recordData = { at_id: id, at_name: name, at_teacherlevel: program, at_date: today };
        break;
      case "instructor":
        attendanceModel = Attendanceinstructor;
        recordData = { ai_id: id, ai_name: name, ai_instructorlevel: program, ai_date: today };
        break;
      case "elementary":
        attendanceModel = Attendanceelementary;
        recordData = { ae_id: id, ae_name: name, ae_program: program, ae_section: yearBlock, ae_date: today };
        break;
      case "juniorHigh":
        attendanceModel = Attendancejunior;
        recordData = { aj_id: id, aj_name: name, aj_program: program, aj_section: yearBlock, aj_date: today };
        break;
      case "seniorHigh":
        attendanceModel = Attendancesenior;
        recordData = { as_id: id, as_name: name, as_program: program, as_gradelevel: yearBlock, as_date: today };
        break;
      case "college":
        attendanceModel = Attendancecollege;
        recordData = { ac_id: id, ac_name: name, ac_program: program, ac_year_block: yearBlock, ac_date: today };
        break;
      default:
        return res.status(400).json({ message: "Could not determine user category." });
    }

    // Dynamically determine field names for Time-In/Time-Out based on the model keys
    const idFieldPrefix = Object.keys(recordData)[0].slice(0,2);
    const timeInField = `${idFieldPrefix}_timein`;
    const timeOutField = `${idFieldPrefix}_timeout`;
    const dateField = `${idFieldPrefix}_date`;
    const idField = `${idFieldPrefix}_id`;

    const lastRecord = await attendanceModel.findOne({
      where: { [idField]: id, [dateField]: today },
      order: [["createdAt", "DESC"]]
    });

   
    const time24 = now.toLocaleTimeString("en-GB", { hour12: false });
    
    if (lastRecord) {
  
      const lastTimeIn = lastRecord[timeInField];
      const lastTimeOut = lastRecord[timeOutField];
      
      if (lastTimeIn && !lastTimeOut) {
    
        
   
        const [hours, minutes, seconds] = lastTimeIn.split(':').map(Number);
        const lastTimeInDate = new Date();
        lastTimeInDate.setHours(hours, minutes, seconds, 0);
        
        const diffMinutes = (now - lastTimeInDate) / 1000 / 60;
        
        if (diffMinutes < COOLDOWN_MINUTES) {
          return res.status(400).json({
            message: `Please wait ${Math.ceil(COOLDOWN_MINUTES - diffMinutes)} minute(s) before Time-Out.`,
            cooldown: true
          });
        }

 
        lastRecord[timeOutField] = time24;
        await lastRecord.save();

        return res.json({
          message: "Time-Out recorded successfully",
          type: "timeout",
          data: lastRecord
        });
      }

      if (lastTimeOut) {
  
        

        const [hours, minutes, seconds] = lastTimeOut.split(':').map(Number);
        const lastTimeOutDate = new Date();
        lastTimeOutDate.setHours(hours, minutes, seconds, 0);
        
        const diffMinutes = (now - lastTimeOutDate) / 1000 / 60;
        
        if (diffMinutes < COOLDOWN_MINUTES) {
          return res.status(400).json({
            message: `⏳ Please wait ${Math.ceil(COOLDOWN_MINUTES - diffMinutes)} minute(s) before Time-In again.`,
            cooldown: true
          });
        }
      }
    }

   
    recordData[timeInField] = time24;
    const newRecord = await attendanceModel.create(recordData);

    return res.json({
      message: "Time-In recorded successfully",
      type: "timein",
      data: newRecord
    });

  } catch (err) {
    console.error("ATTENDANCE ERROR:", err);
    return res.status(500).json({ message: "Error recording attendance", error: err.message });
  }
};


const getTodayStats = async (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];
    const [studentCount, teacherCount, instructorCount] = await Promise.all([
      Promise.all([
        Attendancecollege.count({ where: { ac_date: today } }),
        Attendancesenior.count({ where: { as_date: today } }),
        Attendancejunior.count({ where: { aj_date: today } }),
        Attendanceelementary.count({ where: { ae_date: today } })
      ]).then(counts => counts.reduce((a,b)=>a+b,0)),
      Attendanceteacher.count({ where: { at_date: today } }),
      Attendanceinstructor.count({ where: { ai_date: today } })
    ]);

    const totalCount = studentCount + teacherCount + instructorCount;
    return res.json({ 
      students: studentCount, 
      teachers: teacherCount, 
      instructors: instructorCount, 
      total: totalCount, 
      date: today 
    });
  } catch (err) {
    console.error("STATS ERROR:", err);
    return res.status(500).json({ message: "Error fetching stats", error: err.message });
  }
};



const getTodayAttendance = async (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];
    const [
      collegeRecords,
      seniorRecords,
      juniorRecords,
      elementaryRecords,
      teacherRecords,
      instructorRecords
    ] = await Promise.all([
      Attendancecollege.findAll({ where: { ac_date: today } }),
      Attendancesenior.findAll({ where: { as_date: today } }),
      Attendancejunior.findAll({ where: { aj_date: today } }),
      Attendanceelementary.findAll({ where: { ae_date: today } }),
      Attendanceteacher.findAll({ where: { at_date: today } }),
      Attendanceinstructor.findAll({ where: { ai_date: today } })
    ]);

    const normalizedRecords = [
      ...collegeRecords.map(r => ({
        id: r.ac_id,
        name: r.ac_name,
        program: r.ac_program, 
        yearBlock: r.ac_year_block,
        timeIn: formatTime12Hour(r.ac_timein),
        timeOut: formatTime12Hour(r.ac_timeout),
        category: "college"
      })),
      ...seniorRecords.map(r => ({
        id: r.as_id,
        name: r.as_name,
        program: r.as_program,
        yearBlock: r.as_gradelevel,
        timeIn: formatTime12Hour(r.as_timein),
        timeOut: formatTime12Hour(r.as_timeout),
        category: "senior"
      })),
      ...juniorRecords.map(r => ({
        id: r.aj_id,
        name: r.aj_name,
        program: r.aj_program,
        yearBlock: r.aj_section,
        timeIn: formatTime12Hour(r.aj_timein),
        timeOut: formatTime12Hour(r.aj_timeout),
        category: "junior"
      })),
      ...elementaryRecords.map(r => ({
        id: r.ae_id,
        name: r.ae_name,
        program: r.ae_program,
        yearBlock: r.ae_section,
        timeIn: formatTime12Hour(r.ae_timein),
        timeOut: formatTime12Hour(r.ae_timeout),
        category: "elementary"
      })),
      ...teacherRecords.map(r => ({
        id: r.at_id,
        name: r.at_name,
        program: r.at_teacherlevel,
        yearBlock: null,
        timeIn: formatTime12Hour(r.at_timein),
        timeOut: formatTime12Hour(r.at_timeout),
        category: "teacher"
      })),
      ...instructorRecords.map(r => ({
        id: r.ai_id,
        name: r.ai_name,
        program: r.ai_instructorlevel,
        yearBlock: null,
        timeIn: formatTime12Hour(r.ai_timein),
        timeOut: formatTime12Hour(r.ai_timeout),
        category: "instructor"
      }))
    ];

    return res.json(normalizedRecords);
  } catch (err) {
    console.error("GET ATTENDANCE ERROR:", err);
    return res.status(500).json({ message: "Error fetching attendance", error: err.message });
  }
};


const getRecentScans = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const today = new Date().toISOString().split("T")[0];

    const [
      collegeRecords,
      seniorRecords,
      juniorRecords,
      elementaryRecords,
      teacherRecords,
      instructorRecords
    ] = await Promise.all([
      Attendancecollege.findAll({ where: { ac_date: today }, order: [["createdAt", "DESC"]], limit }),
      Attendancesenior.findAll({ where: { as_date: today }, order: [["createdAt", "DESC"]], limit }),
      Attendancejunior.findAll({ where: { aj_date: today }, order: [["createdAt", "DESC"]], limit }),
      Attendanceelementary.findAll({ where: { ae_date: today }, order: [["createdAt", "DESC"]], limit }),
      Attendanceteacher.findAll({ where: { at_date: today }, order: [["createdAt", "DESC"]], limit }),
      Attendanceinstructor.findAll({ where: { ai_date: today }, order: [["createdAt", "DESC"]], limit })
    ]);

    const normalizedRecords = [
      ...collegeRecords.map(r => ({
        id: r.ac_id,
        name: r.ac_name,
        timeIn: formatTime12Hour(r.ac_timein),
        timeOut: formatTime12Hour(r.ac_timeout),
        timestamp: r.createdAt
      })),
      ...seniorRecords.map(r => ({
        id: r.as_id,
        name: r.as_name,
        timeIn: formatTime12Hour(r.as_timein),
        timeOut: formatTime12Hour(r.as_timeout),
        timestamp: r.createdAt
      })),
      ...juniorRecords.map(r => ({
        id: r.aj_id,
        name: r.aj_name,
        timeIn: formatTime12Hour(r.aj_timein),
        timeOut: formatTime12Hour(r.aj_timeout),
        timestamp: r.createdAt
      })),
      ...elementaryRecords.map(r => ({
        id: r.ae_id,
        name: r.ae_name,
        timeIn: formatTime12Hour(r.ae_timein),
        timeOut: formatTime12Hour(r.ae_timeout),
        timestamp: r.createdAt
      })),
      ...teacherRecords.map(r => ({
        id: r.at_id,
        name: r.at_name,
        timeIn: formatTime12Hour(r.at_timein),
        timeOut: formatTime12Hour(r.at_timeout),
        timestamp: r.createdAt
      })),
      ...instructorRecords.map(r => ({
        id: r.ai_id,
        name: r.ai_name,
        timeIn: formatTime12Hour(r.ai_timein),
        timeOut: formatTime12Hour(r.ai_timeout),
        timestamp: r.createdAt
      }))
    ];

    normalizedRecords.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    return res.json(normalizedRecords.slice(0, limit));
  } catch (err) {
    console.error("GET RECENT SCANS ERROR:", err);
    return res.status(500).json({ message: "Error fetching recent scans", error: err.message });
  }
};


const getAttendanceTrend = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const trendData = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];

      const [college, senior, junior, elementary, teacher, instructor] = await Promise.all([
        Attendancecollege.count({ where: { ac_date: dateStr } }),
        Attendancesenior.count({ where: { as_date: dateStr } }),
        Attendancejunior.count({ where: { aj_date: dateStr } }),
        Attendanceelementary.count({ where: { ae_date: dateStr } }),
        Attendanceteacher.count({ where: { at_date: dateStr } }),
        Attendanceinstructor.count({ where: { ai_date: dateStr } })
      ]);

      trendData.push({
        date: date.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' }),
        count: college + senior + junior + elementary + teacher + instructor
      });
    }

    return res.json(trendData);
  } catch (err) {
    console.error("GET TREND ERROR:", err);
    return res.status(500).json({ message: "Error fetching trend", error: err.message });
  }
};


const getTimeInTimeOutStats = async (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];
    const { Op } = require("../models");

    const [studentTimeIn, teacherTimeIn, instructorTimeIn] = await Promise.all([
      Promise.all([
        Attendancecollege.count({ where: { ac_date: today, ac_timein: { [Op.ne]: null } } }),
        Attendancesenior.count({ where: { as_date: today, as_timein: { [Op.ne]: null } } }),
        Attendancejunior.count({ where: { aj_date: today, aj_timein: { [Op.ne]: null } } }),
        Attendanceelementary.count({ where: { ae_date: today, ae_timein: { [Op.ne]: null } } })
      ]).then(counts => counts.reduce((a,b) => a+b, 0)),
      Attendanceteacher.count({ where: { at_date: today, at_timein: { [Op.ne]: null } } }),
      Attendanceinstructor.count({ where: { ai_date: today, ai_timein: { [Op.ne]: null } } })
    ]);

    const [studentTimeOut, teacherTimeOut, instructorTimeOut] = await Promise.all([
      Promise.all([
        Attendancecollege.count({ where: { ac_date: today, ac_timeout: { [Op.ne]: null } } }),
        Attendancesenior.count({ where: { as_date: today, as_timeout: { [Op.ne]: null } } }),
        Attendancejunior.count({ where: { aj_date: today, aj_timeout: { [Op.ne]: null } } }),
        Attendanceelementary.count({ where: { ae_date: today, ae_timeout: { [Op.ne]: null } } })
      ]).then(counts => counts.reduce((a,b) => a+b, 0)),
      Attendanceteacher.count({ where: { at_date: today, at_timeout: { [Op.ne]: null } } }),
      Attendanceinstructor.count({ where: { ai_date: today, ai_timeout: { [Op.ne]: null } } })
    ]);

    return res.json({
      timeIn: {
        students: studentTimeIn,
        teachers: teacherTimeIn,
        instructors: instructorTimeIn
      },
      timeOut: {
        students: studentTimeOut,
        teachers: teacherTimeOut,
        instructors: instructorTimeOut
      }
    });
  } catch (err) {
    console.error("GET TIMEIN/TIMEOUT STATS ERROR:", err);
    return res.status(500).json({ message: "Error fetching stats", error: err.message });
  }
};


const getTodayHourlyActivity = async (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];

    const [
      collegeRecords,
      seniorRecords,
      juniorRecords,
      elementaryRecords,
      teacherRecords,
      instructorRecords
    ] = await Promise.all([
      Attendancecollege.findAll({ where: { ac_date: today } }),
      Attendancesenior.findAll({ where: { as_date: today } }),
      Attendancejunior.findAll({ where: { aj_date: today } }),
      Attendanceelementary.findAll({ where: { ae_date: today } }),
      Attendanceteacher.findAll({ where: { at_date: today } }),
      Attendanceinstructor.findAll({ where: { ai_date: today } })
    ]);

    const allRecords = [
      ...collegeRecords.map(r => r.ac_timein),
      ...seniorRecords.map(r => r.as_timein),
      ...juniorRecords.map(r => r.aj_timein),
      ...elementaryRecords.map(r => r.ae_timein),
      ...teacherRecords.map(r => r.at_timein),
      ...instructorRecords.map(r => r.ai_timein)
    ].filter(Boolean);

    const hourlyData = [];
    for (let hour = 7; hour <= 19; hour++) {
      const count = allRecords.filter(time => {
        const timeHour = parseInt(time.split(':')[0]);
        return timeHour === hour;
      }).length;

      hourlyData.push({
        hour: `${hour > 12 ? hour - 12 : hour}${hour >= 12 ? 'PM' : 'AM'}`,
        count
      });
    }

    return res.json(hourlyData);
  } catch (err) {
    console.error("GET HOURLY ACTIVITY ERROR:", err);
    return res.status(500).json({ message: "Error fetching hourly activity", error: err.message });
  }
};


const getAttendanceRecords = async (req, res) => {
  try {
    const { date } = req.query;
    const targetDate = date || new Date().toISOString().split("T")[0];

    const [
      collegeRecords,
      seniorRecords,
      juniorRecords,
      elementaryRecords,
      teacherRecords,
      instructorRecords
    ] = await Promise.all([
      Attendancecollege.findAll({ where: { ac_date: targetDate } }),
      Attendancesenior.findAll({ where: { as_date: targetDate } }),
      Attendancejunior.findAll({ where: { aj_date: targetDate } }),
      Attendanceelementary.findAll({ where: { ae_date: targetDate } }),
      Attendanceteacher.findAll({ where: { at_date: targetDate } }),
      Attendanceinstructor.findAll({ where: { ai_date: targetDate } })
    ]);

    const normalizedRecords = [
      ...collegeRecords.map(r => ({
        id: r.ac_id,
        name: r.ac_name,
        program: r.ac_program,
        yearBlock: r.ac_year_block,
        timeIn: formatTime12Hour(r.ac_timein),
        timeOut: formatTime12Hour(r.ac_timeout),
        date: r.ac_date,
        category: "college"
      })),
      ...seniorRecords.map(r => ({
        id: r.as_id,
        name: r.as_name,
        program: r.as_program,
        yearBlock: r.as_gradelevel,
        section: r.as_section,
        timeIn: formatTime12Hour(r.as_timein),
        timeOut: formatTime12Hour(r.as_timeout),
        date: r.as_date,
        category: "senior"
      })),
      ...juniorRecords.map(r => ({
        id: r.aj_id,
        name: r.aj_name,
        program: r.aj_program,
        yearBlock: r.aj_section,
        timeIn: formatTime12Hour(r.aj_timein),
        timeOut: formatTime12Hour(r.aj_timeout),
        date: r.aj_date,
        category: "junior"
      })),
      ...elementaryRecords.map(r => ({
        id: r.ae_id,
        name: r.ae_name,
        program: r.ae_program,
        yearBlock: r.ae_section,
        timeIn: formatTime12Hour(r.ae_timein),
        timeOut: formatTime12Hour(r.ae_timeout),
        date: r.ae_date,
        category: "elementary"
      })),
      ...teacherRecords.map(r => ({
        id: r.at_id,
        name: r.at_name,
        program: r.at_teacherlevel,
        yearBlock: null,
        timeIn: formatTime12Hour(r.at_timein),
        timeOut: formatTime12Hour(r.at_timeout),
        date: r.at_date,
        category: "teacher"
      })),
      ...instructorRecords.map(r => ({
        id: r.ai_id,
        name: r.ai_name,
        program: r.ai_instructorlevel,
        yearBlock: null,
        timeIn: formatTime12Hour(r.ai_timein),
        timeOut: formatTime12Hour(r.ai_timeout),
        date: r.ai_date,
        category: "instructor"
      }))
    ];

    return res.json(normalizedRecords);
  } catch (err) {
    console.error("GET RECORDS ERROR:", err);
    return res.status(500).json({
      message: "Error fetching attendance records",
      error: err.message,
    });
  }
};




const getWeekStats = async (req, res) => {
  try {
    const today = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 6); 
    
    const { Op } = require("../models");
    
    const startDate = sevenDaysAgo.toISOString().split("T")[0];
    const endDate = today.toISOString().split("T")[0];
    
    const [studentCount, teacherCount, instructorCount] = await Promise.all([
      Promise.all([
        Attendancecollege.count({ 
          where: { 
            ac_date: { [Op.between]: [startDate, endDate] } 
          } 
        }),
        Attendancesenior.count({ 
          where: { 
            as_date: { [Op.between]: [startDate, endDate] } 
          } 
        }),
        Attendancejunior.count({ 
          where: { 
            aj_date: { [Op.between]: [startDate, endDate] } 
          } 
        }),
        Attendanceelementary.count({ 
          where: { 
            ae_date: { [Op.between]: [startDate, endDate] } 
          } 
        })
      ]).then(counts => counts.reduce((a,b)=>a+b,0)),
      Attendanceteacher.count({ 
        where: { 
          at_date: { [Op.between]: [startDate, endDate] } 
        } 
      }),
      Attendanceinstructor.count({ 
        where: { 
          ai_date: { [Op.between]: [startDate, endDate] } 
        } 
      })
    ]);

    const totalCount = studentCount + teacherCount + instructorCount;
    return res.json({ 
      students: studentCount, 
      teachers: teacherCount, 
      instructors: instructorCount, 
      total: totalCount,
      period: 'week',
      startDate,
      endDate
    });
  } catch (err) {
    console.error("WEEK STATS ERROR:", err);
    return res.status(500).json({ message: "Error fetching week stats", error: err.message });
  }
};


const getMonthStats = async (req, res) => {
  try {
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 29); 
    
    const { Op } = require("../models");
    
    const startDate = thirtyDaysAgo.toISOString().split("T")[0];
    const endDate = today.toISOString().split("T")[0];
    
    const [studentCount, teacherCount, instructorCount] = await Promise.all([
      Promise.all([
        Attendancecollege.count({ 
          where: { 
            ac_date: { [Op.between]: [startDate, endDate] } 
          } 
        }),
        Attendancesenior.count({ 
          where: { 
            as_date: { [Op.between]: [startDate, endDate] } 
          } 
        }),
        Attendancejunior.count({ 
          where: { 
            aj_date: { [Op.between]: [startDate, endDate] } 
          } 
        }),
        Attendanceelementary.count({ 
          where: { 
            ae_date: { [Op.between]: [startDate, endDate] } 
          } 
        })
      ]).then(counts => counts.reduce((a,b)=>a+b,0)),
      Attendanceteacher.count({ 
        where: { 
          at_date: { [Op.between]: [startDate, endDate] } 
        } 
      }),
      Attendanceinstructor.count({ 
        where: { 
          ai_date: { [Op.between]: [startDate, endDate] } 
        } 
      })
    ]);

    const totalCount = studentCount + teacherCount + instructorCount;
    return res.json({ 
      students: studentCount, 
      teachers: teacherCount, 
      instructors: instructorCount, 
      total: totalCount,
      period: 'month',
      startDate,
      endDate
    });
  } catch (err) {
    console.error("MONTH STATS ERROR:", err);
    return res.status(500).json({ message: "Error fetching month stats", error: err.message });
  }
};







const getMyAttendanceHistory = async (req, res) => {
  try {
    const { userId, date } = req.query;

    console.log("\n------------------------------");
    console.log("STUDENT ATTENDANCE HISTORY REQUEST");
    console.log("----------------------------------");
    console.log("Student userId:", userId);
    console.log("date:", date);
    console.log("----------------------------------------\n");

    // Validation
    if (!userId || userId === 'undefined' || userId === 'null' || userId.trim() === '') {
      console.log(" ERROR: Missing student ID");
      return res.status(400).json({ 
        message: "Student ID is required",
        data: [] 
      });
    }

    const cleanUserId = userId.trim();
    
    console.log("🔍 ID Analysis:");
    console.log("ID Pattern:", cleanUserId);
    

    console.log("\n Step 1: Checking student/teacher tables...");
    
    let userCategory = null;
    let userData = null;
    

    if (cleanUserId.includes("-T-")) {
      const teacher = await Teacher.findOne({ where: { t_id: cleanUserId } });
      if (teacher) {
        userCategory = "teacher";
        userData = teacher;
        console.log("Found in Teacher table");
      }
    } 
    else if (cleanUserId.includes("-I-")) {
      const instructor = await Instructor.findOne({ where: { i_id: cleanUserId } });
      if (instructor) {
        userCategory = "instructor";
        userData = instructor;
        console.log("Found in Instructor table");
      }
    }
    else if (cleanUserId.includes("-E-")) {
      const elementary = await Elementary.findOne({ where: { e_id: cleanUserId } });
      if (elementary) {
        userCategory = "elementary";
        userData = elementary;
        console.log("Found in Elementary table");
      }
    }
    else if (cleanUserId.includes("-J-")) {
      const junior = await Junior.findOne({ where: { j_id: cleanUserId } });
      if (junior) {
        userCategory = "junior";
        userData = junior;
        console.log(" Found in Junior table");
      }
    }
    else if (cleanUserId.includes("-S-")) {
      const senior = await Senior.findOne({ where: { s_id: cleanUserId } });
      if (senior) {
        userCategory = "senior";
        userData = senior;
        console.log(" Found in Senior table");
      }
    }
    else if (cleanUserId.includes("-G-")) {
      const college = await College.findOne({ where: { c_id: cleanUserId } });
      if (college) {
        userCategory = "college";
        userData = college;
        console.log(" Found in College table");
      }
    }
    else {
   
      console.log("Unknown ID pattern, checking all tables...");
      
      const [college, senior, junior, elementary, teacher, instructor] = await Promise.all([
        College.findOne({ where: { c_id: cleanUserId } }),
        Senior.findOne({ where: { s_id: cleanUserId } }),
        Junior.findOne({ where: { j_id: cleanUserId } }),
        Elementary.findOne({ where: { e_id: cleanUserId } }),
        Teacher.findOne({ where: { t_id: cleanUserId } }),
        Instructor.findOne({ where: { i_id: cleanUserId } })
      ]);
      
      if (college) {
        userCategory = "college";
        userData = college;
        console.log("Found in College table");
      } else if (senior) {
        userCategory = "senior";
        userData = senior;
        console.log(" Found in Senior table");
      } else if (junior) {
        userCategory = "junior";
        userData = junior;
        console.log(" Found in Junior table");
      } else if (elementary) {
        userCategory = "elementary";
        userData = elementary;
        console.log(" Found in Elementary table");
      } else if (teacher) {
        userCategory = "teacher";
        userData = teacher;
        console.log("Found in Teacher table");
      } else if (instructor) {
        userCategory = "instructor";
        userData = instructor;
        console.log(" Found in Instructor table");
      }
    }

 
    if (!userCategory || !userData) {
      console.log(" Student/Teacher NOT found in any table");
      return res.status(404).json({ 
        message: "User not found in student/teacher database",
        searchedId: cleanUserId,
        data: [] 
      });
    }

    console.log(`\n User found: ${userData.name || userData.c_name || userData.s_name || userData.j_name || userData.e_name || userData.t_name || userData.i_name || 'Unknown'} (${userCategory})`);


    let attendanceModel, idField, nameField, dateField, timeInField, timeOutField;

    switch(userCategory) {
      case "college":
        attendanceModel = Attendancecollege;
        idField = "ac_id";       
        nameField = "ac_name";   
        dateField = "ac_date";      
        timeInField = "ac_timein";  
        timeOutField = "ac_timeout"; 
        break;
        
      case "senior":
        attendanceModel = Attendancesenior;
        idField = "as_id";         
        nameField = "as_name";     
        dateField = "as_date";    
        timeInField = "as_timein";
        timeOutField = "as_timeout"; 
        break;
        
      case "junior":
        attendanceModel = Attendancejunior;
        idField = "aj_id";         
        nameField = "aj_name";     
        dateField = "aj_date";     
        timeInField = "aj_timein";  
        timeOutField = "aj_timeout"; 
        break;
        
      case "elementary":
        attendanceModel = Attendanceelementary;
        idField = "ae_id";         
        nameField = "ae_name";      
        dateField = "ae_date";      
        timeInField = "ae_timein";  
        timeOutField = "ae_timeout"; 
        break;
        
      case "teacher":
        attendanceModel = Attendanceteacher;
        idField = "at_id";         
        nameField = "at_name";     
        dateField = "at_date";      
        timeInField = "at_timein";  
        timeOutField = "at_timeout"; 
        break;
        
      case "instructor":
        attendanceModel = Attendanceinstructor;
        idField = "ai_id";        
        nameField = "ai_name";      
        dateField = "ai_date";      
        timeInField = "ai_timein";  
        timeOutField = "ai_timeout"; 
        break;
        
      default:
        console.log(" Invalid user category");
        return res.status(400).json({ 
          message: "Invalid user category",
          data: [] 
        });
    }


    const whereClause = { [idField]: cleanUserId };
    if (date && date !== 'undefined' && date !== 'null' && date.trim() !== '') {
      whereClause[dateField] = date.trim();
      console.log(`Filtering by date: ${date}`);
    } else {
      console.log("No date filter, getting all records");
    }

    console.log("\n Database Query:");
    console.log("Model:", attendanceModel.name);
    console.log("Where:", JSON.stringify(whereClause, null, 2));


    const records = await attendanceModel.findAll({
      where: whereClause,
      order: [[dateField, "DESC"]],
      limit: 100
    });

    console.log(`\n Found ${records.length} attendance record(s)`);

    
    const formattedRecords = records.map(record => {
      const recordData = record.dataValues;
      
      // Get name from record or user data
      const userName = recordData[nameField] || 
                      userData.name || 
                      userData.c_name || 
                      userData.s_name || 
                      userData.j_name || 
                      userData.e_name || 
                      userData.t_name || 
                      userData.i_name || 
                      "Unknown";
      
    
      const response = {
        Date: recordData[dateField],
        ID: recordData[idField],
        Name: userName,
        "Time In": formatTime12Hour(recordData[timeInField]),
        "Time Out": formatTime12Hour(recordData[timeOutField]),
        Status: recordData[timeOutField] ? "Completed" : "Time-In Only",
        category: userCategory
      };

      return response;
    });

   
    console.log("\n Sending response with", formattedRecords.length, "record(s)");
    
    if (formattedRecords.length === 0) {
      console.log(" No attendance records found");
      return res.json([]);
    } else {
      console.log(" Sample record:", JSON.stringify(formattedRecords[0], null, 2));
    }
    
    console.log("----------------------------\n");

    return res.json(formattedRecords);

  } catch (err) {
    console.error("\nATTENDANCE HISTORY ERROR");
    console.error("Message:", err.message);
    console.error("Stack:", err.stack);
    console.error("----------------------------------------\n");
    
    return res.status(500).json({ 
      message: "Error fetching attendance history",
      error: err.message,
      data: [] 
    });
  }
};


const importAttendance = async (req, res) => {
  try {
    const { records } = req.body; 

    console.log(`Importing ${records?.length || 0} records (No template required)`);

    if (!Array.isArray(records) || records.length === 0) {
      return res.status(400).json({
        message: "Excel file is empty or no records provided"
      });
    }

    
    const parseTime = (raw) => {
      if (!raw || raw === "" || raw === "-") return null;
      
      try {
        let timeStr = raw.toString().trim().toUpperCase();
        console.log(`⏰ Parsing: "${raw}" -> "${timeStr}"`);
        
    
        let match = timeStr.match(/^(\d{1,2})[:.]?(\d{2})\s*(AM|PM)$/);
        if (match) {
          let [_, hour, minute, period] = match;
          hour = parseInt(hour);
          if (period === 'PM' && hour < 12) hour += 12;
          if (period === 'AM' && hour === 12) hour = 0;
          return `${hour.toString().padStart(2, '0')}:${minute}:00`;
        }
        
  
        match = timeStr.match(/^(\d{1,2})?(\d{2})\s*(AM|PM)$/);
        if (match) {
          let [_, hourPart, minute, period] = match;
          let hour = hourPart ? parseInt(hourPart) : parseInt(timeStr.substring(0, 1));
          if (period === 'PM' && hour < 12) hour += 12;
          if (period === 'AM' && hour === 12) hour = 0;
          return `${hour.toString().padStart(2, '0')}:${minute}:00`;
        }
        
       
        match = timeStr.match(/^(\d{1,2})[:.]?(\d{2})$/);
        if (match) {
          let [_, hour, minute] = match;
          hour = hour.padStart(2, '0');
          return `${hour}:${minute}:00`;
        }
        
       
        if (/^\d{3,4}$/.test(timeStr)) {
          let hour, minute;
          if (timeStr.length === 3) {
            hour = timeStr.substring(0, 1);
            minute = timeStr.substring(1);
          } else {
            hour = timeStr.substring(0, 2);
            minute = timeStr.substring(2);
          }
          
          hour = parseInt(hour);
   
          if (hour >= 13 && hour <= 23) {
            return `${hour.toString().padStart(2, '0')}:${minute}:00`;
          }
      
          return `${hour.toString().padStart(2, '0')}:${minute}:00`;
        }
        
        console.log(` Could not parse time: "${raw}"`);
        return null;
      } catch (err) {
        console.error('Time parse error:', err);
        return null;
      }
    };

    const today = new Date().toISOString().split('T')[0];
    let success = 0;
    let errors = 0;
    const errorList = [];
    const successList = [];
    
    const categoryResults = {
      college: { success: 0, errors: 0 },
      senior: { success: 0, errors: 0 },
      junior: { success: 0, errors: 0 },
      elementary: { success: 0, errors: 0 },
      teacher: { success: 0, errors: 0 },
      instructor: { success: 0, errors: 0 }
    };


    for (const [index, rec] of records.entries()) {
      let category = null;
      let recordData = {};
      
      try {
        console.log(`\n Processing row ${index + 1}:`, rec);

        if (!rec.id || rec.id.toString().trim() === "") {
          throw new Error("Missing ID");
        }
        
        if (!rec.name || rec.name.toString().trim() === "") {
          throw new Error("Missing Name");
        }
        
        if (!rec.timeIn || rec.timeIn.toString().trim() === "") {
          throw new Error("Missing Time-In");
        }
        
        const cleanId = rec.id.toString().trim();
        const cleanName = rec.name.toString().trim();
        

        const idUpper = cleanId.toUpperCase();
        
  
        const [collegeUser, seniorUser, juniorUser, elemUser, teacherUser, instructorUser] = await Promise.all([
          College.findOne({ where: { c_id: cleanId } }),
          Senior.findOne({ where: { s_id: cleanId } }),
          Junior.findOne({ where: { j_id: cleanId } }),
          Elementary.findOne({ where: { e_id: cleanId } }),
          Teacher.findOne({ where: { t_id: cleanId } }),
          Instructor.findOne({ where: { i_id: cleanId } })
        ]);
        
 
        if (collegeUser) {
          category = "college";
          console.log(` Found in College table: ${collegeUser.c_name}`);
        } else if (seniorUser) {
          category = "senior";
          console.log(` Found in Senior table: ${seniorUser.s_name}`);
        } else if (juniorUser) {
          category = "junior";
          console.log(`Found in Junior table: ${juniorUser.j_name}`);
        } else if (elemUser) {
          category = "elementary";
          console.log(`Found in Elementary table: ${elemUser.e_name}`);
        } else if (teacherUser) {
          category = "teacher";
          console.log(`Found in Teacher table: ${teacherUser.t_name}`);
        } else if (instructorUser) {
          category = "instructor";
          console.log(`Found in Instructor table: ${instructorUser.i_name}`);
        } else {
       
          throw new Error(`User ID "${cleanId}" not found in any database table`);
        }
        
      
        const timeIn = parseTime(rec.timeIn);
        const timeOut = rec.timeOut ? parseTime(rec.timeOut) : null;
        
        if (!timeIn) {
          throw new Error(`Invalid Time-In format: "${rec.timeIn}"`);
        }
        
   
        let attendanceModel, mainModel, fields;
        
        switch(category) {
          case "college":
            attendanceModel = Attendancecollege;
            mainModel = collegeUser;
            fields = {
              id: "ac_id",
              name: "ac_name",
              program: "ac_program",
              yearBlock: "ac_year_block",
              date: "ac_date",
              timeIn: "ac_timein",
              timeOut: "ac_timeout"
            };
            break;
            
          case "senior":
            attendanceModel = Attendancesenior;
            mainModel = seniorUser;
            fields = {
              id: "as_id",
              name: "as_name",
              program: "as_program",
              gradeLevel: "as_gradelevel",
              section: "as_section",
              date: "as_date",
              timeIn: "as_timein",
              timeOut: "as_timeout"
            };
            break;
            
          case "junior":
            attendanceModel = Attendancejunior;
            mainModel = juniorUser;
            fields = {
              id: "aj_id",
              name: "aj_name",
              program: "aj_program",
              section: "aj_section",
              date: "aj_date",
              timeIn: "aj_timein",
              timeOut: "aj_timeout"
            };
            break;
            
          case "elementary":
            attendanceModel = Attendanceelementary;
            mainModel = elemUser;
            fields = {
              id: "ae_id",
              name: "ae_name",
              program: "ae_program",
              section: "ae_section",
              date: "ae_date",
              timeIn: "ae_timein",
              timeOut: "ae_timeout"
            };
            break;
            
          case "teacher":
            attendanceModel = Attendanceteacher;
            mainModel = teacherUser;
            fields = {
              id: "at_id",
              name: "at_name",
              program: "at_teacherlevel",
              date: "at_date",
              timeIn: "at_timein",
              timeOut: "at_timeout"
            };
            break;
            
          case "instructor":
            attendanceModel = Attendanceinstructor;
            mainModel = instructorUser;
            fields = {
              id: "ai_id",
              name: "ai_name",
              program: "ai_instructorlevel",
              date: "ai_date",
              timeIn: "ai_timein",
              timeOut: "ai_timeout"
            };
            break;
        }
        

        const existing = await attendanceModel.findOne({
          where: {
            [fields.id]: cleanId,
            [fields.date]: today
          }
        });
        

        const data = {
          [fields.id]: cleanId,
          [fields.name]: cleanName,
          [fields.date]: today,
          [fields.timeIn]: timeIn,
          [fields.timeOut]: timeOut
        };
        
      
        if (category === "college") {
          data[fields.program] = rec.program || mainModel.c_program || "";
          data[fields.yearBlock] = rec.yearBlock || mainModel.c_year_block || "";
        } else if (category === "senior") {
          data[fields.program] = rec.program || mainModel.s_program || "";
          data[fields.gradeLevel] = rec.gradeLevel || mainModel.s_gradelevel || "";
          data[fields.section] = rec.section || mainModel.s_section || "";
        } else if (category === "junior") {
          data[fields.program] = rec.program || mainModel.j_program || "";
          data[fields.section] = rec.section || mainModel.j_section || "";
        } else if (category === "elementary") {
          data[fields.program] = rec.program || mainModel.e_program || "";
          data[fields.section] = rec.section || mainModel.e_section || "";
        } else if (category === "teacher") {
          data[fields.program] = rec.program || mainModel.t_teacherlevel || "";
        } else if (category === "instructor") {
          data[fields.program] = rec.program || mainModel.i_instructorlevel || "";
        }
        
       
        if (existing) {
      
          if (timeOut && !existing[fields.timeOut]) {
            existing[fields.timeOut] = timeOut;
            await existing.save();
            console.log(` Updated Time-Out for ${cleanName}`);
          } else if (!existing[fields.timeIn]) {
            existing[fields.timeIn] = timeIn;
            if (timeOut) existing[fields.timeOut] = timeOut;
            await existing.save();
            console.log(` Updated attendance for ${cleanName}`);
          } else {
            console.log(` Attendance already exists for ${cleanName} today`);
            throw new Error(`Attendance already recorded for ${cleanName}`);
          }
        } else {
      
          await attendanceModel.create(data);
          console.log(`Created attendance for ${cleanName}`);
        }
        
        success++;
        categoryResults[category].success++;
        successList.push(`${cleanName} (${cleanId}) - ${category}`);
        
      } catch (error) {
        console.error(`Row ${index + 1} error:`, error.message);
        errorList.push(`Row ${index + 1}: ${cleanId ? `${rec.id} - ` : ''}${error.message}`);
        errors++;
        if (category) {
          categoryResults[category].errors++;
        }
      }
    }
    
  
    const summary = Object.entries(categoryResults)
      .filter(([cat, stats]) => stats.success > 0 || stats.errors > 0)
      .map(([cat, stats]) => `${cat}: ${stats.success} ${stats.errors}`)
      .join(', ');
    
    console.log("\n IMPORT SUMMARY:");
    console.log(` Success: ${success}`);
    console.log(` Errors: ${errors}`);
    console.log(` By Category: ${summary}`);
    
    res.json({
      message: `Import completed: ${success} successful, ${errors} errors`,
      success,
      errors,
      categoryResults,
      summary,
      successList: successList.slice(0, 10), 
      errorList: errorList.slice(0, 20), 
      date: today
    });
    
  } catch (error) {
    console.error(' Import error:', error);
    res.status(500).json({
      message: 'Server error during import',
      error: error.message
    });
  }
};


const getteststudentid = async (req, res) =>{
    try {
    const studentId = req.params.id;
    
 
    const collegeStudent = await College.findOne({ where: { c_id: studentId } });
    
   
    const attendance = await Attendancecollege.findAll({ 
      where: { ac_id: studentId },
      limit: 5 
    });
    
    res.json({
      existsInCollegeTable: !!collegeStudent,
      collegeStudent: collegeStudent?.dataValues,
      attendanceRecords: attendance.length,
      sampleAttendance: attendance.map(a => a.dataValues)
    });
    
  } catch (err) {
    res.status(500).json({ error: err.message });
  }

}


const getdebuguserid = async (req, res) =>{
   const { userId } = req.params;
  
  const results = {};
  
 
  const tables = [
    { name: 'College', model: College, field: 'c_id' },
    { name: 'Senior', model: Senior, field: 's_id' },
    { name: 'Junior', model: Junior, field: 'j_id' },
    { name: 'Elementary', model: Elementary, field: 'e_id' },
    { name: 'Teacher', model: Teacher, field: 't_id' },
    { name: 'Instructor', model: Instructor, field: 'i_id' }
  ];
  
  for (const table of tables) {
    try {
      const user = await table.model.findOne({
        where: { [table.field]: userId }
      });
      results[table.name] = user ? 'FOUND' : 'NOT FOUND';
      if (user) {
        results[`${table.name}_data`] = {
          id: user[table.field],
          name: user[table.name.toLowerCase() + '_name'] || user.name,
          program: user[table.name.toLowerCase() + '_program'] || 'N/A'
        };
      }
    } catch (err) {
      results[table.name] = 'ERROR: ' + err.message;
    }
  }
  
  res.json({
    searchedId: userId,
    results
  });

}


const gettestmyhistory = async (req, res) => {
  console.log("/test-my-history route hit!");
  console.log("Query params:", req.query);
  res.json({ message: "Route is working!", params: req.query });

}

module.exports = {
  recordAttendance,
  getTodayStats,
  getTodayAttendance,
  getRecentScans,
  getAttendanceTrend,
  getTimeInTimeOutStats,
  getTodayHourlyActivity,
  getAttendanceRecords,
  getMyAttendanceHistory,
    getWeekStats,    
  getMonthStats,    
  importAttendance,
  getteststudentid,
  getdebuguserid,
  gettestmyhistory
};
