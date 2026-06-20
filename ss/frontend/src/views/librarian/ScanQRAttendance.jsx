
import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import * as XLSX from "xlsx";
import api from "../../services/api";
import CameraScanner from "../../components/CameraScanner";
import { FaQrcode, FaCamera, FaStop, FaTable, FaFileExcel, FaExclamationTriangle, FaUserGraduate, FaChalkboardTeacher, FaSchool } from "react-icons/fa";
function ScanQRAttendance() {
  const [scanning, setScanning] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [todayAttendance, setTodayAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [showImportModal, setShowImportModal] = useState(false);
  const [importData, setImportData] = useState([]);
  const [detectedCategory, setDetectedCategory] = useState(null);
  const [detectionDetails, setDetectionDetails] = useState("");
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef(null);
  useEffect(() => {
    fetchTodayAttendance();
    const interval = setInterval(fetchTodayAttendance, 10000);
    return () => clearInterval(interval);
  }, []);
  const fetchTodayAttendance = async () => {
    try {
      const res = await api.get("/attendance/today/list");
      if (res.data.length > 0) {
        console.log("DEBUG - Raw data fields:", Object.keys(res.data[0]));
        console.log("DEBUG - First record:", res.data[0]);
      }
      const corrected = res.data.map(r => {
        const normalized = {
          id: r.id || r.as_id || "-",
          name: r.name || r.as_name || "-",
          section: r.section || r.as_section || r.as_yearblock || r.yearBlock || "-",
          gradeLevel: r.gradeLevel || r.as_gradelevel || r.program || "-",
          program: r.program || r.as_program || r.strand || "-",
          yearBlock: r.yearBlock || r.as_yearblock || "-",
          timeIn: r.timeIn || r.as_timein || "-",
          timeOut: r.timeOut || r.as_timeout || "Not yet",
          category: r.category || (() => {
            const idStr = (r.id || r.as_id || "").toString().toUpperCase();
            if (idStr.includes("-G-")) return "college";
            if (idStr.includes("-S-")) return "senior";
            if (idStr.includes("-J-")) return "junior";
            if (idStr.includes("-E-")) return "elementary";
            if (idStr.includes("-T-")) return "teacher";
            if (idStr.includes("-I-")) return "instructor";
            const program = (r.as_program || r.program || "").toString().toUpperCase();
            if (["BSIT", "BSBA", "BSED", "BSCRIM", "BSOA"].includes(program)) return "college";
            if (["STEM", "HUMSS", "ABM", "GAS"].includes(program)) return "senior";
            return "unknown";
          })(),
          ...r
        };
        return normalized;
      });
      console.log("DEBUG - Processed data:", corrected.slice(0, 3));
      setTodayAttendance(corrected);
    } catch (err) {
      console.error("Failed to fetch attendance:", err);
    } finally {
      setLoading(false);
    }
  };
  const handleScan = async qrData => {
    if (!qrData) return;
    try {
      const res = await api.post("/attendance/record", {
        qrData
      });
      setMessage(res.data.message);
      setMessageType("success");
      await fetchTodayAttendance();
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Error recording attendance";
      if (errorMessage.includes("minute(s) before")) {
        const match = errorMessage.match(/wait (\d+\.?\d*) minute\(s\)/);
        if (match) {
          let minutes = parseFloat(match[1]);
          if (minutes > 120) {
            minutes = 5;
          }
          const fixedMessage = errorMessage.replace(/wait \d+\.?\d* minute\(s\)/, `wait ${Math.ceil(minutes)} minute(s)`);
          setMessage(fixedMessage);
        } else {
          setMessage(errorMessage);
        }
      } else {
        setMessage(errorMessage);
      }
      setMessageType("error");
    }
    setTimeout(() => {
      setMessage("");
      setMessageType("");
    }, 5000);
  };
  const handleError = err => {
    console.error("QR Scanner Error:", err);
    setMessage("Camera error: " + err.message);
    setMessageType("error");
    setTimeout(() => setMessage(""), 3000);
  };
  const handleFileUpload = e => {
    const file = e.target.files[0];
    if (!file) return;
    console.log(`File selected: ${file.name}`);
    const reader = new FileReader();
    reader.onload = event => {
      try {
        const workbook = XLSX.read(event.target.result, {
          type: "binary"
        });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rawData = XLSX.utils.sheet_to_json(sheet);
        if (rawData.length === 0) {
          setMessage("Excel file is empty");
          setMessageType("error");
          setTimeout(() => setMessage(""), 3000);
          return;
        }
        console.log(`Found ${rawData.length} rows in Excel`);
        console.log("Sample row:", rawData[0]);
        const importData = rawData.map((row, index) => {
          const getValue = possibleNames => {
            const rowKeys = Object.keys(row);
            for (const key of rowKeys) {
              const normalizedKey = key.toLowerCase().replace(/[^a-z0-9]/g, '');
              for (const name of possibleNames) {
                const normalizedName = name.toLowerCase().replace(/[^a-z0-9]/g, '');
                if (normalizedKey === normalizedName) {
                  return row[key];
                }
              }
            }
            return "";
          };
          return {
            id: getValue(["ID", "StudentID", "Student ID", "id", "studentid"]),
            name: getValue(["Name", "StudentName", "Student Name", "name", "studentname"]),
            timeIn: getValue(["TimeIn", "Time-In", "Time In", "timein", "TIMEIN", "Time"]),
            timeOut: getValue(["TimeOut", "Time-Out", "Time Out", "timeout", "TIMEOUT"]),
            program: getValue(["Program", "program", "Course", "course", "Strand", "strand", "Level", "level"]),
            yearBlock: getValue(["YearBlock", "Year-Block", "Year & Block", "yearblock", "Section", "section"]),
            gradeLevel: getValue(["GradeLevel", "Grade Level", "gradelevel", "Grade", "grade"]),
            section: getValue(["Section", "section", "Class", "class"]),
            strand: getValue(["Strand", "strand"]),
            teacherLevel: getValue(["TeacherLevel", "Teacher Level", "teacherlevel"]),
            instructorLevel: getValue(["InstructorLevel", "Instructor Level", "instructorlevel"])
          };
        });
        console.log("Processed data:", importData.slice(0, 3));
        const firstRecord = importData[0];
        if (!firstRecord.id || !firstRecord.name || !firstRecord.timeIn) {
          setMessage(<div>
              <strong> Invalid Excel format</strong><br />
              Your Excel file must have at least these columns:<br />
              • <strong>ID</strong> (Student/Teacher ID)<br />
              • <strong>Name</strong> (Student/Teacher Name)<br />
              • <strong>Time-In</strong> (Time in any format: 8:30 AM, 830AM, 08:30, etc.)
            </div>);
          setMessageType("error");
          setTimeout(() => setMessage(""), 5000);
          return;
        }


        setImportData(importData);
        setShowImportModal(true);
        const sampleIds = importData.slice(0, 5).map(r => r.id).filter(Boolean);
        let detectedHint = "";
        let categoryCount = {
          college: 0,
          senior: 0,
          junior: 0,
          elementary: 0,
          teacher: 0,
          instructor: 0
        };
        sampleIds.forEach(id => {
          const idStr = id.toString().toUpperCase();
          if (idStr.includes("-G-")) {
            categoryCount.college++;
          } else if (idStr.includes("-S-") || /^22\d{5}$/.test(id.toString())) {
            categoryCount.senior++;
          } else if (idStr.includes("-J-") || /^23\d{5}$/.test(id.toString())) {
            categoryCount.junior++;
          } else if (idStr.includes("-E-")) {
            categoryCount.elementary++;
          } else if (idStr.includes("-T-") || idStr.startsWith("TCH")) {
            categoryCount.teacher++;
          } else if (idStr.includes("-I-") || idStr.startsWith("INS")) {
            categoryCount.instructor++;
          } else {
            const record = importData.find(r => r.id === id);
            if (record) {
              const program = record.program?.toString().toUpperCase() || "";
              const strand = record.strand?.toString().toUpperCase() || "";
              if (["STEM", "HUMSS", "ABM", "GAS"].includes(program) || ["STEM", "HUMSS", "ABM", "GAS"].includes(strand)) {
                categoryCount.senior++;
              }
            }
          }
        });
        const maxCategory = Object.entries(categoryCount).sort(([, a], [, b]) => b - a)[0];
        if (maxCategory[1] > 0) {
          const categoryNames = {
            college: "College students",
            senior: "Senior High students",
            junior: "Junior High students",
            elementary: "Elementary students",
            teacher: "Teachers",
            instructor: "Instructors"
          };
          detectedHint = `Detected ${categoryNames[maxCategory[0]]}`;
        } else {
          detectedHint = "Category will be auto-detected from database records";
        }
        setDetectionDetails(detectedHint);
      } catch (err) {
        console.error("Error reading file:", err);
        setMessage(" Error reading Excel file. Make sure it's a valid Excel file.");
        setMessageType("error");
        setTimeout(() => setMessage(""), 3000);
      }
    };
    reader.readAsBinaryString(file);
  };
  const processImportData = async () => {
    if (importData.length === 0) return;
    setImporting(true);
    setMessage("⏳ Processing import...");
    setMessageType("info");
    try {
      console.log(" Sending to server...");
      const res = await api.post("/attendance/import", {
        records: importData
      });
      console.log("Server response:", res.data);
      const results = res.data;
      let messageContent = `<strong>${results.message}</strong><br><br>`;
      if (results.success > 0) {
        messageContent += `<strong> Successful: ${results.success}</strong><br>`;
        if (results.successList && results.successList.length > 0) {
          messageContent += `<small>Sample: ${results.successList.slice(0, 5).join(', ')}${results.successList.length > 5 ? '...' : ''}</small><br>`;
        }
      }
      if (results.errors > 0) {
        messageContent += `<br><strong> Errors: ${results.errors}</strong><br>`;
        if (results.errorList && results.errorList.length > 0) {
          messageContent += `<div style="max-height: 150px; overflow-y: auto; font-size: 12px; margin-top: 5px;">`;
          results.errorList.forEach((error, i) => {
            messageContent += `<div style="color: #ef4444; margin: 2px 0;">• ${error}</div>`;
          });
          messageContent += `</div>`;
        }
      }
      if (results.summary) {
        messageContent += `<br><strong> Summary:</strong> ${results.summary}`;
      }
      setMessage(<div dangerouslySetInnerHTML={{
        __html: messageContent
      }} />);
      setMessageType(results.errors === 0 ? "success" : "warning");
      await fetchTodayAttendance();
      setTimeout(() => {
        setShowImportModal(false);
        setImportData([]);
        setDetectionDetails("");
        if (fileInputRef.current) fileInputRef.current.value = "";
      }, 3000);
      setTimeout(() => setMessage(""), 10000);
    } catch (err) {
      console.error("Import error:", err);
      setMessage(<div>
          <strong>Import failed</strong><br />
          {err.response?.data?.message || err.message}
        </div>);
      setMessageType("error");
      setTimeout(() => setMessage(""), 5000);
    } finally {
      setImporting(false);
    }
  };
  const getSectionDisplayName = (program, section, gradeLevel = "") => {
    if (!section || section === "-") return "-";
    const sectionStr = section.toString().trim();
    if (sectionStr === "1A") {
      if (gradeLevel === "8" || gradeLevel === "Grade 8" || program === "8") {
        return "Golden Shower";
      }
      if (gradeLevel === "1" || gradeLevel === "Grade 1" || program === "1") {
        return "Fate";
      }
      return sectionStr;
    }
    if (gradeLevel === "1" || gradeLevel === "Grade 1" || program === "1") return "Fate";
    if (gradeLevel === "2" || gradeLevel === "Grade 2" || program === "2") return "Charity";
    if (gradeLevel === "3" || gradeLevel === "Grade 3" || program === "3") return "Hope";
    if (gradeLevel === "4" || gradeLevel === "Grade 4" || program === "4") return "Patience";
    if (gradeLevel === "5" || gradeLevel === "Grade 5" || program === "5") return "Purity";
    if (gradeLevel === "6" || gradeLevel === "Grade 6" || program === "6") {
      return sectionStr === "Molave" ? "Molave" : "Simplicity";
    }
    if (gradeLevel === "7" || gradeLevel === "Grade 7" || program === "7") return "Gemelina";
    if (gradeLevel === "8" || gradeLevel === "Grade 8" || program === "8") {
      return sectionStr === "Ipil-Ipil" ? "Ipil-Ipil" : "Golden Shower";
    }
    if (gradeLevel === "9" || gradeLevel === "Grade 9" || program === "9") {
      return sectionStr === "Narra" ? "Narra" : "Mahogany";
    }
    if (gradeLevel === "10" || gradeLevel === "Grade 10" || program === "10") {
      return sectionStr === "Tanguile" ? "Tanguile" : "Talisay";
    }
    if ((program === "STEM" || program === "HUMSS") && ["A", "B"].includes(sectionStr)) {
      return sectionStr;
    }
    if (program === "ABM" && ["A", "B"].includes(sectionStr)) {
      return sectionStr;
    }
    return sectionStr;
  };
  const groupedAttendance = {
    all: todayAttendance,
    college: {
      all: todayAttendance.filter(r => r.category === "college"),
      BSIT: todayAttendance.filter(r => r.category === "college" && r.program === "BSIT"),
      BSBA: todayAttendance.filter(r => r.category === "college" && r.program === "BSBA"),
      BSED: todayAttendance.filter(r => r.category === "college" && r.program === "BSED"),
      BSCRIM: todayAttendance.filter(r => r.category === "college" && r.program === "BSCRIM"),
      BSOA: todayAttendance.filter(r => r.category === "college" && r.program === "BSOA")
    },
    senior: {
      all: todayAttendance.filter(r => r.category === "senior"),
      STEM: todayAttendance.filter(r => r.category === "senior" && r.program === "STEM"),
      HUMSS: todayAttendance.filter(r => r.category === "senior" && r.program === "HUMSS"),
      ABM: todayAttendance.filter(r => r.category === "senior" && r.program === "ABM")
    },
    junior: todayAttendance.filter(r => r.category === "junior"),
    elementary: todayAttendance.filter(r => r.category === "elementary"),
    teacher: todayAttendance.filter(r => r.category === "teacher"),
    instructor: todayAttendance.filter(r => r.category === "instructor")
  };
  const renderTable = (records, title, category) => {
    if (records.length === 0) return null;
    const getColumns = () => {
      switch (category) {
        case "college":
          return [{
            header: "ID",
            key: "id"
          }, {
            header: "Name",
            key: "name"
          }, {
            header: "Program",
            key: "program"
          }, {
            header: "Year & Block",
            key: "yearBlock"
          }, {
            header: "Time-In",
            key: "timeIn"
          }, {
            header: "Time-Out",
            key: "timeOut"
          }];
        case "senior":
          return [{
            header: "ID",
            key: "id"
          }, {
            header: "Name",
            key: "name"
          }, {
            header: "Strand",
            key: "program"
          }, {
            header: "Grade Level",
            key: "gradeLevel"
          }, {
            header: "Section",
            key: "section"
          }, {
            header: "Time-In",
            key: "timeIn"
          }, {
            header: "Time-Out",
            key: "timeOut"
          }];
        case "junior":
        case "elementary":
          return [{
            header: "ID",
            key: "id"
          }, {
            header: "Name",
            key: "name"
          }, {
            header: "Grade Level",
            key: "program"
          }, {
            header: "Section",
            key: "section"
          }, {
            header: "Time-In",
            key: "timeIn"
          }, {
            header: "Time-Out",
            key: "timeOut"
          }];
        case "teacher":
          return [{
            header: "ID",
            key: "id"
          }, {
            header: "Name",
            key: "name"
          }, {
            header: "Teacher Level",
            key: "program"
          }, {
            header: "Time-In",
            key: "timeIn"
          }, {
            header: "Time-Out",
            key: "timeOut"
          }];
        case "instructor":
          return [{
            header: "ID",
            key: "id"
          }, {
            header: "Name",
            key: "name"
          }, {
            header: "Instructor Level",
            key: "program"
          }, {
            header: "Time-In",
            key: "timeIn"
          }, {
            header: "Time-Out",
            key: "timeOut"
          }];
        default:
          return [{
            header: "ID",
            key: "id"
          }, {
            header: "Name",
            key: "name"
          }, {
            header: "Time-In",
            key: "timeIn"
          }, {
            header: "Time-Out",
            key: "timeOut"
          }];
      }
    };
    const columns = getColumns();
    const parseYearBlock = (yearBlock, cat, gradeLevel, program, section = "") => {
      if (cat === "senior") {
        return {
          gradeLevel: gradeLevel || "-",
          section: yearBlock ? yearBlock.split('-')[1] || "-" : section || "-"
        };
      }
      if (cat === "junior" || cat === "elementary") {
        const displaySection = getSectionDisplayName(program, section || yearBlock, gradeLevel);
        return {
          gradeLevel: gradeLevel || "-",
          section: displaySection
        };
      }
      if (cat === "college" && yearBlock) {
        const [year, block] = yearBlock.split('-');
        return {
          gradeLevel: year || "-",
          section: block || "-"
        };
      }
      return {
        gradeLevel: yearBlock || gradeLevel || "-",
        section: section || "-"
      };
    };
    return <motion.div initial={{
      opacity: 0,
      y: 10
    }} animate={{
      opacity: 1,
      y: 0
    }} className="mb-[30px]">
        <h4 className="text-[#0b7a3a] mb-[15px] text-[18px] font-semibold flex items-center [gap:10px]">
          <FaTable />
          {title} ({records.length})
        </h4>
        <div className="overflow-x-auto">
          <table className="w-full [border-collapse:collapse] [border:1px_solid_#e2e8f0] text-[14px]">
            <thead>
              <tr className="bg-[#0b7a3a] text-white">
                {columns.map((col, idx) => <th key={idx} className="p-[12px] text-left">
                    {col.header}
                  </th>)}
              </tr>
            </thead>
            <tbody>
              {records.map((r, idx) => {
              // Get section from normalized data
              const parsed = parseYearBlock(r.yearBlock, category, r.gradeLevel, r.program, r.section);
              return <motion.tr key={`${r.id}-${idx}`} initial={{
                opacity: 0
              }} animate={{
                opacity: 1
              }} transition={{
                delay: idx * 0.02
              }} style={{
                borderBottom: "1px solid #e2e8f0",
                color: "#2d3748",
                background: idx % 2 === 0 ? "#f9fafb" : "white",
                transition: "background 0.2s ease"
              }} onMouseEnter={e => e.currentTarget.style.background = "#f0fdf4"} onMouseLeave={e => e.currentTarget.style.background = idx % 2 === 0 ? "#f9fafb" : "white"}>
                    {columns.map((col, colIdx) => {
                  let value = "-";
                  if (col.key === "id") {
                    value = r.id;
                  } else if (col.key === "name") {
                    value = r.name;
                  } else if (col.key === "program") {
                    if (category === "teacher" && r.teacherLevel) {
                      value = r.teacherLevel;
                    } else if (category === "instructor" && r.instructorLevel) {
                      value = r.instructorLevel;
                    } else {
                      value = r.program || "-";
                    }
                  } else if (col.key === "yearBlock") {
                    value = r.yearBlock || "-";
                  } else if (col.key === "gradeLevel") {
                    value = r.gradeLevel || parsed.gradeLevel || "-";
                  } else if (col.key === "section") {
                    if (category === "junior" || category === "elementary") {
                      value = getSectionDisplayName(r.program, r.section || parsed.section, r.gradeLevel);
                    } else {
                      value = r.section || parsed.section || "-";
                    }
                  } else if (col.key === "timeIn") {
                    value = r.timeIn || "-";
                  } else if (col.key === "timeOut") {
                    value = r.timeOut || "Not yet";
                  }
                  const isTimeIn = col.key === "timeIn";
                  const isTimeOut = col.key === "timeOut";
                  const isName = col.key === "name";
                  return <td key={colIdx} style={{
                    padding: 12,
                    fontWeight: isName ? 600 : isTimeIn || isTimeOut ? 600 : 500,
                    color: isTimeIn ? "#10b981" : isTimeOut ? value === "Not yet" ? "#a0aec0" : "#ef4444" : "#2d3748"
                  }}>
                          {value}
                        </td>;
                })}
                  </motion.tr>;
            })}
            </tbody>
          </table>
        </div>
      </motion.div>;
  };
  const renderContent = () => {
    if (loading) {
      return <div className="text-center p-[40px]">
          <div className="w-[40px] h-[40px] [border:4px_solid_#f3f3f3] [border-top:4px_solid_#0b7a3a] rounded-full animate-spin m-[0_auto_15px]" />
          <p className="text-[#a0aec0]">Loading attendance...</p>
        </div>;
    }
    if (activeTab === "all") {
      const totalRecords = todayAttendance.length;
      if (totalRecords === 0) {
        return <div className="text-center p-[60px] text-[#a0aec0]">
            <FaUserGraduate className="text-[48px] mb-[16px] [opacity:0.5]" />
            <p className="text-[16px] mb-[8px]"> No attendance records for today</p>
            <p className="text-[14px]">Start scanning QR codes or import Excel to record attendance</p>
          </div>;
      }
      return <>
          <div className="mb-[30px] p-[15px] bg-[#f0fdf4] rounded-[8px] [border:2px_solid_#0b7a3a20]">
            <p className="text-[#0b7a3a] font-semibold m-0 text-[16px]">
               Total Records Today: <span className="text-[24px]">{totalRecords}</span>
            </p>
          </div>

          {groupedAttendance.college.all.length > 0 && <div className="mb-[40px]">
              <h3 className="text-[22px] font-bold text-[#3b82f6] mb-[20px] pb-[10px] [border-bottom:3px_solid_#3b82f6]">
                 COLLEGE ({groupedAttendance.college.all.length})
              </h3>
              {Object.keys(groupedAttendance.college).filter(key => key !== "all").map(program => <React.Fragment key={program}>
                    {renderTable(groupedAttendance.college[program], program, "college")}
                  </React.Fragment>)}
            </div>}

          {groupedAttendance.senior.all.length > 0 && <div className="mb-[40px]">
              <h3 className="text-[22px] font-bold text-[#8b5cf6] mb-[20px] pb-[10px] [border-bottom:3px_solid_#8b5cf6]">
                 SENIOR HIGH ({groupedAttendance.senior.all.length})
              </h3>
              {Object.keys(groupedAttendance.senior).filter(key => key !== "all").map(program => <React.Fragment key={program}>
                    {renderTable(groupedAttendance.senior[program], program, "senior")}
                  </React.Fragment>)}
            </div>}

          {groupedAttendance.junior.length > 0 && <div className="mb-[40px]">
              <h3 className="text-[22px] font-bold text-[#10b981] mb-[20px] pb-[10px] [border-bottom:3px_solid_#10b981]">
                JUNIOR HIGH ({groupedAttendance.junior.length})
              </h3>
              {renderTable(groupedAttendance.junior, "Junior High School", "junior")}
            </div>}

          {groupedAttendance.elementary.length > 0 && <div className="mb-[40px]">
              <h3 className="text-[22px] font-bold text-[#f59e0b] mb-[20px] pb-[10px] [border-bottom:3px_solid_#f59e0b]">
                 ELEMENTARY ({groupedAttendance.elementary.length})
              </h3>
              {renderTable(groupedAttendance.elementary, "Elementary School", "elementary")}
            </div>}

          {groupedAttendance.teacher.length > 0 && <div className="mb-[40px]">
              <h3 className="text-[22px] font-bold text-[#ec4899] mb-[20px] pb-[10px] [border-bottom:3px_solid_#ec4899]">
                TEACHERS ({groupedAttendance.teacher.length})
              </h3>
              {renderTable(groupedAttendance.teacher, "Teachers", "teacher")}
            </div>}

          {groupedAttendance.instructor.length > 0 && <div className="mb-[40px]">
              <h3 className="text-[22px] font-bold text-[#06b6d4] mb-[20px] pb-[10px] [border-bottom:3px_solid_#06b6d4]">
                INSTRUCTORS ({groupedAttendance.instructor.length})
              </h3>
              {renderTable(groupedAttendance.instructor, "Instructors", "instructor")}
            </div>}
        </>;
    }


    if (activeTab === "college") {
      const hasRecords = groupedAttendance.college.all.length > 0;
      if (!hasRecords) {
        return <div className="text-center p-[60px] text-[#a0aec0]">
            <p className="text-[16px]">📋 No college records for today</p>
          </div>;
      }
      return <>
          {renderTable(groupedAttendance.college.BSIT, "BSIT", "college")}
          {renderTable(groupedAttendance.college.BSBA, "BSBA", "college")}
          {renderTable(groupedAttendance.college.BSED, "BSED", "college")}
          {renderTable(groupedAttendance.college.BSCRIM, "BSCRIM", "college")}
          {renderTable(groupedAttendance.college.BSOA, "BSOA", "college")}
        </>;
    }
    if (activeTab === "senior") {
      const hasRecords = groupedAttendance.senior.all.length > 0;
      if (!hasRecords) {
        return <div className="text-center p-[60px] text-[#a0aec0]">
            <p className="text-[16px]"> No senior high records for today</p>
          </div>;
      }
      return <>
          {renderTable(groupedAttendance.senior.STEM, "STEM", "senior")}
          {renderTable(groupedAttendance.senior.HUMSS, "HUMSS", "senior")}
          {renderTable(groupedAttendance.senior.ABM, "ABM", "senior")}
        </>;
    }
    if (activeTab === "junior") {
      if (groupedAttendance.junior.length === 0) {
        return <div className="text-center p-[60px] text-[#a0aec0]">
            <p className="text-[16px]">📋 No junior high records for today</p>
          </div>;
      }
      return renderTable(groupedAttendance.junior, "Junior High School", "junior");
    }
    if (activeTab === "elementary") {
      if (groupedAttendance.elementary.length === 0) {
        return <div className="text-center p-[60px] text-[#a0aec0]">
            <p className="text-[16px]"> No elementary records for today</p>
          </div>;
      }
      return renderTable(groupedAttendance.elementary, "Elementary School", "elementary");
    }
    if (activeTab === "teacher") {
      if (groupedAttendance.teacher.length === 0) {
        return <div className="text-center p-[60px] text-[#a0aec0]">
            <p className="text-[16px]"> No teacher records for today</p>
          </div>;
      }
      return renderTable(groupedAttendance.teacher, "Teachers", "teacher");
    }
    if (activeTab === "instructor") {
      if (groupedAttendance.instructor.length === 0) {
        return <div className="text-center p-[60px] text-[#a0aec0]">
            <p className="text-[16px]"> No instructor records for today</p>
          </div>;
      }
      return renderTable(groupedAttendance.instructor, "Instructors", "instructor");
    }
  };
  const tabs = [{
    key: "all",
    label: "All",
    color: "#0b7a3a",
    icon: <FaTable />
  }, {
    key: "college",
    label: "College",
    color: "#3b82f6",
    icon: <FaUserGraduate />
  }, {
    key: "senior",
    label: "Senior High",
    color: "#8b5cf6",
    icon: <FaSchool />
  }, {
    key: "junior",
    label: "Junior High",
    color: "#10b981",
    icon: <FaSchool />
  }, {
    key: "elementary",
    label: "Elementary",
    color: "#f59e0b",
    icon: <FaSchool />
  }, {
    key: "teacher",
    label: "Teacher",
    color: "#ec4899",
    icon: <FaChalkboardTeacher />
  }, {
    key: "instructor",
    label: "Instructor",
    color: "#06b6d4",
    icon: <FaChalkboardTeacher />
  }];
  const modalOverlayStyle = {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0, 0, 0, 0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    padding: 20
  };
  const modalContentStyle = {
    background: "white",
    borderRadius: 16,
    padding: 30,
    maxWidth: 600,
    width: "100%",
    maxHeight: "90vh",
    overflowY: "auto",
    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
  };
  const infoBoxStyle = {
    background: "#eff6ff",
    border: "2px solid #3b82f6",
    borderRadius: 10,
    padding: 15,
    marginBottom: 20
  };
  const detectionBoxStyle = {
    background: "#fffbeb",
    border: "2px solid #f59e0b",
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    display: "flex",
    gap: 12,
    alignItems: "flex-start"
  };
  const dataPreviewStyle = {
    background: "#f0fdf4",
    border: "2px solid #10b981",
    borderRadius: 10,
    padding: 15,
    marginBottom: 20
  };
  const cancelButtonStyle = {
    padding: "12px 24px",
    background: "#e5e7eb",
    color: "#374151",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
    fontWeight: 600,
    fontSize: 14,
    flex: 1,
    transition: "all 0.3s ease"
  };
  const importButtonStyle = {
    padding: "12px 24px",
    background: "#0b7a3a",
    color: "white",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
    fontWeight: 600,
    fontSize: 14,
    flex: 1,
    transition: "all 0.3s ease",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8
  };
  return <div className="p-[20px] bg-[#f5f7fa] min-h-[100vh]">
      <motion.div initial={{
      opacity: 0,
      y: -20
    }} animate={{
      opacity: 1,
      y: 0
    }} className="mb-[30px]">
        <div className="flex justify-between items-center flex-wrap [gap:15px]">
          <div>
            <h2 className="text-[32px] font-bold text-[#1a202c] mb-[8px] flex items-center [gap:12px]">
              <FaQrcode />
              Scan QR Attendance
            </h2>
            <p className="text-[#718096] text-[16px]">
            
            </p>
          </div>
        </div>
      </motion.div>

      {showImportModal && <div style={modalOverlayStyle}>
          <motion.div initial={{
        opacity: 0,
        scale: 0.9
      }} animate={{
        opacity: 1,
        scale: 1
      }} style={modalContentStyle}>
            <h3 className="text-[22px] font-bold text-[#1a202c] mb-[15px]">
              Import Attendance Records
            </h3>


            {detectionDetails && <div style={detectionBoxStyle}>
                <FaExclamationTriangle className="text-[18px] text-[#92400e] mt-[2px]" />
                <div>
                  <p className="m-0 font-semibold text-[#92400e] text-[14px]">
                    {detectionDetails}
                  </p>
                  <p className="m-[5px_0_0_0] text-[12px] text-[#92400e] [opacity:0.8]">
                    Cooldown: 5 minutes between scans • Server will determine final category
                  </p>
                </div>
              </div>}

            {importData.length > 0 && <div style={dataPreviewStyle}>
                <p className="m-0 font-semibold text-[#10b981]">
                   {importData.length} records loaded
                </p>
                <div className="text-[12px] mt-[8px] max-h-[150px] overflow-y-auto text-[black]">
                  <table className="w-full [border-collapse:collapse] text-[11px]">
                    <thead>
                      <tr className="bg-[#f0fdf4]">
                        <th className="p-[6px]">Row</th>
                        <th className="p-[6px]">ID</th>
                        <th className="p-[6px]">Name</th>
                        <th className="p-[6px]">Time-In</th>
                        <th className="p-[6px]">Time-Out</th>
                      </tr>
                    </thead>
                    <tbody>
                      {importData.slice(0, 10).map((row, idx) => <tr key={idx} className="[border-bottom:1px_solid_#e2e8f0]">
                          <td className="p-[6px]">{idx + 1}</td>
                          <td className="p-[6px] [font-family:monospace]">{row.id}</td>
                          <td className="p-[6px]">{row.name}</td>
                          <td className="p-[6px]">{row.timeIn}</td>
                          <td className="p-[6px]">{row.timeOut || "-"}</td>
                        </tr>)}
                    </tbody>
                  </table>
                  {importData.length > 10 && <div className="p-[6px] text-[#718096] text-center">
                      ... and {importData.length - 10} more records
                    </div>}
                </div>
              </div>}

            <div className="flex [gap:10px] mt-[20px]">
              <button onClick={() => {
            setShowImportModal(false);
            setImportData([]);
            setDetectionDetails("");
            if (fileInputRef.current) fileInputRef.current.value = "";
          }} style={cancelButtonStyle} onMouseEnter={e => e.target.style.background = "#d1d5db"} onMouseLeave={e => e.target.style.background = "#e5e7eb"}>
                Cancel
              </button>
              <button onClick={processImportData} disabled={importData.length === 0 || importing} style={{
            ...importButtonStyle,
            background: importing ? "#059669" : "#0b7a3a",
            opacity: importing ? 0.8 : 1,
            cursor: importing ? "not-allowed" : "pointer"
          }} onMouseEnter={e => {
            if (!importing && importData.length > 0) {
              e.target.style.background = "#096030";
            }
          }} onMouseLeave={e => {
            if (!importing && importData.length > 0) {
              e.target.style.background = "#0b7a3a";
            }
          }}>
                {importing ? <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Processing...
                  </> : " Import Now"}
              </button>
            </div>
          </motion.div>
        </div>}

      <motion.div initial={{
      opacity: 0
    }} animate={{
      opacity: 1
    }} transition={{
      delay: 0.1
    }} className="bg-white p-[30px] rounded-[16px] [box-shadow:0_4px_6px_rgba(0,0,0,0.07)] mb-[30px] text-center">
        {!scanning ? <button onClick={() => setScanning(true)} onMouseEnter={e => {
        e.target.style.background = "#096030";
        e.target.style.transform = "scale(1.05)";
      }} onMouseLeave={e => {
        e.target.style.background = "#0b7a3a";
        e.target.style.transform = "scale(1)";
      }} className="p-[15px_40px] bg-[#0b7a3a] text-white border-0 rounded-[12px] text-[18px] cursor-pointer font-semibold flex items-center [gap:12px] m-[0_auto] [transition:all_0.3s_ease]">
            <FaCamera className="text-[20px]" />
            Start Camera Scanning
          </button> : <>
            <div className="max-w-[500px] m-[0_auto] [border:3px_solid_#0b7a3a] rounded-[12px] overflow-hidden">
              <CameraScanner onScan={handleScan} onError={handleError} />
            </div>
            <button onClick={() => setScanning(false)} onMouseEnter={e => e.target.style.background = "#dc2626"} onMouseLeave={e => e.target.style.background = "#ef4444"} className="mt-[20px] p-[10px_30px] bg-[#ef4444] text-white border-0 rounded-[8px] cursor-pointer text-[16px] font-semibold flex items-center [gap:8px] m-[20px_auto_0] [transition:all_0.3s_ease]">
              <FaStop />
              Stop Scanning
            </button>
          </>}

        {message && <motion.div initial={{
        opacity: 0,
        y: 10
      }} animate={{
        opacity: 1,
        y: 0
      }} style={{
        marginTop: 20,
        padding: 15,
        background: messageType === "success" ? "#d4edda" : "#f8d7da",
        color: messageType === "success" ? "#155724" : "#721c24",
        borderRadius: 8,
        border: `2px solid ${messageType === "success" ? "#c3e6cb" : "#f5c6cb"}`,
        fontWeight: 600
      }}>
            {messageType === "success" ? " " : " "}
            <div dangerouslySetInnerHTML={{
          __html: typeof message === 'string' ? message : message.props.children
        }} />
          </motion.div>}
      </motion.div>

      <motion.div initial={{
      opacity: 0
    }} animate={{
      opacity: 1
    }} transition={{
      delay: 0.15
    }} className="bg-white p-[20px] rounded-[16px] [box-shadow:0_4px_6px_rgba(0,0,0,0.07)] mb-[30px] flex justify-center">
        <input ref={fileInputRef} type="file" accept=".xlsx,.xls" onChange={handleFileUpload} className="hidden" />

        <button onClick={() => fileInputRef.current?.click()} onMouseEnter={e => e.target.style.background = "#2563eb"} onMouseLeave={e => e.target.style.background = "#3b82f6"} className="p-[12px_30px] bg-[#3b82f6] text-white border-0 rounded-[10px] text-[16px] cursor-pointer font-semibold flex items-center [gap:10px] [transition:all_0.3s_ease]">
          <FaFileExcel className="text-[18px]" />
          Import Excel Attendance
        </button>
      </motion.div>

      <motion.div initial={{
      opacity: 0,
      y: 20
    }} animate={{
      opacity: 1,
      y: 0
    }} transition={{
      delay: 0.2
    }} className="bg-white p-[30px] rounded-[16px] [box-shadow:0_4px_6px_rgba(0,0,0,0.07)]">
        <h3 className="text-[#1a202c] mb-[20px] text-[20px] font-semibold">
          Today's Attendance Records
        </h3>

 
        <div className="flex [gap:10px] mb-[30px] flex-wrap [border-bottom:2px_solid_#e2e8f0] pb-[10px]">
          {tabs.map(tab => <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
          padding: "10px 20px",
          background: activeTab === tab.key ? tab.color : "transparent",
          color: activeTab === tab.key ? "white" : "#718096",
          border: activeTab === tab.key ? "none" : "2px solid #e2e8f0",
          borderRadius: 8,
          cursor: "pointer",
          fontWeight: 600,
          fontSize: 14,
          transition: "all 0.3s ease",
          display: "flex",
          alignItems: "center",
          gap: 8
        }} onMouseEnter={e => {
          if (activeTab !== tab.key) {
            e.target.style.borderColor = tab.color;
            e.target.style.color = tab.color;
          }
        }} onMouseLeave={e => {
          if (activeTab !== tab.key) {
            e.target.style.borderColor = "#e2e8f0";
            e.target.style.color = "#718096";
          }
        }}>
              {tab.icon}
              {tab.label}
            </button>)}
        </div>

        {renderContent()}
      </motion.div>

      
    </div>;
}
export default ScanQRAttendance;
