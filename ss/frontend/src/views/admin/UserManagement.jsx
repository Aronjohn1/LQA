import React, { useEffect, useState, useRef } from "react";
import api from "../../services/api";
import * as XLSX from "xlsx";
import { QRCodeCanvas } from "qrcode.react";
import { FaTimes, FaEye, FaEyeSlash, FaDownload, FaSearch } from "react-icons/fa";
function UserManagement() {
  const [category, setCategory] = useState("college");
  const [records, setRecords] = useState([]);
  const [formData, setFormData] = useState({});
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [showQRIndex, setShowQRIndex] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [isMobileView, setIsMobileView] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [showGeneratedQR, setShowGeneratedQR] = useState(false);
  const [newUserQR, setNewUserQR] = useState(null);
  const [newUserPassword, setNewUserPassword] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [resetPasswordUser, setResetPasswordUser] = useState(null);
  const [resetPasswordLoading, setResetPasswordLoading] = useState(false);

  const [visiblePasswords, setVisiblePasswords] = useState({});
  const qrRefs = useRef({});
  const blocks = [..."ABCDEFGHIJKLMNOPQRSTUVWXYZ"];
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setIsMobileView(width < 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  useEffect(() => {
    fetchRecords();
    setFormData({});
    setEditId(null);
    setSelectedIds([]);
  }, [category]);
  const fetchRecords = async () => {
    try {
      setLoading(true);
      let res;
      if (category === "all") {

        res = await api.get("/auth/users/all");
        setRecords(res.data.users || []);
      } else {
   
        res = await api.get(`/user?category=${category}`);
        setRecords(res.data || []);
      }
    } catch (err) {
      console.error("Fetch Error:", err);
      alert("Error fetching users: " + (err.response?.data?.message || err.message));
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };
  const handleSelectOne = id => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };
  const togglePasswordVisibility = id => {
    setVisiblePasswords(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };
  const handleSelectAll = () => {
    if (selectedIds.length === filteredRecords.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredRecords.map(r => r.id));
    }
  };
  const handleChange = e => {
    const {
      name,
      value
    } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  const isDuplicateId = (idField, value, currentEditId = null) => {
    return records.some(r => {
      if (r[idField] === value) {
        if (currentEditId) {
          return r.id !== currentEditId;
        }
        return true;
      }
      return false;
    });
  };
  const generateQRContent = (data, cat) => {
    let qrContent = "";
    let displayText = "";
    switch (cat) {
      case "college":
        const yearBlock = `${data.year || data.c_year_block?.split('-')[0] || ''}-${data.block || data.c_year_block?.split('-')[1] || ''}`;
        qrContent = `${data.c_id} | ${data.c_name} | ${data.c_program} | ${yearBlock}`;
        displayText = `ID: ${data.c_id}\nName: ${data.c_name}\nProgram: ${data.c_program}\nYear-Block: ${yearBlock}`;
        break;
      case "seniorHigh":
        const shGradeSection = `${data.s_grade || data.s_gradelevel || ''}-${data.s_section || ''}`;
        qrContent = `${data.s_id} | ${data.s_name} | ${data.s_strand || data.s_program || ''} | ${shGradeSection}`;
        displayText = `ID: ${data.s_id}\nName: ${data.s_name}\nStrand: ${data.s_strand || data.s_program || ''}\nGrade-Section: ${shGradeSection}`;
        break;
      case "juniorHigh":
        qrContent = `${data.j_id} | ${data.j_name} | Grade ${data.j_grade || data.j_program || ''} | ${data.j_section}`;
        displayText = `ID: ${data.j_id}\nName: ${data.j_name}\nGrade: ${data.j_grade || data.j_program || ''}\nSection: ${data.j_section}`;
        break;
      case "elementary":
        qrContent = `${data.e_id} | ${data.e_name} | Grade ${data.e_grade || data.e_program || ''} | ${data.e_section}`;
        displayText = `ID: ${data.e_id}\nName: ${data.e_name}\nGrade: ${data.e_grade || data.e_program || ''}\nSection: ${data.e_section}`;
        break;
      case "teacher":
        qrContent = `${data.t_id} | ${data.t_name} | ${data.t_level || data.t_teacherlevel || ''}`;
        displayText = `ID: ${data.t_id}\nName: ${data.t_name}\nPosition: ${data.t_level || data.t_teacherlevel || ''}`;
        break;
      case "instructor":
        qrContent = `${data.i_id} | ${data.i_name} | ${data.i_instructor || data.i_instructorlevel || ''}`;
        displayText = `ID: ${data.i_id}\nName: ${data.i_name}\nPosition: ${data.i_instructor || data.i_instructorlevel || ''}`;
        break;
    }
    return {
      qrContent,
      displayText
    };
  };
  const handleAddOrEdit = async () => {
    try {
      console.log("Starting save process...");
      console.log("Form Data:", formData);
      console.log("Category:", category);
      console.log("Edit ID:", editId);
      const idFieldMap = {
        college: "c_id",
        seniorHigh: "s_id",
        juniorHigh: "j_id",
        elementary: "e_id",
        teacher: "t_id",
        instructor: "i_id"
      };
      const idField = idFieldMap[category];
      if (!idField) {
        alert("Invalid category selected");
        return;
      }
      if (formData[idField] && isDuplicateId(idField, formData[idField], editId)) {
        alert(`ID "${formData[idField]}" already exists! Please use a unique ID.`);
        return;
      }
      const requiredFieldsMap = {
        college: ["c_id", "c_name", "c_program", "year", "block"],
        seniorHigh: ["s_id", "s_name", "s_strand", "s_grade", "s_section"],
        juniorHigh: ["j_id", "j_name", "j_grade", "j_section"],
        elementary: ["e_id", "e_name", "e_grade", "e_section"],
        teacher: ["t_id", "t_name", "t_level"],
        instructor: ["i_id", "i_name", "i_instructor"]
      };
      const requiredFields = requiredFieldsMap[category] || [];
      const missingFields = requiredFields.filter(field => {
        const value = formData[field];
        return !value || value.toString().trim() === "";
      });
      if (missingFields.length > 0) {
        alert(`Please fill in all required fields:\n${missingFields.join(", ")}`);
        return;
      }


      const {
        qrContent,
        displayText
      } = generateQRContent(formData, category);


      let payload = {
        category
      };


      switch (category) {
        case "college":
          payload.c_id = formData.c_id;
          payload.c_name = formData.c_name;
          payload.c_program = formData.c_program;
          payload.c_year_block = `${formData.year}-${formData.block}`;
          break;
        case "seniorHigh":
          payload.s_id = formData.s_id;
          payload.s_name = formData.s_name;
          payload.s_program = formData.s_strand;
          payload.s_gradelevel = formData.s_grade;
          payload.s_section = formData.s_section;
          break;
        case "juniorHigh":
          payload.j_id = formData.j_id;
          payload.j_name = formData.j_name;
          payload.j_program = formData.j_grade;
          payload.j_section = formData.j_section;
          break;
        case "elementary":
          payload.e_id = formData.e_id;
          payload.e_name = formData.e_name;
          payload.e_program = formData.e_grade;
          payload.e_section = formData.e_section;
          break;
        case "teacher":
          payload.t_id = formData.t_id;
          payload.t_name = formData.t_name;
          payload.t_teacherlevel = formData.t_level;
          break;
        case "instructor":
          payload.i_id = formData.i_id;
          payload.i_name = formData.i_name;
          payload.i_instructorlevel = formData.i_instructor;
          break;
      }


      if (editId && formData.password && formData.password.trim() !== "") {
  
        payload.password = formData.password;
      } else if (!editId) {
  
        const nameField = {
          college: "c_name",
          seniorHigh: "s_name",
          juniorHigh: "j_name",
          elementary: "e_name",
          teacher: "t_name",
          instructor: "i_name"
        }[category];
        const fullName = formData[nameField] || "user";
        const firstName = fullName.split(" ")[0].toLowerCase();
        payload.password = firstName;
      }


      console.log("Final payload:", payload);
      let response;
      if (editId) {
        console.log("Updating user with ID:", editId);
        response = await api.put(`/user/${editId}`, payload);
      } else {
        console.log("Creating new user");
        response = await api.post("/user", payload);

    
        setNewUserQR({
          content: qrContent,
          displayText: displayText,
          userData: {
            ...formData,
            id: response.data?.id || formData[idField]
          },
          category: category
        });
      }
      console.log("API Response:", response.data);
      setFormData({});
      setShowForm(false);
      setEditId(null);
      setSelectedIds([]);
      setSaveMessage(editId ? "User updated successfully!" : "User added successfully!");
      setTimeout(() => setSaveMessage(""), 3000);
      await fetchRecords();
      if (!editId && response.data?.password) {
 
        setNewUserPassword(response.data.password);
        setShowPasswordModal(true);
      }
    } catch (err) {
      console.error("SAVE ERROR DETAILS:", err);
      console.error("Error response:", err.response?.data);
      console.error("Error status:", err.response?.status);
      let errorMessage = "Error saving user";
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.message) {
        errorMessage = err.message;
      }
      alert(`Save Failed: ${errorMessage}`);
    }
  };
  const handleImport = e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async evt => {
      try {
        const data = new Uint8Array(evt.target.result);
        const workbook = XLSX.read(data, {
          type: "array"
        });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(sheet);
        if (json.length === 0) {
          alert("Excel file is empty!");
          return;
        }
        const duplicates = [];
        const categoryGroups = {};
        json.forEach(row => {
          const detectedCategory = detectCategory(row) || category;
          if (!categoryGroups[detectedCategory]) categoryGroups[detectedCategory] = [];
          let payload = {
            role: "user",
            category: detectedCategory
          };
          let isDuplicate = false;
          switch (detectedCategory) {
            case "college":
              payload.c_id = row.ID || row["Student ID"] || row.id;
              payload.c_name = row.NAME || row.Name || row.name;
              payload.c_program = row.PROGRAM || row.Program || row.program;
              payload.c_year_block = row.BLOCK || row["Year-Block"] || `${row.YEAR || 1}-${row.BLOCK || "A"}`;
              payload.name = payload.c_name;
              const collegeQR = generateQRContent({
                c_id: payload.c_id,
                c_name: payload.c_name,
                c_program: payload.c_program,
                c_year_block: payload.c_year_block
              }, "college");
              payload.qr_content = collegeQR.qrContent;
              payload.qr_display_text = collegeQR.displayText;
              if (records.some(r => r.c_id === payload.c_id)) isDuplicate = true;
              break;
            case "seniorHigh":
              payload.s_id = row.ID || row["Student ID"] || row.id;
              payload.s_name = row.NAME || row.Name || row.name;
              payload.s_program = row.PROGRAM || row.Strand || row.STRAND;
              payload.s_gradelevel = row.GRADELEVEL || row.Grade || row.GRADE || 11;
              payload.s_section = row.SECTION || row.Section || row.BLOCK || "A";
              payload.name = payload.s_name;
              const shQR = generateQRContent({
                s_id: payload.s_id,
                s_name: payload.s_name,
                s_strand: payload.s_program,
                s_grade: payload.s_gradelevel,
                s_section: payload.s_section
              }, "seniorHigh");
              payload.qr_content = shQR.qrContent;
              payload.qr_display_text = shQR.displayText;
              if (records.some(r => r.s_id === payload.s_id)) isDuplicate = true;
              break;
            case "juniorHigh":
              payload.j_id = row.ID || row["Student ID"] || row.id;
              payload.j_name = row.NAME || row.Name || row.name;
              payload.j_program = row.GRADE || row.Grade || row.PROGRAM || "7";
              payload.j_section = row.SECTION || row.Section || row.BLOCK || "A";
              payload.name = payload.j_name;
              const jhQR = generateQRContent({
                j_id: payload.j_id,
                j_name: payload.j_name,
                j_grade: payload.j_program,
                j_section: payload.j_section
              }, "juniorHigh");
              payload.qr_content = jhQR.qrContent;
              payload.qr_display_text = jhQR.displayText;
              if (records.some(r => r.j_id === payload.j_id)) isDuplicate = true;
              break;
            case "elementary":
              payload.e_id = row.ID || row["Student ID"] || row.id;
              payload.e_name = row.NAME || row.Name || row.name;
              payload.e_program = row.GRADE || row.Grade || row.PROGRAM || "1";
              payload.e_section = row.SECTION || row.Section || row.BLOCK || "A";
              payload.name = payload.e_name;
              const elemQR = generateQRContent({
                e_id: payload.e_id,
                e_name: payload.e_name,
                e_grade: payload.e_program,
                e_section: payload.e_section
              }, "elementary");
              payload.qr_content = elemQR.qrContent;
              payload.qr_display_text = elemQR.displayText;
              if (records.some(r => r.e_id === payload.e_id)) isDuplicate = true;
              break;
            case "teacher":
              payload.t_id = row.ID || row["Teacher ID"] || row.id;
              payload.t_name = row.NAME || row.Name || row.name;
              payload.t_teacherlevel = row.LEVEL || row.Position || row.PROGRAM || "Teacher";
              payload.name = payload.t_name;
              const teacherQR = generateQRContent({
                t_id: payload.t_id,
                t_name: payload.t_name,
                t_level: payload.t_teacherlevel
              }, "teacher");
              payload.qr_content = teacherQR.qrContent;
              payload.qr_display_text = teacherQR.displayText;
              if (records.some(r => r.t_id === payload.t_id)) isDuplicate = true;
              break;
            case "instructor":
              payload.i_id = row.ID || row["Instructor ID"] || row.id;
              payload.i_name = row.NAME || row.Name || row.name;
              payload.i_instructorlevel = row.LEVEL || row.Position || row.PROGRAM || "Instructor";
              payload.name = payload.i_name;
              const instructorQR = generateQRContent({
                i_id: payload.i_id,
                i_name: payload.i_name,
                i_instructor: payload.i_instructorlevel
              }, "instructor");
              payload.qr_content = instructorQR.qrContent;
              payload.qr_display_text = instructorQR.displayText;
              if (records.some(r => r.i_id === payload.i_id)) isDuplicate = true;
              break;
          }
          const firstName = payload.name ? payload.name.split(" ")[0].toLowerCase() : "user123";
          payload.password = firstName;
          if (isDuplicate) {
            duplicates.push(`${payload.name} (ID: ${row.ID})`);
            return;
          }
          categoryGroups[detectedCategory].push(payload);
        });
        if (duplicates.length > 0) {
          alert(`Duplicate IDs found! These were not imported:\n\n${duplicates.join("\n")}`);
        }
        const importPromises = Object.entries(categoryGroups).map(([cat, data]) => {
          if (data.length === 0) return Promise.resolve();
          return api.post("/user/import", {
            category: cat,
            data
          }).then(response => {
            console.log(`Import successful for ${cat}:`, response.data);
            return {
              category: cat,
              count: data.length
            };
          }).catch(err => {
            console.error(`Import Error for ${cat}:`, err);
            throw new Error(`Failed to import ${cat}: ${err.message}`);
          });
        });
        const results = await Promise.allSettled(importPromises);
        let successCount = 0;
        let errorMessages = [];
        results.forEach((result, index) => {
          if (result.status === 'fulfilled' && result.value) {
            successCount += result.value.count || 0;
          } else if (result.status === 'rejected') {
            errorMessages.push(result.reason.message);
          }
        });
        let message = `Successfully imported ${successCount} users.`;
        if (errorMessages.length > 0) {
          message += `\n\nErrors:\n${errorMessages.join("\n")}`;
        }
        alert(message);
        await fetchRecords();
      } catch (err) {
        console.error("Import process error:", err);
        alert("Error during import: " + err.message);
      }
    };
    reader.readAsArrayBuffer(file);
  };
  const detectCategory = row => {
    const program = ((row.PROGRAM || row.Program || row.program || "") + "").toString().toLowerCase();
    const grade = ((row.GRADE || row.Grade || row.grade || "") + "").toString();
    if (["bsit", "bsba", "bscrim", "bsed", "bsoa"].some(p => program.includes(p))) return "college";
    if (["stem", "humss", "abm", "gas"].some(p => program.includes(p))) return "seniorHigh";
    if (["7", "8", "9", "10"].includes(grade)) return "juniorHigh";
    if (["1", "2", "3", "4", "5", "6"].includes(grade)) return "elementary";
    if (program.includes("teacher")) return "teacher";
    if (program.includes("instructor")) return "instructor";
    return null;
  };
  const handleBatchDelete = async () => {
    if (selectedIds.length === 0) {
      alert("Please select at least one record to delete.");
      return;
    }
    setShowDeleteConfirm(true);
  };
  const confirmBatchDelete = async () => {
    try {
      console.log("Deleting users:", {
        ids: selectedIds,
        category
      });
      const response = await api.delete(`/user/batch`, {
        data: {
          ids: selectedIds,
          category: category
        }
      });
      console.log("Batch Delete response:", response.data);
      alert(`Successfully deleted ${response.data.deletedCount || selectedIds.length} users.`);
      setSelectedIds([]);
      await fetchRecords();
      setShowDeleteConfirm(false);
    } catch (err) {
      console.error("Batch Delete Error:", err);
      console.error("Error details:", {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
      alert(err.response?.data?.message || "Error deleting users: " + err.message);
      setShowDeleteConfirm(false);
    }
  };
  const handleResetPassword = user => {
    setResetPasswordUser(user);
    setShowResetPasswordModal(true);
  };
  const confirmResetPassword = async () => {
    if (!resetPasswordUser) return;
    try {
      setResetPasswordLoading(true);
      const idFieldMap = {
        college: 'c_id',
        seniorHigh: 's_id',
        juniorHigh: 'j_id',
        elementary: 'e_id',
        teacher: 't_id',
        instructor: 'i_id'
      };
      const userId = resetPasswordUser[idFieldMap[category]];
      const response = await api.post('/user/reset-password', {
        category,
        userId
      });
      setNewUserPassword(response.data.password);
      setShowResetPasswordModal(false);
      setResetPasswordUser(null);
      setShowPasswordModal(true);
      setSaveMessage('Password reset successfully!');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (err) {
      console.error("Password reset error:", err);
      alert(err.response?.data?.message || "Error resetting password: " + err.message);
    } finally {
      setResetPasswordLoading(false);
    }
  };
  const handleBatchEdit = () => {
    if (selectedIds.length === 0) {
      alert("Please select one record to edit.");
      return;
    }
    if (selectedIds.length > 1) {
      alert("Please select only ONE record to edit.");
      return;
    }
    const userToEdit = records.find(r => r.id === selectedIds[0]);
    if (userToEdit) {
      handleEdit(userToEdit);
    }
  };
  const handleEdit = user => {
    console.log("Editing user:", user);
    setEditId(user.id);
    const data = {
      ...user
    };
    delete data.id;
    delete data.createdAt;
    delete data.updatedAt;
    delete data.__v;
    delete data.password;
    if (category === "college" && user.c_year_block) {
      const [year, block] = user.c_year_block.split('-');
      data.year = year;
      data.block = block;
    }
    if (category === "seniorHigh") {
      data.s_strand = user.s_program;
      data.s_grade = user.s_gradelevel;
    }
    if (category === "juniorHigh") {
      data.j_grade = user.j_program;
    }
    if (category === "elementary") {
      data.e_grade = user.e_program;
    }
    if (category === "teacher") {
      data.t_level = user.t_teacherlevel;
    }
    if (category === "instructor") {
      data.i_instructor = user.i_instructorlevel;
    }
    console.log("Form data to set:", data);
    setFormData(data);
    setShowForm(true);
  };
  const filteredRecords = records.filter(r => JSON.stringify(r).toLowerCase().includes(search.toLowerCase()));
  const hiddenFieldsMap = {
    college: ["role", "category", "name"],
    seniorHigh: ["role", "category", "name"],
    juniorHigh: ["role", "category", "name"],
    elementary: ["role", "category", "name"],
    teacher: ["role", "category", "name"],
    instructor: ["role", "category", "name"]
  };
  const columnHeaderMap = {
    c_id: "ID",
    c_name: "NAME",
    c_program: "PROGRAM",
    c_year_block: "YEAR & BLOCK",
    s_id: "ID",
    s_name: "NAME",
    s_program: "STRAND",
    s_gradelevel: "GRADE LEVEL",
    s_section: "SECTION",
    j_id: "ID",
    j_name: "NAME",
    j_program: "GRADE",
    j_section: "SECTION",
    e_id: "ID",
    e_name: "NAME",
    e_program: "GRADE",
    e_section: "SECTION",
    t_id: "ID",
    t_name: "NAME",
    t_teacherlevel: "POSITION",
    i_id: "ID",
    i_name: "NAME",
    i_instructorlevel: "POSITION"
  };
  const getDisplayColumns = () => {
    if (records.length === 0) return [];
    const allKeys = Object.keys(records[0]);
    const hidden = hiddenFieldsMap[category] || [];
    const categoryFieldMap = {
      college: ["c_id", "c_name", "c_program", "c_year_block"],
      seniorHigh: ["s_id", "s_name", "s_program", "s_gradelevel", "s_section"],
      juniorHigh: ["j_id", "j_name", "j_program", "j_section"],
      elementary: ["e_id", "e_name", "e_program", "e_section"],
      teacher: ["t_id", "t_name", "t_teacherlevel"],
      instructor: ["i_id", "i_name", "i_instructorlevel"]
    };
    if (isMobileView) {
      const mobileFieldMap = {
        college: ["c_id", "c_name", "c_program", "c_year_block"],
        seniorHigh: ["s_id", "s_name", "s_program", "s_section"],
        juniorHigh: ["j_id", "j_name", "j_program", "j_section"],
        elementary: ["e_id", "e_name", "e_program", "e_section"],
        teacher: ["t_id", "t_name", "t_teacherlevel"],
        instructor: ["i_id", "i_name", "i_instructorlevel"]
      };
      const mobileColumns = (mobileFieldMap[category] || []).filter(col => allKeys.includes(col) && !hidden.includes(col));
      return mobileColumns;
    }
    const finalDisplayColumns = (categoryFieldMap[category] || []).filter(col => allKeys.includes(col) && !hidden.includes(col));
    return finalDisplayColumns;
  };
  const filteredColumns = getDisplayColumns();
  const getQrValue = row => {
    console.log(" getQrValue called with category:", category);
    console.log(" Row data for QR:", row);
    if (!row) {
      console.log(" No row data!");
      return "No user data available";
    }
    if (row.qr_content) {
      console.log(" Using stored QR content:", row.qr_content);
      return row.qr_content;
    }
    let qrContent = "";
    switch (category) {
      case "college":
        qrContent = `${row.c_id || ''} | ${row.c_name || ''} | ${row.c_program || ''} | ${row.c_year_block || ''}`;
        break;
      case "seniorHigh":
        const seniorGrade = row.s_gradelevel || '';
        const seniorSection = row.s_section || '';
        const seniorGradeSection = `${seniorGrade}-${seniorSection}`;
        qrContent = `${row.s_id || ''} | ${row.s_name || ''} | ${row.s_program || ''} | ${seniorGradeSection}`;
        break;
      case "juniorHigh":
        qrContent = `${row.j_id || ''} | ${row.j_name || ''} | ${row.j_program || ''} | ${row.j_section || ''}`;
        break;
      case "elementary":
        qrContent = `${row.e_id || ''} | ${row.e_name || ''} | ${row.e_program || ''} | ${row.e_section || ''}`;
        break;
      case "teacher":
        qrContent = `${row.t_id || ''} | ${row.t_name || ''} | ${row.t_teacherlevel || ''}`;
        break;
      case "instructor":
        qrContent = `${row.i_id || ''} | ${row.i_name || ''} | ${row.i_instructorlevel || ''}`;
        break;
      default:
        qrContent = `${row.id || ''} | ${row.name || ''}`;
    }
    qrContent = qrContent.trim();
    qrContent = qrContent.replace(/\s*\|\s*\|\s*/g, ' | ');
    console.log(' Generated QR Content:', qrContent);
    console.log(' Field check for', category, ':');


    if (category === "seniorHigh") {
      console.log('s_id:', row.s_id);
      console.log('s_name:', row.s_name);
      console.log('s_program:', row.s_program);
      console.log('s_gradelevel:', row.s_gradelevel);
      console.log('s_section:', row.s_section);
    } else if (category === "juniorHigh") {
      console.log('j_id:', row.j_id);
      console.log('j_name:', row.j_name);
      console.log('j_program:', row.j_program);
      console.log('j_section:', row.j_section);
    } else if (category === "elementary") {
      console.log('e_id:', row.e_id);
      console.log('e_name:', row.e_name);
      console.log('e_program:', row.e_program);
      console.log('e_section:', row.e_section);
    }
    return qrContent;
  };
  const getSections = (category, grade, strand = "") => {
    if (category === "elementary") {
      switch (grade) {
        case "1":
          return ["Fate"];
        case "2":
          return ["Charity"];
        case "3":
          return ["Hope"];
        case "4":
          return ["Patience"];
        case "5":
          return ["Purity"];
        case "6":
          return ["Simplicity", "Molave"];
        default:
          return ["Fate", "Charity", "Hope", "Patience", "Purity", "Simplicity", "Molave"];
      }
    }
    if (category === "juniorHigh") {
      switch (grade) {
        case "7":
          return ["Gemelina"];
        case "8":
          return ["Golden Shower", "Ipil-Ipil"];
        case "9":
          return ["Mahogany", "Narra"];
        case "10":
          return ["Talisay", "Tanguile"];
        default:
          return ["Gemelina", "Golden Shower", "Ipil-Ipil", "Mahogany", "Narra", "Talisay", "Tanguile"];
      }
    }
    if (category === "seniorHigh") {
      if (strand === "HUMSS" || strand === "STEM") {
        return ["A", "B"];
      }
      return ["A", "B"];
    }
    return blocks;
  };
  const renderFormFields = () => {
    const inputStyle = {
      background: "white",
      color: "black",
      height: isMobileView ? "36px" : "40px",
      padding: isMobileView ? "8px 10px" : "10px",
      borderRadius: "6px",
      border: "1px solid #ccc",
      width: "100%",
      fontSize: isMobileView ? "14px" : "16px",
      boxSizing: "border-box"
    };
    const selectStyle = {
      ...inputStyle,
      height: isMobileView ? "36px" : "40px"
    };
    switch (category) {
      case "college":
        return <>
            <div>
              <label className="block mb-[5px] font-medium">College ID</label>
              <input name="c_id" placeholder="e.g., 23-G-0000052" onChange={handleChange} value={formData.c_id || ""} style={inputStyle} />
            </div>
            <div>
              <label className="block mb-[5px] font-medium">Full Name</label>
              <input name="c_name" placeholder="e.g., Aron John Burlat" onChange={handleChange} value={formData.c_name || ""} style={inputStyle} />
            </div>
            <div>
              <label className="block mb-[5px] font-medium">Program</label>
              <select name="c_program" onChange={handleChange} value={formData.c_program || ""} style={selectStyle}>
                <option value="">Select Program</option>
                {["BSIT", "BSBA", "BSCRIM", "BSED", "BSOA"].map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div style={{
            display: 'flex',
            gap: isMobileView ? '5px' : '10px'
          }}>
              <div className="[flex:1]">
                <label className="block mb-[5px] font-medium">Year</label>
                <select name="year" onChange={handleChange} value={formData.year || ""} style={selectStyle}>
                  <option value="">Select Year</option>
                  {[1, 2, 3, 4].map(y => <option key={y} value={y}>{y} Year</option>)}
                </select>
              </div>
              <div className="[flex:1]">
                <label className="block mb-[5px] font-medium">Block</label>
                <select name="block" onChange={handleChange} value={formData.block || ""} style={selectStyle}>
                  <option value="">Select Block</option>
                  {blocks.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
            </div>
            {editId && <div>
                <label className="block mb-[5px] font-medium">
                  Password (leave empty to keep current)
                </label>
                <input name="password" type="password" placeholder="New Password (optional)" onChange={handleChange} value={formData.password || ""} style={inputStyle} />
              </div>}
          </>;
      case "seniorHigh":
        const seniorSections = getSections("seniorHigh", formData.s_grade, formData.s_strand);
        return <>
            <div>
              <label className="block mb-[5px] font-medium">SHS ID</label>
              <input name="s_id" placeholder="e.g., 23-S-000001" onChange={handleChange} value={formData.s_id || ""} style={inputStyle} />
            </div>
            <div>
              <label className="block mb-[5px] font-medium">Full Name</label>
              <input name="s_name" placeholder="e.g., Maria Santos" onChange={handleChange} value={formData.s_name || ""} style={inputStyle} />
            </div>
            <div>
              <label className="block mb-[5px] font-medium">Strand</label>
              <select name="s_strand" onChange={handleChange} value={formData.s_strand || ""} style={selectStyle}>
                <option value="">Select Strand</option>
                {["STEM", "HUMSS", "ABM"].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div style={{
            display: 'flex',
            gap: isMobileView ? '5px' : '10px'
          }}>
              <div className="[flex:1]">
                <label className="block mb-[5px] font-medium">Grade Level</label>
                <select name="s_grade" onChange={handleChange} value={formData.s_grade || ""} style={selectStyle}>
                  <option value="">Select Grade</option>
                  {[11, 12].map(g => <option key={g} value={g}>Grade {g}</option>)}
                </select>
              </div>
              <div className="[flex:1]">
                <label className="block mb-[5px] font-medium">Section</label>
                <select name="s_section" onChange={handleChange} value={formData.s_section || ""} style={selectStyle}>
                  <option value="">Select Section</option>
                  {seniorSections.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            {editId && <div>
                <label className="block mb-[5px] font-medium">
                  Password (leave empty to keep current)
                </label>
                <PasswordInput value={formData.password || ""} onChange={e => handleChange({
              ...e,
              target: {
                ...e.target,
                name: 'password'
              }
            })} placeholder="New Password (optional)" />
              </div>}
          </>;
      case "juniorHigh":
        const juniorSections = getSections("juniorHigh", formData.j_grade);
        return <>
            <div>
              <label className="block mb-[5px] font-medium">JHS ID</label>
              <input name="j_id" placeholder="e.g., 23-J-000001" onChange={handleChange} value={formData.j_id || ""} style={inputStyle} />
            </div>
            <div>
              <label className="block mb-[5px] font-medium">Full Name</label>
              <input name="j_name" placeholder="e.g., Pedro Reyes" onChange={handleChange} value={formData.j_name || ""} style={inputStyle} />
            </div>
            <div style={{
            display: 'flex',
            gap: isMobileView ? '5px' : '10px'
          }}>
              <div className="[flex:1]">
                <label className="block mb-[5px] font-medium">Grade Level</label>
                <select name="j_grade" onChange={handleChange} value={formData.j_grade || ""} style={selectStyle}>
                  <option value="">Select Grade</option>
                  {["7", "8", "9", "10"].map(g => <option key={g} value={g}>Grade {g}</option>)}
                </select>
              </div>
              <div className="[flex:1]">
                <label className="block mb-[5px] font-medium">Section</label>
                <select name="j_section" onChange={handleChange} value={formData.j_section || ""} style={selectStyle}>
                  <option value="">Select Section</option>
                  {juniorSections.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            {editId && <div>
                <label className="block mb-[5px] font-medium">
                  Password (leave empty to keep current)
                </label>
                <PasswordInput value={formData.password || ""} onChange={e => handleChange({
              ...e,
              target: {
                ...e.target,
                name: 'password'
              }
            })} placeholder="New Password (optional)" />
              </div>}
          </>;
      case "elementary":
        const elementarySections = getSections("elementary", formData.e_grade);
        return <>
            <div>
              <label className="block mb-[5px] font-medium">Elementary ID</label>
              <input name="e_id" placeholder="e.g., 23-E-000001" onChange={handleChange} value={formData.e_id || ""} style={inputStyle} />
            </div>
            <div>
              <label className="block mb-[5px] font-medium">Full Name</label>
              <input name="e_name" placeholder="e.g., Ana Gonzales" onChange={handleChange} value={formData.e_name || ""} style={inputStyle} />
            </div>
            <div style={{
            display: 'flex',
            gap: isMobileView ? '5px' : '10px'
          }}>
              <div className="[flex:1]">
                <label className="block mb-[5px] font-medium">Grade Level</label>
                <select name="e_grade" onChange={handleChange} value={formData.e_grade || ""} style={selectStyle}>
                  <option value="">Select Grade</option>
                  {["1", "2", "3", "4", "5", "6"].map(g => <option key={g} value={g}>Grade {g}</option>)}
                </select>
              </div>
              <div className="[flex:1]">
                <label className="block mb-[5px] font-medium">Section</label>
                <select name="e_section" onChange={handleChange} value={formData.e_section || ""} style={selectStyle}>
                  <option value="">Select Section</option>
                  {elementarySections.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            {editId && <div>
                <label className="block mb-[5px] font-medium">
                  Password (leave empty to keep current)
                </label>
                <PasswordInput value={formData.password || ""} onChange={e => handleChange({
              ...e,
              target: {
                ...e.target,
                name: 'password'
              }
            })} placeholder="New Password (optional)" />
              </div>}
          </>;
      case "teacher":
        return <>
            <div>
              <label className="block mb-[5px] font-medium">Teacher ID</label>
              <input name="t_id" placeholder="e.g., 23-T-000001" onChange={handleChange} value={formData.t_id || ""} style={inputStyle} />
            </div>
            <div>
              <label className="block mb-[5px] font-medium">Teacher Name</label>
              <input name="t_name" placeholder="e.g., Mr. John Smith" onChange={handleChange} value={formData.t_name || ""} style={inputStyle} />
            </div>
            <div>
              <label className="block mb-[5px] font-medium">Position</label>
              <select name="t_level" onChange={handleChange} value={formData.t_level || ""} style={selectStyle}>
                <option value="">Select Position</option>
                {["Elementary Teacher", "Junior Teacher", "Senior Teacher"].map(level => <option key={level} value={level}>{level}</option>)}
              </select>
            </div>
            {editId && <div>
                <label className="block mb-[5px] font-medium">
                  Password (leave empty to keep current)
                </label>
                <PasswordInput value={formData.password || ""} onChange={e => handleChange({
              ...e,
              target: {
                ...e.target,
                name: 'password'
              }
            })} placeholder="New Password (optional)" />
              </div>}
          </>;
      case "instructor":
        return <>
            <div>
              <label className="block mb-[5px] font-medium">Instructor ID</label>
              <input name="i_id" placeholder="e.g., 23-I-000001" onChange={handleChange} value={formData.i_id || ""} style={inputStyle} disabled={editId} />
            </div>
            <div>
              <label className="block mb-[5px] font-medium">Instructor Name</label>
              <input name="i_name" placeholder="e.g., Prof. Jane Doe" onChange={handleChange} value={formData.i_name || ""} style={inputStyle} />
            </div>
            <div>
              <label className="block mb-[5px] font-medium">Position</label>
              <select name="i_instructor" onChange={handleChange} value={formData.i_instructor || ""} style={selectStyle}>
                <option value="">Select Position</option>
                {["BSIT Instructor", "BSBA Instructor", "BSED Instructor", "BSCRIM Instructor", "BSOA Instructor"].map(level => <option key={level} value={level}>{level}</option>)}
              </select>
            </div>
            {editId && <div>
                <label className="block mb-[5px] font-medium">
                  Password (leave empty to keep current)
                </label>
                <PasswordInput value={formData.password || ""} onChange={e => handleChange({
              ...e,
              target: {
                ...e.target,
                name: 'password'
              }
            })} placeholder="New Password (optional)" />
              </div>}
          </>;
      default:
        return null;
    }
  };
  const renderMobileCard = (row, idx) => {
    const idFieldMap = {
      college: row.c_id,
      seniorHigh: row.s_id,
      juniorHigh: row.j_id,
      elementary: row.e_id,
      teacher: row.t_id,
      instructor: row.i_id
    };
    const nameFieldMap = {
      college: row.c_name,
      seniorHigh: row.s_name,
      juniorHigh: row.j_name,
      elementary: row.e_name,
      teacher: row.t_name,
      instructor: row.i_name
    };
    const programFieldMap = {
      college: row.c_program,
      seniorHigh: row.s_program,
      juniorHigh: row.j_program,
      elementary: row.e_program,
      teacher: row.t_teacherlevel,
      instructor: row.i_instructorlevel
    };
    const sectionFieldMap = {
      college: row.c_year_block,
      seniorHigh: row.s_section,
      juniorHigh: row.j_section,
      elementary: row.e_section,
      teacher: row.t_teacherlevel,
      instructor: row.i_instructorlevel
    };
    const displayId = idFieldMap[category] || row.id;
    const displayName = nameFieldMap[category] || row.name;
    const displayProgram = programFieldMap[category] || "-";
    const displaySection = sectionFieldMap[category] || "-";
    return <div key={row.id || idx} style={{
      background: selectedIds.includes(row.id) ? '#e0f7fa' : 'white',
      border: '1px solid #ddd',
      borderRadius: '8px',
      padding: '12px',
      marginBottom: '10px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
    }}>

        <div className="flex justify-between items-center mb-[10px]">
          <div className="flex items-center [gap:10px]">
            <input type="checkbox" checked={selectedIds.includes(row.id)} onChange={() => handleSelectOne(row.id)} className="[transform:scale(1.2)] [accent-color:#0b7a3a]" />
            <span className="[font-family:monospace] font-[bold] text-[14px] text-[#0b7a3a]">
              {displayId?.length > 15 ? `${displayId.substring(0, 12)}...` : displayId}
            </span>
          </div>

          <button onClick={() => setShowQRIndex(showQRIndex === idx ? null : idx)} style={{
          background: showQRIndex === idx ? '#666' : '#0b7a3a',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          padding: '6px 12px',
          fontSize: '12px',
          fontWeight: 'bold',
          cursor: 'pointer'
        }}>
            {showQRIndex === idx ? "Hide QR" : "Show QR"}
          </button>
        </div>

        <div className="mb-[8px]">
          <div className="font-[bold] text-[16px] mb-[4px]">
            {displayName?.length > 25 ? `${displayName.substring(0, 22)}...` : displayName}
          </div>
          <div className="text-[14px] text-[#666]">
            {displayProgram}
          </div>
        </div>

        {category === 'college' && row.c_year_block && <div className="text-[13px] text-[#555] mb-[5px]">
            Year & Block: {row.c_year_block}
          </div>}

        {category === 'seniorHigh' && row.s_section && <div className="text-[13px] text-[#555] mb-[5px]">
            Section: {row.s_section}
          </div>}

        {category === 'juniorHigh' && row.j_section && <div className="text-[13px] text-[#555] mb-[5px]">
            Section: {row.j_section}
          </div>}

        {category === 'elementary' && row.e_section && <div className="text-[13px] text-[#555] mb-[5px]">
            Section: {row.e_section}
          </div>}

        <div className="mt-[12px] pt-[12px] [border-top:1px_solid_#eee] flex items-center justify-between">
          <div className="text-[12px] text-[#666] font-medium">
            Password:
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="min-w-20 break-all font-mono text-[13px] font-medium tracking-[1px] text-[#0b7a3a]">
              {visiblePasswords[row.id ?? idx] ? row.password || "—" : "••••••••"}
            </span>
            <button type="button" onClick={() => togglePasswordVisibility(row.id ?? idx)} className="inline-flex items-center justify-center rounded border border-[#0b7a3a] bg-transparent px-2 py-1 text-[13px] text-[#0b7a3a] transition hover:bg-[#0b7a3a] hover:text-white" title={visiblePasswords[row.id ?? idx] ? "Hide password" : "Show password"}>
              {visiblePasswords[row.id ?? idx] ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
        </div>

      </div>;
  };
  const CategorySelector = () => <select value={category} onChange={e => {
    setCategory(e.target.value);
    setFormData({});
    setEditId(null);
    setSelectedIds([]);
  }} style={{
    width: isMobileView ? "100%" : "200px",
    padding: isMobileView ? "10px" : "8px",
    borderRadius: "6px",
    marginBottom: isMobileView ? "15px" : "0",
    background: "white",
    color: "black",
    border: "2px solid #0b7a3a",
    fontSize: isMobileView ? "14px" : "16px",
    fontWeight: "bold"
  }}>
      <option value="college">College</option>
      <option value="seniorHigh">Senior High</option>
      <option value="juniorHigh">Junior High</option>
      <option value="elementary">Elementary</option>
      <option value="teacher">Teacher</option>
      <option value="instructor">Instructor</option>
    </select>;
  const PasswordInput = ({
    value,
    onChange,
    placeholder,
    disabled = false,
    name = "password"
  }) => {
    const [isVisible, setIsVisible] = useState(false);
    const inputStyle = {
      width: "100%",
      padding: "12px 40px 12px 12px",
      borderRadius: "6px",
      border: "1px solid #ccc",
      fontSize: "14px",
      fontFamily: "inherit",
      boxSizing: "border-box",
      backgroundColor: disabled ? "#f5f5f5" : "white",
      color: disabled ? "#999" : "black"
    };
    const handlePasswordChange = e => {

      const event = {
        ...e,
        target: {
          ...e.target,
          name: name,
          value: e.target.value
        }
      };
      onChange(event);
    };
    return <div className="relative w-full">
        <input name={name} type={isVisible ? "text" : "password"} value={value} onChange={handlePasswordChange} placeholder={placeholder} disabled={disabled} style={inputStyle} />
        <button type="button" onClick={() => setIsVisible(!isVisible)} style={{
        position: "absolute",
        right: "10px",
        top: "50%",
        transform: "translateY(-50%)",
        background: "none",
        border: "none",
        cursor: "pointer",
        color: disabled ? "#ccc" : "#0b7a3a",
        fontSize: "18px",
        padding: "0",
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      }} disabled={disabled} title={isVisible ? "Hide password" : "Show password"}>
          {isVisible ? <FaEyeSlash /> : <FaEye />}
        </button>
      </div>;
  };


  const PasswordModal = () => {
    if (!showPasswordModal || !newUserPassword) return null;
    return <div className="fixed [top:0] [left:0] [right:0] [bottom:0] bg-[rgba(0,0,0,0.5)] flex justify-center items-center [z-index:9999]">
        <div className="bg-white p-[30px] rounded-[8px] max-w-[400px] [box-shadow:0_4px_6px_rgba(0,0,0,0.1)] text-center">
          <h3 className="text-[#0b7a3a] mt-[0]">✓ User Created Successfully</h3>
          <p className="text-[#666] mb-[20px]">
            The user has been created. Below is the generated password:
          </p>
          
          <div className="bg-[#f5f5f5] p-[15px] rounded-[5px] [border:2px_solid_#0b7a3a] mb-[20px]">
            <p className="m-[5px_0] text-[#666] text-[12px]">Password:</p>
            <p className="m-0 text-[24px] font-[bold] [font-family:monospace] text-[#0b7a3a] [letter-spacing:2px]">
              {newUserPassword}
            </p>
          </div>

          <p className="text-[#d32f2f] text-[13px] mb-[20px]">
            ⚠️ Please share this password with the user. It cannot be recovered later.
          </p>

          <button onClick={() => {

          navigator.clipboard.writeText(newUserPassword).then(() => {
            alert('Password copied to clipboard!');
          });
        }} className="bg-[#0b7a3a] text-white border-0 p-[10px_20px] rounded-[5px] cursor-pointer mr-[10px] text-[14px]">
            📋 Copy Password
          </button>

          <button onClick={() => {
          setShowPasswordModal(false);
          setNewUserPassword(null);
        }} className="bg-[#ccc] text-[#333] border-0 p-[10px_20px] rounded-[5px] cursor-pointer text-[14px]">
            Close
          </button>
        </div>
      </div>;
  };
  const ResetPasswordModal = () => {
    if (!showResetPasswordModal || !resetPasswordUser) return null;
    return <div className="fixed [top:0] [left:0] [right:0] [bottom:0] bg-[rgba(0,0,0,0.5)] flex justify-center items-center [z-index:9999]">
        <div className="bg-white p-[30px] rounded-[8px] max-w-[400px] [box-shadow:0_4px_6px_rgba(0,0,0,0.1)] text-center">
          <h3 className="m-[0_0_20px_0] text-[#0b7a3a] text-[20px]">
            Reset Password
          </h3>
          
          <p className="m-[15px_0] text-[#666] text-[14px]">
            Are you sure you want to reset the password for this user?
          </p>
          
          <p className="m-[10px_0] text-[#333] font-semibold">
            {resetPasswordUser.c_name || resetPasswordUser.s_name || resetPasswordUser.j_name || resetPasswordUser.e_name || resetPasswordUser.t_name || resetPasswordUser.i_name}
          </p>

          <p className="text-[#d32f2f] text-[13px] mt-[20px] mb-[20px]">
            A new password will be generated and displayed. The user must change it on first login.
          </p>

          <div className="flex [gap:10px] justify-center">
            <button onClick={confirmResetPassword} disabled={resetPasswordLoading} style={{
            background: '#0b7a3a',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '5px',
            cursor: resetPasswordLoading ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            opacity: resetPasswordLoading ? 0.6 : 1
          }}>
              {resetPasswordLoading ? 'Resetting...' : 'Yes, Reset Password'}
            </button>
            <button onClick={() => {
            setShowResetPasswordModal(false);
            setResetPasswordUser(null);
          }} className="bg-[#ccc] text-[#333] border-0 p-[10px_20px] rounded-[5px] cursor-pointer text-[14px]">
              Cancel
            </button>
          </div>
        </div>
      </div>;
  };
  return <div style={{
    padding: isMobileView ? '10px 5px' : '20px',
    maxWidth: '100%',
    boxSizing: 'border-box',
    background: '#f5f7fa',
    minHeight: '100vh'
  }}>

      {saveMessage && <div className="fixed [top:20px] [right:20px] bg-[#4CAF50] text-white p-[15px_20px] rounded-[8px] [box-shadow:0_4px_12px_rgba(0,0,0,0.15)] [z-index:1000]">
          <strong>Success!</strong> {saveMessage}
        </div>}


      <div style={{
      marginBottom: isMobileView ? '15px' : '20px',
      display: 'flex',
      flexDirection: isMobileView ? 'column' : 'row',
      justifyContent: 'space-between',
      alignItems: isMobileView ? 'stretch' : 'center',
      gap: isMobileView ? '15px' : '20px'
    }}>
        <div>
          <h2 style={{
          color: "black",
          fontSize: isMobileView ? "20px" : "24px",
          margin: 0,
          fontWeight: 700
        }}>
            User Management ({category.toUpperCase()})
          </h2>
          <p style={{
          color: "#666",
          fontSize: isMobileView ? "12px" : "14px",
          marginTop: "5px",
          marginBottom: 0
        }}>
            Total: {records.length} users | Selected: {selectedIds.length}
            {loading && " | Loading..."}
          </p>
        </div>
        
        <CategorySelector />
      </div>


      <div style={{
      marginBottom: 20,
      display: "flex",
      gap: isMobileView ? "8px" : "10px",
      flexWrap: "wrap",
      justifyContent: isMobileView ? "center" : "flex-start"
    }}>
        <button onClick={() => {
        setFormData({});
        setEditId(null);
        setSelectedIds([]);
        setShowForm(true);
      }} className="inline-flex items-center justify-center gap-2 rounded-md border-0 px-5 py-3 text-sm font-semibold transition hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 bg-[#0b7a3a] text-white hover:bg-[#096030]" style={{
        padding: isMobileView ? "10px 15px" : "12px 20px",
        fontSize: isMobileView ? "14px" : "16px",
        flex: isMobileView ? "1" : "auto",
        minWidth: isMobileView ? "100px" : "auto"
      }}>
          + Add User
        </button>
        
        <label className="inline-flex items-center justify-center gap-2 rounded-md border-0 px-5 py-3 text-sm font-semibold transition hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 bg-[#6c757d] text-white hover:bg-[#5a6268]" style={{
        padding: isMobileView ? "10px 15px" : "12px 20px",
        fontSize: isMobileView ? "14px" : "16px",
        flex: isMobileView ? "1" : "auto",
        minWidth: isMobileView ? "100px" : "auto",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px"
      }}>
          <FaDownload size={isMobileView ? 14 : 16} />
          Import Excel
          <input type="file" accept=".xlsx,.xls" onChange={handleImport} className="hidden" />
        </label>
        
        <button onClick={handleBatchEdit} className="inline-flex items-center justify-center gap-2 rounded-md border-0 px-5 py-3 text-sm font-semibold transition hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 bg-slate-200 text-slate-700" style={{
        background: selectedIds.length !== 1 ? 'lightgray' : 'orange',
        color: selectedIds.length !== 1 ? 'gray' : 'white',
        padding: isMobileView ? "10px 15px" : "12px 20px",
        fontSize: isMobileView ? "14px" : "16px",
        flex: isMobileView ? "1" : "auto",
        minWidth: isMobileView ? "100px" : "auto",
        cursor: selectedIds.length !== 1 ? "not-allowed" : "pointer"
      }} disabled={selectedIds.length !== 1}>
          Edit Selected
        </button>
        
        <button onClick={handleBatchDelete} className="inline-flex items-center justify-center gap-2 rounded-md border-0 px-5 py-3 text-sm font-semibold transition hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 bg-[#dc3545] text-white hover:bg-[#c82333]" disabled={selectedIds.length === 0} style={{
        padding: isMobileView ? "10px 15px" : "12px 20px",
        fontSize: isMobileView ? "14px" : "16px",
        flex: isMobileView ? "1" : "auto",
        minWidth: isMobileView ? "100px" : "auto",
        cursor: selectedIds.length === 0 ? "not-allowed" : "pointer"
      }}>
          Delete Selected
        </button>
      </div>


      <div style={{
      marginBottom: 20,
      display: "flex",
      gap: "10px",
      flexDirection: isMobileView ? "column" : "row",
      alignItems: isMobileView ? "stretch" : "center"
    }}>
        <div style={{
        position: "relative",
        flex: isMobileView ? "1" : "0 0 300px"
      }}>
          <FaSearch style={{
          position: "absolute",
          left: "12px",
          top: "50%",
          transform: "translateY(-50%)",
          color: "#999",
          fontSize: isMobileView ? "14px" : "16px"
        }} />
          <input placeholder="Search users..." value={search} onChange={e => setSearch(e.target.value)} style={{
          padding: isMobileView ? "10px 10px 10px 35px" : "12px 12px 12px 40px",
          width: "100%",
          borderRadius: "8px",
          border: "2px solid #d8d8d8",
          background: 'white',
          color: 'black',
          boxSizing: 'border-box',
          fontSize: isMobileView ? "14px" : "16px"
        }} />
        </div>
      </div>
      

      {showForm && <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50 p-3">
          <div className="max-h-[95vh] max-w-[95%] overflow-y-auto rounded-[12px] bg-white p-[25px] shadow-[0_10px_30px_rgba(0,0,0,0.2)]" style={{
        position: "relative",
        width: isMobileView ? "95%" : "500px",
        maxHeight: isMobileView ? "90vh" : "80vh",
        overflowY: "auto"
      }}>
            <FaTimes onClick={() => {
          setShowForm(false);
          setEditId(null);
          setFormData({});
        }} style={{
          position: "absolute",
          top: 15,
          right: 15,
          fontSize: isMobileView ? 18 : 20,
          cursor: "pointer",
          color: "#999",
          transition: "color 0.2s",
          zIndex: 1
        }} onMouseEnter={e => e.target.style.color = "#dc3545"} onMouseLeave={e => e.target.style.color = "#999"} />
            
            <h3 style={{
          marginBottom: 20,
          paddingRight: 30,
          fontSize: isMobileView ? "18px" : "20px",
          color: "#0b7a3a"
        }}>
              {editId ? "Edit User" : "Add New User"}
            </h3>
            
            <div className="flex flex-col [gap:15px]">
              {renderFormFields()}
            </div>

            <div style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: 25,
          gap: isMobileView ? "10px" : "15px"
        }}>
              <button onClick={handleAddOrEdit} className="inline-flex items-center justify-center gap-2 rounded-md border-0 px-5 py-3 text-sm font-semibold transition hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 bg-[#0b7a3a] text-white hover:bg-[#096030]" style={{
            padding: isMobileView ? "10px 20px" : "12px 24px",
            fontSize: isMobileView ? "14px" : "16px",
            flex: 1
          }}>
                {editId ? "Save Changes" : "Add User"}
              </button>
              <button onClick={() => {
            setShowForm(false);
            setEditId(null);
            setFormData({});
          }} className="inline-flex items-center justify-center gap-2 rounded-md border-0 px-5 py-3 text-sm font-semibold transition hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 bg-[#6c757d] text-white hover:bg-[#5a6268]" style={{
            background: '#6c757d',
            color: 'white',
            padding: isMobileView ? "10px 20px" : "12px 24px",
            fontSize: isMobileView ? "14px" : "16px",
            flex: 1
          }}>
                Cancel
              </button>
            </div>
          </div>
        </div>}

  
      {showDeleteConfirm && <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50 p-3">
          <div className="max-h-[95vh] max-w-[95%] overflow-y-auto rounded-[12px] bg-white p-[25px] shadow-[0_10px_30px_rgba(0,0,0,0.2)]" style={{
        width: isMobileView ? '90%' : '400px',
        maxWidth: 400,
        textAlign: "center",
        position: "relative"
      }}>
            <FaTimes onClick={() => setShowDeleteConfirm(false)} style={{
          position: "absolute",
          top: 15,
          right: 15,
          fontSize: isMobileView ? 18 : 20,
          cursor: "pointer",
          color: "#999",
          transition: "color 0.2s",
          zIndex: 1
        }} onMouseEnter={e => e.target.style.color = "#dc3545"} onMouseLeave={e => e.target.style.color = "#999"} />
            
            <h3 style={{
          color: "#d32f2f",
          marginBottom: 15,
          paddingRight: 30,
          fontSize: isMobileView ? "18px" : "20px"
        }}>
              Confirm Deletion
            </h3>
            <p style={{
          marginBottom: 20,
          fontSize: isMobileView ? "14px" : "16px"
        }}>
              Are you sure you want to delete {selectedIds.length} selected user{selectedIds.length !== 1 ? 's' : ''}?<br />
              <span className="text-[#d32f2f] font-[bold]">This action cannot be undone!</span>
            </p>
            
            <div style={{
          display: "flex",
          justifyContent: "center",
          gap: isMobileView ? "10px" : "15px",
          flexWrap: isMobileView ? "wrap" : "nowrap"
        }}>
              <button onClick={confirmBatchDelete} className="inline-flex items-center justify-center gap-2 rounded-md border-0 px-5 py-3 text-sm font-semibold transition hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 bg-[#dc3545] text-white hover:bg-[#c82333]" style={{
            padding: isMobileView ? "10px 20px" : "12px 24px",
            fontSize: isMobileView ? "14px" : "16px",
            flex: isMobileView ? "1" : "auto"
          }}>
                Yes, Delete
              </button>
              <button onClick={() => setShowDeleteConfirm(false)} className="inline-flex items-center justify-center gap-2 rounded-md border-0 px-5 py-3 text-sm font-semibold transition hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 bg-[#6c757d] text-white hover:bg-[#5a6268]" style={{
            background: '#6c757d',
            color: 'white',
            padding: isMobileView ? "10px 20px" : "12px 24px",
            fontSize: isMobileView ? "14px" : "16px",
            flex: isMobileView ? "1" : "auto"
          }}>
                Cancel
              </button>
            </div>
          </div>
        </div>}

   
      {showGeneratedQR && newUserQR && <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50 p-3">
          <div className="max-h-[95vh] max-w-[95%] overflow-y-auto rounded-[12px] bg-white p-[25px] shadow-[0_10px_30px_rgba(0,0,0,0.2)]" style={{
        width: isMobileView ? '90%' : '450px',
        maxWidth: 450,
        textAlign: "center",
        position: "relative",
        background: 'white'
      }}>
            <FaTimes onClick={() => {
          setShowGeneratedQR(false);
          setNewUserQR(null);
        }} style={{
          position: "absolute",
          top: 15,
          right: 15,
          fontSize: isMobileView ? 18 : 20,
          cursor: "pointer",
          color: "#999",
          transition: "color 0.2s",
          zIndex: 1
        }} onMouseEnter={e => e.target.style.color = "#dc3545"} onMouseLeave={e => e.target.style.color = "#999"} />
            
            <h3 style={{
          color: "#0b7a3a",
          marginBottom: 15,
          paddingRight: 30,
          fontSize: isMobileView ? "18px" : "22px"
        }}>
              User QR Code Generated!
            </h3>
            


            <div className="p-[20px] bg-[#f0f7ff] rounded-[10px] mb-[20px]">
              <QRCodeCanvas value={newUserQR.content} size={isMobileView ? 200 : 220} className="m-[0_auto] block" />

            </div>
            

            
            <div style={{
          display: "flex",
          justifyContent: "center",
          gap: isMobileView ? "10px" : "15px",
          flexWrap: isMobileView ? "wrap" : "nowrap"
        }}>
              <button onClick={() => {
            const canvas = document.createElement('canvas');
            const qrCode = new QRCodeCanvas({
              value: newUserQR.content,
              size: 300
            });
            const tempDiv = document.createElement('div');
            tempDiv.style.position = 'absolute';
            tempDiv.style.left = '-9999px';
            document.body.appendChild(tempDiv);
            const qrDiv = document.createElement('div');
            qrDiv.innerHTML = `<img src="${qrCode.toDataURL()}" />`;
            tempDiv.appendChild(qrDiv);

   
            const a = document.createElement('a');
            a.href = qrCode.toDataURL();
            a.download = `QR_${newUserQR.userData.name || 'user'}.png`;
            a.click();
            document.body.removeChild(tempDiv);
          }} className="inline-flex items-center justify-center gap-2 rounded-md border-0 px-5 py-3 text-sm font-semibold transition hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 bg-[#0b7a3a] text-white hover:bg-[#096030]" style={{
            padding: isMobileView ? "10px 20px" : "12px 24px",
            fontSize: isMobileView ? "14px" : "16px",
            flex: isMobileView ? "1" : "auto",
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
                <FaDownload /> Download QR
              </button>
              <button onClick={() => {
            setShowGeneratedQR(false);
            setNewUserQR(null);
          }} className="inline-flex items-center justify-center gap-2 rounded-md border-0 px-5 py-3 text-sm font-semibold transition hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 bg-[#6c757d] text-white hover:bg-[#5a6268]" style={{
            background: '#6c757d',
            color: 'white',
            padding: isMobileView ? "10px 20px" : "12px 24px",
            fontSize: isMobileView ? "14px" : "16px",
            flex: isMobileView ? "1" : "auto"
          }}>
                Close
              </button>
            </div>
          </div>
        </div>}


      {!isMobileView && !loading && <div className="mt-[10px] w-full overflow-x-auto rounded-[8px] border border-[#ddd] bg-white text-black shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
          <table className="w-full [border-collapse:collapse] min-w-[800px] text-[14px]">
            <thead>
              <tr className="bg-[#0b7a3a] text-white">
                <th className="p-[12px_15px] [border-bottom:2px_solid_#ccc] w-[50px] text-center">
                  <input type="checkbox" onChange={handleSelectAll} checked={selectedIds.length > 0 && selectedIds.length === filteredRecords.length} className="[transform:scale(1.2)] [accent-color:white] bg-[#0b7a3a] [border:1px_solid_white] cursor-pointer" />
                </th>
                {filteredColumns.map(col => <th key={col} className="p-[12px_15px] text-left [border-bottom:2px_solid_#ccc] whitespace-nowrap font-[bold]">
                    {columnHeaderMap[col] || col.replace(/^.*_/, "").toUpperCase()}
                  </th>)}
                <th className="p-[12px_15px] [border-bottom:2px_solid_#ccc] whitespace-nowrap font-[bold]">
                  QR Code
                </th>
                <th className="p-[12px_15px] [border-bottom:2px_solid_#ccc] whitespace-nowrap font-[bold]">
                  Password
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map((row, idx) => <tr key={row.id || idx} style={{
            borderBottom: "1px solid #e0e0e0",
            background: selectedIds.includes(row.id) ? '#e0f7fa' : idx % 2 === 0 ? '#f9f9f9' : 'white',
            transition: "background 0.2s ease"
          }}>
                  <td className="p-[10px_15px] text-center">
                    <input type="checkbox" checked={selectedIds.includes(row.id)} onChange={() => handleSelectOne(row.id)} className="[transform:scale(1.2)] [accent-color:#0b7a3a] cursor-pointer" />
                  </td>
                  
                  {filteredColumns.map(col => <td key={col} className="p-[10px_15px] whitespace-nowrap">
                      <span style={{
                maxWidth: col.includes('name') ? "200px" : "auto",
                display: "inline-block",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap"
              }}>
                        {row[col] || '-'}
                      </span>
                    </td>)}

                  <td className="p-[10px_15px] text-center">
                    <button onClick={() => setShowQRIndex(showQRIndex === idx ? null : idx)} className="inline-flex items-center justify-center gap-2 rounded-md border-0 px-5 py-3 text-sm font-semibold transition hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 bg-[#0b7a3a] text-white hover:bg-[#096030] px-2.5 py-1 text-xs" style={{
                padding: '6px 12px',
                fontSize: '12px',
                background: showQRIndex === idx ? '#666' : '#0b7a3a',
                color: 'white'
              }}>
                      {showQRIndex === idx ? "Hide" : "Show QR"}
                    </button>
                  </td>
                  
                  <td className="p-[10px_15px] text-center">
                    <div className="flex flex-wrap items-center justify-center gap-2">
                      <span className="min-w-20 break-all font-mono text-[13px] font-medium tracking-[1px] text-[#0b7a3a]">
                        {visiblePasswords[row.id ?? idx] ? row.password || "—" : "••••••••"}
                      </span>
                      <button type="button" onClick={() => togglePasswordVisibility(row.id ?? idx)} className="inline-flex items-center justify-center rounded border border-[#0b7a3a] bg-transparent px-2 py-1 text-[13px] text-[#0b7a3a] transition hover:bg-[#0b7a3a] hover:text-white" title={visiblePasswords[row.id ?? idx] ? "Hide password" : "Show password"}>
                        {visiblePasswords[row.id ?? idx] ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </div>
                  </td>
                  
                </tr>)}

              {filteredRecords.length === 0 && <tr>
                  <td colSpan={filteredColumns.length + 3} className="text-center p-[40px_12px] text-[#666] text-[16px]">
                    {loading ? "Loading users..." : "No users found. Click 'Add User' to create new records."}
                  </td>
                </tr>}
            </tbody>
          </table>
        </div>}


      {loading && !isMobileView && <div className="text-center p-[40px_12px] text-[#666] text-[16px] bg-white rounded-[8px] [border:1px_solid_#ddd]">
          Loading users...
        </div>}


      {isMobileView && <div className="mt-[10px]">
          {loading ? <div className="text-center p-[40px_20px] text-[#666] text-[16px] bg-white rounded-[8px] [border:1px_solid_#ddd]">
              Loading users...
            </div> : filteredRecords.length === 0 ? <div className="text-center p-[40px_20px] text-[#666] text-[16px] bg-white rounded-[8px] [border:1px_solid_#ddd]">
              No users found. Click "Add User" to create new records.
            </div> : <div>
              <div className="mb-[15px] flex justify-between items-center">
                <div className="text-[14px] text-[#666]">
                  Showing {filteredRecords.length} user{filteredRecords.length !== 1 ? 's' : ''}
                </div>
                <div className="text-[14px] font-[bold] text-[#0b7a3a]">
                  Selected: {selectedIds.length}
                </div>
              </div>
              
              <div>
                {filteredRecords.map((row, idx) => renderMobileCard(row, idx))}
              </div>
            </div>}
        </div>}



    {showQRIndex !== null && filteredRecords[showQRIndex] && <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50 p-3">
    <div className="max-h-[95vh] max-w-[95%] overflow-y-auto rounded-[12px] bg-white p-[25px] shadow-[0_10px_30px_rgba(0,0,0,0.2)]" style={{
        width: isMobileView ? '85%' : '400px',
        maxWidth: 400,
        textAlign: "center",
        position: "relative"
      }}>
      <FaTimes onClick={() => setShowQRIndex(null)} style={{
          position: "absolute",
          top: isMobileView ? "8px" : "10px",
          right: isMobileView ? "8px" : "10px",
          fontSize: isMobileView ? 16 : 18,
          cursor: "pointer",
          color: "#999",
          transition: "color 0.2s"
        }} onMouseEnter={e => e.target.style.color = "#dc3545"} onMouseLeave={e => e.target.style.color = "#999"} />
      
      <h5 style={{
          marginTop: 10,
          marginBottom: 15,
          fontSize: isMobileView ? "16px" : "18px",
          color: "#0b7a3a",
          fontWeight: "bold"
        }}>
        User QR Code ({category})
      </h5>
      
    
      
      <QRCodeCanvas value={getQrValue(filteredRecords[showQRIndex])} size={isMobileView ? 180 : 200} ref={el => qrRefs.current[showQRIndex] = el} className="m-[15px_auto] [border:5px_solid_white] [box-shadow:0_4px_8px_rgba(0,0,0,0.1)]" />
      

      
      <div style={{
          marginTop: 20,
          display: 'flex',
          justifyContent: 'space-around',
          gap: isMobileView ? "10px" : "15px"
        }}>
        <button className="inline-flex items-center justify-center gap-2 rounded-md border-0 px-5 py-3 text-sm font-semibold transition hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 bg-[#0b7a3a] text-white hover:bg-[#096030] px-2.5 py-1 text-xs" onClick={() => {
            const canvas = qrRefs.current[showQRIndex];
            if (canvas) {
              const url = canvas.toDataURL("image/png");
              const a = document.createElement("a");
              a.href = url;
              const user = filteredRecords[showQRIndex];
              let filename = "";
              switch (category) {
                case "college":
                  filename = `College_${user.c_id}_${user.c_name.replace(/\s+/g, '_')}`;
                  break;
                case "seniorHigh":
                  filename = `SeniorHigh_${user.s_id}_${user.s_name.replace(/\s+/g, '_')}`;
                  break;
                case "juniorHigh":
                  filename = `JuniorHigh_${user.j_id}_${user.j_name.replace(/\s+/g, '_')}`;
                  break;
                case "elementary":
                  filename = `Elementary_${user.e_id}_${user.e_name.replace(/\s+/g, '_')}`;
                  break;
                case "teacher":
                  filename = `Teacher_${user.t_id}_${user.t_name.replace(/\s+/g, '_')}`;
                  break;
                case "instructor":
                  filename = `Instructor_${user.i_id}_${user.i_name.replace(/\s+/g, '_')}`;
                  break;
                default:
                  filename = `qrcode_${user.id}`;
              }
              a.download = `${filename}_qrcode.png`;
              a.click();
            }
          }} style={{
            padding: isMobileView ? "8px 12px" : "10px 15px",
            fontSize: isMobileView ? "12px" : "14px",
            display: "flex",
            alignItems: "center",
            gap: "5px"
          }}>
          <FaDownload size={isMobileView ? 12 : 14} />
          Download
        </button>
        <button className="inline-flex items-center justify-center gap-2 rounded-md border-0 px-5 py-3 text-sm font-semibold transition hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 bg-[#6c757d] text-white hover:bg-[#5a6268] px-2.5 py-1 text-xs" style={{
            background: '#6c757d',
            color: 'white',
            padding: isMobileView ? "8px 12px" : "10px 15px",
            fontSize: isMobileView ? "12px" : "14px"
          }} onClick={() => setShowQRIndex(null)}>
          Close
        </button>
      </div>
    </div>
  </div>}
      <PasswordModal />
      <ResetPasswordModal />
    </div>;
}
export default UserManagement;
