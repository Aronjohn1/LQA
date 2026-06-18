
const express = require("express");
const router = express.Router();

const {
  recordAttendance,
  getTodayStats,
  getTodayAttendance,
  getRecentScans,
  getAttendanceTrend,
  getTimeInTimeOutStats,
    getWeekStats,     
  getMonthStats,    
  getTodayHourlyActivity,
  getAttendanceRecords,
  getMyAttendanceHistory,
 importAttendance

} = require("../controllers/attendanceController");




router.post("/record", recordAttendance);

router.get("/my-history", getMyAttendanceHistory);

router.post("/import", importAttendance);
router.get("/today/stats", getTodayStats);
router.get("/today/list", getTodayAttendance);
router.get("/today/timein-timeout-stats", getTimeInTimeOutStats);
router.get("/today/hourly", getTodayHourlyActivity);
router.get("/week/stats", getWeekStats);      
router.get("/month/stats", getMonthStats);    
router.get("/recent", getRecentScans);
router.get("/trend", getAttendanceTrend);
router.get("/records", getAttendanceRecords);


module.exports = router;
