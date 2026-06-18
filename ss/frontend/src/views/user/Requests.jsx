import React, { useState, useContext, useEffect } from "react";
import api from "../../services/api";
import { AuthContext } from "../../context/AuthContext";
import { FaHistory, FaFileAlt, FaSpinner, FaSync, FaPaperPlane } from "react-icons/fa";
function Request() {
  const {
    user
  } = useContext(AuthContext);
  const [requestType, setRequestType] = useState("");
  const [formData, setFormData] = useState({
    new_program: "",
    new_year: "",
    new_block: "",
    new_section: "",
    new_gradelevel: "",
    new_teacherlevel: "",
    new_instructorlevel: "",
    reason: ""
  });
  const [myRequests, setMyRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [normalizedRole, setNormalizedRole] = useState("");
  const [errorDetails, setErrorDetails] = useState("");
  const collegePrograms = ["BSIT", "BSBA", "BSCRIM", "BSED", "BSOA"];
  const seniorPrograms = ["STEM", "HUMSS", "ABM", "GAS"];
  const juniorPrograms = ["7", "8", "9", "10"];
  const elementaryPrograms = ["1", "2", "3", "4", "5", "6"];
  const years = ["1", "2", "3", "4"];
  const blocks = [..."ABCDEFGHIJKLMNOPQRSTUVWXYZ"];
  const gradeLevels = [11, 12];
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
    if (category === "junior") {
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
    if (category === "senior") {
      if (strand === "HUMSS" || strand === "STEM") {
        return ["A", "B"];
      }
      return ["A", "B"];
    }
    return blocks;
  };
  const teacherLevels = ["Elementary Teacher", "Junior Teacher", "Senior Teacher"];
  const instructorLevels = ["BSIT Instructor", "BSBA Instructor", "BSED Instructor", "BSCRIM Instructor", "BSOA Instructor"];
  useEffect(() => {
    if (user) {
      console.log("=== USER DEBUG ===");
      console.log("Full user object:", JSON.stringify(user, null, 2));
      const rawRole = user.role || "";
      console.log("Raw role:", rawRole);
      let normalized = "";
      if (rawRole) {
        const roleStr = rawRole.toString().toLowerCase().trim();
        if (roleStr === 'g' || roleStr === 'college' || roleStr === 'g') {
          normalized = 'college';
          console.log("✓ Mapped to college");
        } else if (roleStr.includes('senior') || roleStr === 's' || roleStr === 'seniorhigh') {
          normalized = 'senior';
        } else if (roleStr.includes('junior') || roleStr === 'j' || roleStr === 'juniorhigh') {
          normalized = 'junior';
        } else if (roleStr.includes('elementary') || roleStr === 'e') {
          normalized = 'elementary';
        } else if (roleStr.includes('teacher') || roleStr === 't') {
          normalized = 'teacher';
        } else if (roleStr.includes('instructor') || roleStr === 'i') {
          normalized = 'instructor';
        } else {
          normalized = roleStr;
        }
      }
      console.log("✓ Normalized role (backend format):", normalized);
      console.log("✓ Valid backend categories: ['college', 'senior', 'junior', 'elementary', 'teacher', 'instructor']");
      setNormalizedRole(normalized);
    }
  }, [user]);
  useEffect(() => {
    if (user && user.id && normalizedRole) {
      fetchMyRequests();
    }
  }, [user, normalizedRole]);
  const fetchMyRequests = async () => {
    try {
      setLoading(true);
      const res = await api.get('/requests/my-requests', {
        params: {
          user_id: user.id,
          user_category: normalizedRole
        }
      });
      setMyRequests(res.data);
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };
  const getRequestOptions = () => {
    if (!normalizedRole) return [];
    if (normalizedRole === "college") {
      return ["Change Program, Year & Block"];
    } else if (normalizedRole === "senior") {
      return ["Change Strand, Grade Level and Section"];
    } else if (normalizedRole === "junior") {
      return ["Change Grade Level & Section"];
    } else if (normalizedRole === "elementary") {
      return ["Change Grade Level & Section"];
    } else if (normalizedRole === "teacher") {
      return ["Change Position"];
    } else if (normalizedRole === "instructor") {
      return ["Change Position"];
    }
    return [];
  };
  const handleSubmit = async () => {
    console.log("=== SUBMIT REQUEST DEBUG ===");
    setErrorDetails("");
    if (!user) {
      alert("User not found. Please login again.");
      return;
    }
    console.log(" User object:", JSON.stringify(user, null, 2));
    console.log(" User ID:", user.id);
    console.log(" Raw role:", user.role);
    console.log(" Normalized role for backend:", normalizedRole);
    console.log(" Request type:", requestType);
    console.log("Form data:", formData);
    const validCategories = ['college', 'senior', 'junior', 'elementary', 'teacher', 'instructor'];
    if (!validCategories.includes(normalizedRole)) {
      alert(`Invalid category: "${normalizedRole}". Backend expects one of: ${validCategories.join(', ')}`);
      return;
    }
    let userId = user.id;
    let expectedIdField = '';
    switch (normalizedRole) {
      case 'college':
        expectedIdField = 'c_id';
        break;
      case 'senior':
        expectedIdField = 's_id';
        break;
      case 'junior':
        expectedIdField = 'j_id';
        break;
      case 'elementary':
        expectedIdField = 'e_id';
        break;
      case 'teacher':
        expectedIdField = 't_id';
        break;
      case 'instructor':
        expectedIdField = 'i_id';
        break;
    }
    console.log(" Expected ID field:", expectedIdField);
    console.log("User ID:", userId);
    let requestPayload = {
      user_id: userId,
      user_name: user.name || `${user.firstname || ''} ${user.lastname || ''}`.trim(),
      user_category: normalizedRole,
      request_data: {
        reason: formData.reason.trim()
      }
    };
    console.log("📦 Base payload:", requestPayload);
    try {
      switch (normalizedRole) {
        case "college":
          if (!formData.new_program || !formData.new_year || !formData.new_block) {
            alert("Please select program, year, and block");
            return;
          }
          requestPayload.request_data.new_program = formData.new_program;
          const yearBlock = `${formData.new_year}-${formData.new_block}`;
          requestPayload.request_data.new_year_block = yearBlock;
          console.log("✓ Added new_program:", formData.new_program);
          console.log("✓ Added new_year_block:", yearBlock);
          break;
        case "senior":
          if (!formData.new_program || !formData.new_gradelevel || !formData.new_section) {
            alert("Please select strand, grade level, and section");
            return;
          }
          requestPayload.request_data.new_program = formData.new_program;
          requestPayload.request_data.new_gradelevel = parseInt(formData.new_gradelevel);
          requestPayload.request_data.new_section = formData.new_section;
          console.log("✓ Added new_program (strand):", formData.new_program);
          console.log("✓ Added new_gradelevel:", formData.new_gradelevel);
          console.log("✓ Added new_section:", formData.new_section);
          break;
        case "junior":
          if (!formData.new_program || !formData.new_section) {
            alert("Please select grade level and section");
            return;
          }
          requestPayload.request_data.new_program = formData.new_program;
          requestPayload.request_data.new_section = formData.new_section;
          console.log("✓ Added new_program (grade):", formData.new_program);
          console.log("✓ Added new_section:", formData.new_section);
          break;
        case "elementary":
          if (!formData.new_program || !formData.new_section) {
            alert("Please select grade level and section");
            return;
          }
          requestPayload.request_data.new_program = formData.new_program;
          requestPayload.request_data.new_section = formData.new_section;
          console.log("✓ Added new_program (grade):", formData.new_program);
          console.log("✓ Added new_section:", formData.new_section);
          break;
        case "teacher":
          if (!formData.new_teacherlevel) {
            alert("Please select a new teacher level");
            return;
          }
          requestPayload.request_data.new_teacherlevel = formData.new_teacherlevel;
          console.log("✓ Added new_teacherlevel:", formData.new_teacherlevel);
          break;
        case "instructor":
          if (!formData.new_instructorlevel) {
            alert("Please select a new instructor level");
            return;
          }
          requestPayload.request_data.new_instructorlevel = formData.new_instructorlevel;
          console.log("✓ Added new_instructorlevel:", formData.new_instructorlevel);
          break;
      }
      console.log("FINAL PAYLOAD TO SEND");
      console.log(JSON.stringify(requestPayload, null, 2));
      setSubmitting(true);
      console.log("Sending request to:", "/requests/request");
      const res = await api.post("/requests/request", requestPayload, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      console.log(" Success response:", res.data);
      alert(" Request submitted successfully!");
      setRequestType("");
      setFormData({
        new_program: "",
        new_year: "",
        new_block: "",
        new_section: "",
        new_gradelevel: "",
        new_teacherlevel: "",
        new_instructorlevel: "",
        reason: ""
      });
      fetchMyRequests();
    } catch (err) {
      console.error("ERROR SUBMITTING REQUEST");
      console.error("Full error:", err);
      console.error("Error response:", err.response);
      if (err.response) {
        console.error("Status:", err.response.status);
        console.error("Headers:", err.response.headers);
        console.error("Data:", JSON.stringify(err.response.data, null, 2));
      }
      let errorMessage = "Failed to submit request. Please try again.";
      let detailedError = "";
      if (err.response?.data) {
        if (err.response.data.message) {
          errorMessage = err.response.data.message;
        }
        if (err.response.data.error) {
          detailedError += `Error: ${err.response.data.error}\n`;
        }
        if (err.response.data.details) {
          detailedError += `Details: ${JSON.stringify(err.response.data.details, null, 2)}\n`;
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      setErrorDetails(detailedError || JSON.stringify({
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      }, null, 2));
      alert(`Error: ${errorMessage}\n\nCheck console for details.`);
    } finally {
      setSubmitting(false);
    }
  };
  const getStatusBadge = status => {
    const styles = {
      pending: {
        background: '#fef3c7',
        color: '#92400e'
      },
      approved: {
        background: '#d1fae5',
        color: '#065f46'
      },
      rejected: {
        background: '#fee2e2',
        color: '#991b1b'
      }
    };
    return <span style={{
      padding: '4px 8px',
      borderRadius: '12px',
      fontSize: '12px',
      fontWeight: '600',
      ...styles[status]
    }}>
        {status ? status.toUpperCase() : 'PENDING'}
      </span>;
  };
  const getRequestDetails = req => {
    if (!normalizedRole) return 'No changes specified';
    switch (normalizedRole) {
      case "college":
        let collegeChanges = [];
        if (req.new_program && req.new_program !== req.old_program) {
          collegeChanges.push(`Program: ${req.old_program || 'N/A'} → ${req.new_program}`);
        }
        if (req.new_year_block && req.new_year_block !== req.old_year_block) {
          collegeChanges.push(`Year/Block: ${req.old_year_block || 'N/A'} → ${req.new_year_block}`);
        }
        return collegeChanges.length > 0 ? collegeChanges.join(', ') : 'No changes specified';
      case "senior":
        let seniorChanges = [];
        if (req.new_program && req.new_program !== req.old_program) {
          seniorChanges.push(`Strand: ${req.old_program || 'N/A'} → ${req.new_program}`);
        }
        if (req.new_gradelevel && req.new_gradelevel !== req.old_gradelevel) {
          seniorChanges.push(`Grade: ${req.old_gradelevel || 'N/A'} → ${req.new_gradelevel}`);
        }
        if (req.new_section && req.new_section !== req.old_section) {
          seniorChanges.push(`Section: ${req.old_section || 'N/A'} → ${req.new_section}`);
        }
        return seniorChanges.length > 0 ? seniorChanges.join(', ') : 'No changes specified';
      case "junior":
        let juniorChanges = [];
        if (req.new_program && req.new_program !== req.old_program) {
          juniorChanges.push(`Grade: ${req.old_program || 'N/A'} → ${req.new_program}`);
        }
        if (req.new_section && req.new_section !== req.old_section) {
          juniorChanges.push(`Section: ${req.old_section || 'N/A'} → ${req.new_section}`);
        }
        return juniorChanges.length > 0 ? juniorChanges.join(', ') : 'No changes specified';
      case "elementary":
        let elemChanges = [];
        if (req.new_program && req.new_program !== req.old_program) {
          elemChanges.push(`Grade: ${req.old_program || 'N/A'} → ${req.new_program}`);
        }
        if (req.new_section && req.new_section !== req.old_section) {
          elemChanges.push(`Section: ${req.old_section || 'N/A'} → ${req.new_section}`);
        }
        return elemChanges.length > 0 ? elemChanges.join(', ') : 'No changes specified';
      case "teacher":
        if (req.new_teacherlevel && req.new_teacherlevel !== req.old_teacherlevel) {
          return `Level: ${req.old_teacherlevel || 'N/A'} → ${req.new_teacherlevel}`;
        }
        return 'No changes specified';
      case "instructor":
        if (req.new_instructorlevel && req.new_instructorlevel !== req.old_instructorlevel) {
          return `Level: ${req.old_instructorlevel || 'N/A'} → ${req.new_instructorlevel}`;
        }
        return 'No changes specified';
      default:
        return 'No changes specified';
    }
  };
  const showUserInfo = () => {
    if (!user) return null;
    let currentInfo = [];
    switch (normalizedRole) {
      case "college":
        currentInfo.push({
          label: "ID",
          value: user.c_id || user.id
        }, {
          label: "Name",
          value: user.c_name || user.name
        }, {
          label: "Program",
          value: user.c_program
        }, {
          label: "Year/Block",
          value: user.c_year_block
        });
        break;
      case "senior":
        currentInfo.push({
          label: "ID",
          value: user.s_id || user.id
        }, {
          label: "Name",
          value: user.s_name || user.name
        }, {
          label: "Strand",
          value: user.s_program
        }, {
          label: "Grade Level",
          value: user.s_gradelevel
        }, {
          label: "Section",
          value: user.s_section
        });
        break;
      case "junior":
        currentInfo.push({
          label: "ID",
          value: user.j_id || user.id
        }, {
          label: "Name",
          value: user.j_name || user.name
        }, {
          label: "Grade Level",
          value: user.j_program
        }, {
          label: "Section",
          value: user.j_section
        });
        break;
      case "elementary":
        currentInfo.push({
          label: "ID",
          value: user.e_id || user.id
        }, {
          label: "Name",
          value: user.e_name || user.name
        }, {
          label: "Grade Level",
          value: user.e_program
        }, {
          label: "Section",
          value: user.e_section
        });
        break;
      case "teacher":
        currentInfo.push({
          label: "ID",
          value: user.t_id || user.id
        }, {
          label: "Name",
          value: user.t_name || user.name
        }, {
          label: "Level",
          value: user.t_teacherlevel
        });
        break;
      case "instructor":
        currentInfo.push({
          label: "ID",
          value: user.i_id || user.id
        }, {
          label: "Name",
          value: user.i_name || user.name
        }, {
          label: "Level",
          value: user.i_instructorlevel
        });
        break;
      default:
        currentInfo.push({
          label: "ID",
          value: user.id
        }, {
          label: "Name",
          value: user.name
        });
    }
  };
  const renderFormFields = () => {
    if (!requestType || !normalizedRole) return null;
    const fields = [];
    if (normalizedRole === "college") {
      fields.push(<div key="college-program" className="mb-[20px]">
          <label className="block mb-[8px] font-semibold text-[#2d3748] text-[14px]">New Program</label>
          <select value={formData.new_program} onChange={e => setFormData({
          ...formData,
          new_program: e.target.value
        })} className="w-full p-[10px_12px] rounded-[6px] text-[#2d3748] [border:1px_solid_#cbd5e0] text-[14px] bg-[white]">
            <option value="">Select Program</option>
            {collegePrograms.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>);
      fields.push(<div key="college-year-block" className="mb-[20px]">
          <label className="block mb-[8px] font-semibold text-[#2d3748] text-[14px]">New Year & Block</label>
          <div className="flex [gap:10px] flex-wrap">
            <select value={formData.new_year} onChange={e => setFormData({
            ...formData,
            new_year: e.target.value
          })} className="[flex:1] min-w-[120px] p-[10px_12px] text-[#2d3748] rounded-[6px] [border:1px_solid_#cbd5e0] text-[14px] bg-[white]">
              <option value="">Year</option>
              {years.map(y => <option key={y} value={y}>{y} Year</option>)}
            </select>
            <select value={formData.new_block} onChange={e => setFormData({
            ...formData,
            new_block: e.target.value
          })} className="[flex:1] min-w-[120px] p-[10px_12px] rounded-[6px] text-[#2d3748] [border:1px_solid_#cbd5e0] text-[14px] bg-[white]">
              <option value="">Block</option>
              {blocks.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
        </div>);
    }
    if (normalizedRole === "senior") {
      fields.push(<div key="senior-strand" className="mb-[20px]">
          <label className="block mb-[8px] font-semibold text-[#2d3748] text-[14px]">New Strand</label>
          <select value={formData.new_program} onChange={e => setFormData({
          ...formData,
          new_program: e.target.value
        })} className="w-full p-[10px_12px] rounded-[6px] text-[#2d3748] [border:1px_solid_#cbd5e0] text-[14px] bg-[white]">
            <option value="">Select Strand</option>
            {seniorPrograms.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>);
      fields.push(<div key="senior-grade" className="mb-[20px]">
          <label className="block mb-[8px] font-semibold text-[#2d3748] text-[14px]">New Grade Level</label>
          <select value={formData.new_gradelevel} onChange={e => setFormData({
          ...formData,
          new_gradelevel: e.target.value
        })} className="w-full p-[10px_12px] rounded-[6px] text-[#2d3748] [border:1px_solid_#cbd5e0] text-[14px] bg-[white]">
            <option value="">Select Grade Level</option>
            {gradeLevels.map(g => <option key={g} value={g}>Grade {g}</option>)}
          </select>
        </div>);
      fields.push(<div key="senior-section" className="mb-[20px]">
          <label className="block mb-[8px] font-semibold text-[#2d3748] text-[14px]">New Section</label>
          <select value={formData.new_section} onChange={e => setFormData({
          ...formData,
          new_section: e.target.value
        })} className="w-full p-[10px_12px] rounded-[6px] text-[#2d3748] [border:1px_solid_#cbd5e0] text-[14px] bg-[white]">
            <option value="">Select Section</option>
            {getSections("senior", formData.new_gradelevel, formData.new_program).map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>);
    }
    if (normalizedRole === "junior") {
      fields.push(<div key="junior-grade" className="mb-[20px]">
          <label className="block mb-[8px] font-semibold text-[#2d3748] text-[14px]">New Grade Level</label>
          <select value={formData.new_program} onChange={e => setFormData({
          ...formData,
          new_program: e.target.value
        })} className="w-full p-[10px_12px] rounded-[6px] text-[#2d3748] [border:1px_solid_#cbd5e0] text-[14px] bg-[white]">
            <option value="">Select Grade Level</option>
            {juniorPrograms.map(g => <option key={g} value={g}>Grade {g}</option>)}
          </select>
        </div>);
      fields.push(<div key="junior-section" className="mb-[20px]">
          <label className="block mb-[8px] font-semibold text-[#2d3748] text-[14px]">New Section</label>
          <select value={formData.new_section} onChange={e => setFormData({
          ...formData,
          new_section: e.target.value
        })} className="w-full p-[10px_12px] rounded-[6px] text-[#2d3748] [border:1px_solid_#cbd5e0] text-[14px] bg-[white]">
            <option value="">Select Section</option>
            {getSections("junior", formData.new_program).map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>);
    }
    if (normalizedRole === "elementary") {
      fields.push(<div key="elementary-grade" className="mb-[20px]">
          <label className="block mb-[8px] font-semibold text-[#2d3748] text-[14px]">New Grade Level</label>
          <select value={formData.new_program} onChange={e => setFormData({
          ...formData,
          new_program: e.target.value
        })} className="w-full p-[10px_12px] rounded-[6px] text-[#2d3748] [border:1px_solid_#cbd5e0] text-[14px] bg-[white]">
            <option value="">Select Grade Level</option>
            {elementaryPrograms.map(g => <option key={g} value={g}>Grade {g}</option>)}
          </select>
        </div>);
      fields.push(<div key="elementary-section" className="mb-[20px]">
          <label className="block mb-[8px] font-semibold text-[#2d3748] text-[14px]">New Section</label>
          <select value={formData.new_section} onChange={e => setFormData({
          ...formData,
          new_section: e.target.value
        })} className="w-full p-[10px_12px] rounded-[6px] text-[#2d3748] [border:1px_solid_#cbd5e0] text-[14px] bg-[white]">
            <option value="">Select Section</option>
            {getSections("elementary", formData.new_program).map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>);
    }

    // Teacher: Change Position
    if (normalizedRole === "teacher") {
      fields.push(<div key="teacher-level" className="mb-[20px]">
          <label className="block mb-[8px] font-semibold text-[#2d3748] text-[14px]">New Position</label>
          <select value={formData.new_teacherlevel} onChange={e => setFormData({
          ...formData,
          new_teacherlevel: e.target.value
        })} className="w-full p-[10px_12px] rounded-[6px] text-[#2d3748] [border:1px_solid_#cbd5e0] text-[14px] bg-[white]">
            <option value="">Select Position</option>
            {teacherLevels.map(level => <option key={level} value={level}>{level}</option>)}
          </select>
        </div>);
    }
    if (normalizedRole === "instructor") {
      fields.push(<div key="instructor-level" className="mb-[20px]">
          <label className="block mb-[8px] font-semibold text-[#2d3748] text-[14px]">New Position</label>
          <select value={formData.new_instructorlevel} onChange={e => setFormData({
          ...formData,
          new_instructorlevel: e.target.value
        })} className="w-full p-[10px_12px] rounded-[6px] text-[#2d3748] [border:1px_solid_#cbd5e0] text-[14px] bg-[white]">
            <option value="">Select Position</option>
            {instructorLevels.map(level => <option key={level} value={level}>{level}</option>)}
          </select>
        </div>);
    }
    fields.push(<div key="reason" className="mb-[20px]">
        <label className="block mb-[8px] font-semibold text-[#2d3748] text-[14px]">Reason (Required)</label>
        <textarea value={formData.reason} onChange={e => setFormData({
        ...formData,
        reason: e.target.value
      })} placeholder="Explain why you need this change..." rows={4} className="w-full p-[10px_12px] rounded-[6px] [border:1px_solid_#cbd5e0] text-[14px] resize-y text-[#2d3748] bg-[white] [font-family:inherit]" />
      </div>);
    return fields;
  };
  return <div className="p-[20px] max-w-[1200px] m-[0_auto] w-full [box-sizing:border-box]">
      <div className="mb-[30px]">
        <h1 className="text-[24px] font-bold text-[#1a202c] mb-[8px]">
           Requests
        </h1>
      </div>

      {showUserInfo()}

      <div className="flex flex-col [gap:30px]">
        <div className="bg-white rounded-[12px] [box-shadow:0_4px_6px_rgba(0,0,0,0.1)] overflow-hidden">
          <div className="p-[20px_25px] [border-bottom:1px_solid_#e2e8f0]">
            <h2 className="text-[18px] font-semibold text-[#1a202c] m-0 flex items-center [gap:10px]">
              <FaPaperPlane className="text-[#0b7a3a]" />
              Submit Request
            </h2>
          </div>
          
          <div className="p-[25px]">
            <div className="bg-[#0b7a3a] text-white p-[12px_15px] rounded-[8px] font-semibold mb-[20px] text-[14px]">
              Request Type ({normalizedRole ? normalizedRole.toUpperCase() : 'Select Type'})
            </div>

            <div className="mb-[25px]">
              <select value={requestType} onChange={e => {
              setRequestType(e.target.value);
              setFormData({
                new_program: "",
                new_year: "",
                new_block: "",
                new_section: "",
                new_gradelevel: "",
                new_teacherlevel: "",
                new_instructorlevel: "",
                reason: formData.reason
              });
            }} onFocus={e => e.target.style.borderColor = '#0b7a3a'} onBlur={e => e.target.style.borderColor = '#e2e8f0'} className="w-full p-[12px] rounded-[8px] [border:2px_solid_#e2e8f0] text-[14px] text-[#1a202c] bg-white [box-sizing:border-box] cursor-pointer outline-none [transition:border-color_0.2s]">
                <option value="">Select Request Type</option>
                {getRequestOptions().map(opt => <option key={opt} value={opt}>
                    {opt}
                  </option>)}
              </select>
            </div>

            {renderFormFields()}

            <button onClick={handleSubmit} disabled={!requestType || !formData.reason.trim() || submitting || !normalizedRole} style={{
            width: "100%",
            padding: "14px",
            background: !requestType || !formData.reason.trim() || submitting || !normalizedRole ? "#cbd5e0" : "#0b7a3a",
            color: "white",
            border: "none",
            borderRadius: "8px",
            fontSize: "16px",
            fontWeight: "600",
            cursor: !requestType || !formData.reason.trim() || submitting || !normalizedRole ? "not-allowed" : "pointer",
            marginTop: "10px",
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            transition: 'all 0.2s'
          }} onMouseEnter={e => {
            if (!(!requestType || !formData.reason.trim() || submitting || !normalizedRole)) {
              e.target.style.background = '#0a6934';
            }
          }} onMouseLeave={e => {
            if (!(!requestType || !formData.reason.trim() || submitting || !normalizedRole)) {
              e.target.style.background = '#0b7a3a';
            }
          }}>
              {submitting ? <>
                  <FaSpinner className="animate-spin" />
                  Submitting...
                </> : <>
                  <FaPaperPlane />
                  Submit Request
                </>}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-[12px] [box-shadow:0_4px_6px_rgba(0,0,0,0.1)] overflow-hidden">
          <div className="p-[20px_25px] [border-bottom:1px_solid_#e2e8f0] flex justify-between items-center flex-wrap [gap:10px]">
            <h2 className="text-[18px] font-semibold text-[#1a202c] m-0 flex items-center [gap:10px]">
              <FaHistory className="text-[#0b7a3a]" />
              My Requests History
            </h2>
            <button onClick={fetchMyRequests} disabled={loading} style={{
            padding: '8px 16px',
            background: '#edf2f7',
            border: '1px solid #cbd5e0',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.2s'
          }} onMouseEnter={e => {
            if (!loading) e.target.style.background = '#e2e8f0';
          }} onMouseLeave={e => {
            if (!loading) e.target.style.background = '#edf2f7';
          }}>
              {loading ? <FaSpinner className="animate-spin" /> : <FaSync />}
              Refresh
            </button>
          </div>
          
          <div className="p-[25px]">
            {loading ? <div className="text-center p-[40px]">
                <FaSpinner className="text-[24px] text-[#0b7a3a] animate-spin mb-[10px]" />
                <p className="text-[#666]">Loading requests...</p>
              </div> : myRequests.length === 0 ? <div className="text-center p-[40px] text-[#666]">
                <FaFileAlt className="text-[48px] text-[#cbd5e0] mb-[15px]" />
                <p className="mb-[5px] font-medium">No requests submitted yet.</p>
                <p className="text-[14px] text-[#a0aec0]">Submit your first request using the form above</p>
              </div> : <div className="max-h-[500px] overflow-y-auto rounded-[8px] [border:1px_solid_#e2e8f0]">
                <table className="w-full [border-collapse:collapse] min-w-[600px]">
                  <thead>
                    <tr className="bg-[#f8fafc]">
                      <th className="p-[15px] text-left font-semibold text-[13px] text-[#4a5568] [border-bottom:1px_solid_#e2e8f0]">Date</th>
                      <th className="p-[15px] text-left font-semibold text-[13px] text-[#4a5568] [border-bottom:1px_solid_#e2e8f0]">Changes</th>
                      <th className="p-[15px] text-left font-semibold text-[13px] text-[#4a5568] [border-bottom:1px_solid_#e2e8f0]">Status</th>
                      <th className="p-[15px] text-left font-semibold text-[13px] text-[#4a5568] [border-bottom:1px_solid_#e2e8f0]">Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myRequests.map((req, index) => <tr key={req.id || index} style={{
                  borderBottom: '1px solid #e2e8f0',
                  background: index % 2 === 0 ? 'white' : '#f8fafc'
                }}>
                        <td className="p-[15px] text-[13px] whitespace-nowrap text-[#4a5568]">
                          {req.createdAt ? new Date(req.createdAt).toLocaleDateString('en-PH', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    }) : 'N/A'}
                        </td>
                        <td className="p-[15px] text-[13px] [word-break:break-word] text-[#1a202c]">
                          <div className="font-medium mb-[5px]">{getRequestDetails(req)}</div>
                        </td>
                        <td className="p-[15px]">
                          {getStatusBadge(req.status)}
                        </td>
                        <td className="p-[15px] text-[13px] [word-break:break-word] text-[#666]">
                          {req.reason || 'Not specified'}
                        </td>
                      </tr>)}
                  </tbody>
                </table>
              </div>}
          </div>
        </div>
      </div>

      
    </div>;
}
export default Request;
