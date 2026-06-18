import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../../services/api';
import { FaFilter, FaDownload, FaSearch, FaCalendarAlt, FaTimes, FaEye, FaEyeSlash } from 'react-icons/fa';
function AttendanceRecords() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [categorizedRecords, setCategorizedRecords] = useState({});
  const [category, setCategory] = useState('');
  const [program, setProgram] = useState('');
  const [year, setYear] = useState('');
  const [block, setBlock] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [showAllColumns, setShowAllColumns] = useState(false);
  const navigate = useNavigate();
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  const isMobile = windowWidth < 768;
  const isTablet = windowWidth >= 768 && windowWidth < 1024;
  const isDesktop = windowWidth >= 1024;
  const programOptions = {
    college: ['BSIT', 'BSED', 'BSBA', 'BSOA', 'BSCRIM'],
    senior: ['STEM', 'HUMSS', 'ABM'],
    junior: ['7', '8', '9', '10'],
    elementary: ['1', '2', '3', '4', '5', '6']
  };
  const yearOptions = {
    college: ['1', '2', '3', '4'],
    senior: ['11', '12'],
    junior: ['7', '8', '9', '10'],
    elementary: ['1', '2', '3', '4', '5', '6']
  };
  const sectionOptions = {
    college: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'],
    senior: ['A', 'B', 'C'],
    junior: {
      '7': ['Gemelina'],
      '8': ['Golden Shower', 'Ipil-Ipil'],
      '9': ['Mahogany', 'Narra'],
      '10': ['Talisay', 'Tanguile'],
      'all': ['Gemelina', 'Golden Shower', 'Ipil-Ipil', 'Mahogany', 'Narra', 'Talisay', 'Tanguile']
    },
    elementary: {
      '1': ['Fate'],
      '2': ['Charity'],
      '3': ['Hope'],
      '4': ['Patience'],
      '5': ['Purity'],
      '6': ['Simplicity', 'Molave'],
      'all': ['Fate', 'Charity', 'Hope', 'Patience', 'Purity', 'Simplicity', 'Molave']
    },
    teacher: ['Elementary Teacher', 'Junior Teacher', 'Senior Teacher'],
    instructor: ['BSIT Instructor', 'BSBA Instructor', 'BSED Instructor', 'BSCRIM Instructor', 'BSOA Instructor']
  };
  const categoryTitles = {
    college: 'College',
    senior: 'Senior High',
    junior: 'Junior High',
    elementary: 'Elementary',
    teacher: 'Teacher',
    instructor: 'Instructor'
  };
  const normalizeAttendanceRecord = record => {
    return {
      id: record.id || record.as_id || "-",
      name: record.name || record.as_name || "-",
      section: record.section || record.as_section || record.as_yearblock || record.yearBlock || "-",
      gradeLevel: record.gradeLevel || record.as_gradelevel || record.program || "-",
      program: record.program || record.as_program || record.strand || "-",
      yearBlock: record.yearBlock || record.as_yearblock || "-",
      timeIn: record.timeIn || record.as_timein || "-",
      timeOut: record.timeOut || record.as_timeout || "Not yet",
      category: record.category || (() => {
        const idStr = (record.id || record.as_id || "").toString().toUpperCase();
        if (idStr.includes("-G-")) return "college";
        if (idStr.includes("-S-")) return "senior";
        if (idStr.includes("-J-")) return "junior";
        if (idStr.includes("-E-")) return "elementary";
        if (idStr.includes("-T-")) return "teacher";
        if (idStr.includes("-I-")) return "instructor";

        // Try to detect from program
        const program = (record.as_program || record.program || "").toString().toUpperCase();
        if (["BSIT", "BSBA", "BSED", "BSCRIM", "BSOA"].includes(program)) return "college";
        if (["STEM", "HUMSS", "ABM", "GAS"].includes(program)) return "senior";
        return "unknown";
      })(),
      level: record.level || record.teacherLevel || record.instructorLevel || record.program || "-",
      teacherLevel: record.teacherLevel || record.level || "-",
      instructorLevel: record.instructorLevel || record.level || "-",
      ...record
    };
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
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const res = await api.get('/protected');
        if (!mounted) return;
        setUser(res.data.user || null);
        fetchRecords();
      } catch (err) {
        console.error('Protected load error', err);
        navigate('/login');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [navigate]);
  useEffect(() => {
    if (user) {
      fetchRecords();
    }
  }, [date]);
  const fetchRecords = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/attendance/records?date=${date}`);
      const normalizedRecords = res.data.map(record => normalizeAttendanceRecord(record));
      setRecords(normalizedRecords);
      applyFilters(normalizedRecords);
    } catch (err) {
      console.error('Failed to fetch records:', err);
      try {
        const res = await api.get('/attendance/today/list');
        const normalizedRecords = res.data.map(record => normalizeAttendanceRecord(record));
        setRecords(normalizedRecords);
        applyFilters(normalizedRecords);
      } catch (fallbackErr) {
        console.error('Fallback failed:', fallbackErr);
      }
    } finally {
      setLoading(false);
    }
  };
  const applyFilters = (data = records) => {
    let filtered = [...data];
    if (category) {
      filtered = filtered.filter(r => r.category?.toLowerCase() === category.toLowerCase());
    }
    if (program) {
      filtered = filtered.filter(r => {
        if (category === 'college') {
          return r.program === program;
        } else if (category === 'senior') {
          return r.program === program;
        } else if (category === 'junior') {
          return r.program === program;
        } else if (category === 'elementary') {
          return r.program === program;
        } else if (category === 'teacher') {
          return r.program === program || r.level === program;
        } else if (category === 'instructor') {
          return r.program === program || r.level === program;
        }
        return true;
      });
    }
    if (year) {
      filtered = filtered.filter(r => {
        if (category === 'college') {
          const yearPart = r.yearBlock?.split('-')[0];
          return yearPart === year;
        } else if (category === 'senior') {
          const gradePart = r.yearBlock?.split('-')[0];
          return gradePart === `Grade ${year}` || gradePart === year;
        } else if (category === 'junior' || category === 'elementary') {
          return r.program === year;
        }
        return true;
      });
    }
    if (block) {
      filtered = filtered.filter(r => {
        if (category === 'college') {
          const blockPart = r.yearBlock?.split('-')[1];
          return blockPart === block;
        } else if (category === 'senior') {
          const sectionPart = r.yearBlock?.split('-')[1];
          return sectionPart === block;
        } else if (category === 'junior' || category === 'elementary') {
          const displaySection = getSectionDisplayName(r.program, r.section, r.gradeLevel);
          return displaySection === block || r.section === block;
        } else if (category === 'teacher' || category === 'instructor') {
          return r.level === block || r.program === block;
        }
        return true;
      });
    }
    if (searchTerm) {
      filtered = filtered.filter(r => r.name?.toLowerCase().includes(searchTerm.toLowerCase()) || r.id?.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    setFilteredRecords(filtered);
    if (!category) {
      const grouped = {};
      const categories = ['college', 'senior', 'junior', 'elementary', 'teacher', 'instructor'];
      categories.forEach(cat => {
        grouped[cat] = filtered.filter(r => r.category?.toLowerCase() === cat);
      });
      setCategorizedRecords(grouped);
    }
  };
  useEffect(() => {
    if (records.length > 0) {
      applyFilters();
    }
  }, [category, program, year, block, searchTerm]);
  const handleCategoryChange = newCategory => {
    setCategory(newCategory);
    setProgram('');
    setYear('');
    setBlock('');
    if (isMobile) setMobileFiltersOpen(true);
  };
  const getSectionsForCategory = () => {
    if (!category) return sectionOptions.college;
    if (category === 'college') {
      return sectionOptions.college;
    } else if (category === 'senior') {
      return sectionOptions.senior;
    } else if (category === 'junior') {
      if (program && program !== '') {
        return sectionOptions.junior[program] || sectionOptions.junior.all;
      }
      return sectionOptions.junior.all;
    } else if (category === 'elementary') {
      if (program && program !== '') {
        return sectionOptions.elementary[program] || sectionOptions.elementary.all;
      }
      return sectionOptions.elementary.all;
    } else if (category === 'teacher') {
      return sectionOptions.teacher;
    } else if (category === 'instructor') {
      return sectionOptions.instructor;
    }
    return sectionOptions.college;
  };
  const getColumnsForCategory = cat => {
    const columns = [{
      key: 'id',
      label: 'ID'
    }, {
      key: 'name',
      label: 'Name'
    }];
    if (cat === 'college') {
      columns.push({
        key: 'program',
        label: 'Program'
      }, {
        key: 'yearBlock',
        label: 'Year & Block'
      });
    } else if (cat === 'senior') {
      columns.push({
        key: 'program',
        label: 'Strand'
      }, {
        key: 'yearBlock',
        label: 'Grade & Section'
      });
    } else if (cat === 'junior' || cat === 'elementary') {
      columns.push({
        key: 'program',
        label: 'Grade Level'
      }, {
        key: 'section',
        label: 'Section'
      });
    } else if (cat === 'teacher') {
      columns.push({
        key: 'level',
        label: 'Position'
      });
    } else if (cat === 'instructor') {
      columns.push({
        key: 'level',
        label: 'Position'
      });
    }
    columns.push({
      key: 'timeIn',
      label: 'Time In'
    }, {
      key: 'timeOut',
      label: 'Time Out'
    });
    return columns;
  };

  // Get cell content for a record based on column key - UPDATED
  const getCellContent = (record, colKey, cat) => {
    switch (colKey) {
      case 'id':
        return isMobile && record.id?.length > 12 ? `${record.id.substring(0, 10)}...` : record.id;
      case 'name':
        return isMobile && record.name?.length > 20 ? `${record.name.substring(0, 18)}...` : record.name;
      case 'program':
        return record.program;
      case 'yearBlock':
        if (cat === 'senior' && record.yearBlock) {
          const [grade, section] = record.yearBlock.split('-');
          return `Grade ${grade} ${section || ''}`.trim();
        }
        return record.yearBlock || '-';
      case 'section':
        if (cat === 'junior' || cat === 'elementary') {
          return getSectionDisplayName(record.program, record.section, record.gradeLevel);
        }
        if (cat === 'senior' && record.yearBlock) {
          const section = record.yearBlock.split('-')[1];
          return section || '-';
        }
        return record.section || '-';
      case 'level':
        return record.level || record.program || '-';
      case 'timeIn':
        return record.timeIn || '-';
      case 'timeOut':
        return record.timeOut || 'Not yet';
      default:
        return '-';
    }
  };
  const getCellStyle = (colKey, record) => {
    const style = {
      padding: isMobile ? '8px 12px' : '12px 16px',
      whiteSpace: 'nowrap'
    };
    if (colKey === 'id') {
      style.color = '#2d3748';
    } else if (colKey === 'name') {
      style.color = '#2d3748';
      style.fontWeight = '500';
    } else if (colKey === 'program' || colKey === 'yearBlock' || colKey === 'section' || colKey === 'level') {
      style.color = '#718096';
    } else if (colKey === 'timeIn') {
      style.color = '#10b981';
      style.fontWeight = '500';
    } else if (colKey === 'timeOut') {
      style.color = record.timeOut ? '#ef4444' : '#a0aec0';
      style.fontWeight = '500';
    }
    return style;
  };
  const exportToCSV = () => {
    let csvContent = '';
    if (category) {
      let headers = [];
      let csvData = [];
      if (category === 'college') {
        headers = ['ID', 'Name', 'Program', 'Year & Block', 'Time In', 'Time Out'];
        csvData = filteredRecords.map(r => [r.id, r.name, r.program, r.yearBlock, r.timeIn || '-', r.timeOut || '-']);
      } else if (category === 'senior') {
        headers = ['ID', 'Name', 'Strand', 'Grade Level', 'Section', 'Time In', 'Time Out'];
        csvData = filteredRecords.map(r => {
          const [grade, section] = (r.yearBlock || '').split('-');
          return [r.id, r.name, r.program, grade || '-', section || '-', r.timeIn || '-', r.timeOut || '-'];
        });
      } else if (category === 'junior' || category === 'elementary') {
        headers = ['ID', 'Name', 'Grade Level', 'Section', 'Time In', 'Time Out'];
        csvData = filteredRecords.map(r => [r.id, r.name, r.program, getSectionDisplayName(r.program, r.section, r.gradeLevel), r.timeIn || '-', r.timeOut || '-']);
      } else if (category === 'teacher' || category === 'instructor') {
        headers = ['ID', 'Name', 'Position', 'Time In', 'Time Out'];
        csvData = filteredRecords.map(r => [r.id, r.name, r.level || r.program || '-', r.timeIn || '-', r.timeOut || '-']);
      }
      csvContent = [headers.join(','), ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))].join('\n');
    } else {
      const categories = ['college', 'senior', 'junior', 'elementary', 'teacher', 'instructor'];
      categories.forEach(cat => {
        const catRecords = categorizedRecords[cat] || [];
        if (catRecords.length === 0) return;
        csvContent += `${categoryTitles[cat]}\n`;
        let headers = ['ID', 'Name'];
        if (cat === 'college') {
          headers.push('Program', 'Year & Block');
        } else if (cat === 'senior') {
          headers.push('Strand', 'Grade Level', 'Section');
        } else if (cat === 'junior' || cat === 'elementary') {
          headers.push('Grade Level', 'Section');
        } else if (cat === 'teacher' || cat === 'instructor') {
          headers.push('Position');
        }
        headers.push('Time In', 'Time Out');
        csvContent += headers.join(',') + '\n';
        catRecords.forEach(record => {
          const row = [record.id, record.name];
          if (cat === 'college') {
            row.push(record.program, record.yearBlock);
          } else if (cat === 'senior') {
            const [grade, section] = (record.yearBlock || '').split('-');
            row.push(record.program, grade || '-', section || '-');
          } else if (cat === 'junior' || cat === 'elementary') {
            row.push(record.program, getSectionDisplayName(record.program, record.section, record.gradeLevel));
          } else if (cat === 'teacher' || cat === 'instructor') {
            row.push(record.level || record.program || '-');
          }
          row.push(record.timeIn || '-', record.timeOut || '-');
          csvContent += row.map(cell => `"${cell}"`).join(',') + '\n';
        });
        csvContent += '\n';
      });
    }
    const blob = new Blob([csvContent], {
      type: 'text/csv'
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance-${category || 'all'}-${date}.csv`;
    a.click();
  };
  const MobileFiltersButton = () => <button onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)} className="w-full p-[12px] bg-[#0b7a3a] text-white border-0 rounded-[8px] text-[14px] font-semibold cursor-pointer flex items-center justify-center [gap:8px] mb-[15px]">
      <FaFilter />
      {mobileFiltersOpen ? 'Hide Filters' : 'Show Filters'}
    </button>;
  const MobileFilterPanel = () => {
    const sections = getSectionsForCategory();
    return <motion.div initial={{
      opacity: 0,
      height: 0
    }} animate={{
      opacity: 1,
      height: 'auto'
    }} className="bg-white rounded-[12px] p-[15px] mb-[15px] [box-shadow:0_4px_6px_rgba(0,0,0,0.05)]">
        <div className="flex justify-between items-center mb-[15px]">
          <h3 className="text-[16px] font-semibold text-[#2d3748] m-0">
            Filters
          </h3>
          <button onClick={() => setMobileFiltersOpen(false)} className="bg-[none] border-0 text-[18px] text-[#666] cursor-pointer">
            <FaTimes />
          </button>
        </div>

        <div className="flex flex-col [gap:15px]">
          {/* Date Picker */}
          <div>
            <label className="block text-[13px] font-semibold text-[#4a5568] mb-[6px]">
              <FaCalendarAlt className="mr-[6px]" />
              Date
            </label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full p-[10px_12px] [border:2px_solid_#e2e8f0] rounded-[8px] text-[14px] outline-none bg-white text-black" />
          </div>

          {/* Category */}
          <div>
            <label className="block text-[13px] font-semibold text-[#4a5568] mb-[6px]">
              Category
            </label>
            <select value={category} onChange={e => handleCategoryChange(e.target.value)} className="w-full p-[10px_12px] [border:2px_solid_#e2e8f0] rounded-[8px] text-[14px] text-black outline-none cursor-pointer bg-white">
              <option value="">All Categories</option>
              <option value="college">College</option>
              <option value="senior">Senior High</option>
              <option value="junior">Junior High</option>
              <option value="elementary">Elementary</option>
              <option value="teacher">Teacher</option>
              <option value="instructor">Instructor</option>
            </select>
          </div>

        
          {category && <div>
              <label className="block text-[13px] font-semibold text-[#4a5568] mb-[6px]">
                {category === "teacher" || category === "instructor" ? "Position" : category === "senior" ? "Strand" : category === "junior" || category === "elementary" ? "Grade Level" : category === "college" ? "Program" : "Program"}
              </label>
              <select value={program} onChange={e => {
            setProgram(e.target.value);
            if (category === 'junior' || category === 'elementary') {
              setBlock('');
            }
          }} className="w-full p-[10px_12px] [border:2px_solid_#e2e8f0] rounded-[8px] text-black text-[14px] outline-none cursor-pointer bg-white">
                <option value="">
                  {category === "teacher" || category === "instructor" ? "All Positions" : category === "senior" ? "All Strands" : category === "junior" || category === "elementary" ? "All Grade Levels" : category === "college" ? "All Programs" : "Program"}
                </option>
                {programOptions[category]?.map(prog => <option key={prog} value={prog}>{prog}</option>)}
              </select>
            </div>}

   
          {(category === 'college' || category === 'senior') && <div>
              <label className="block text-[13px] font-semibold text-[#4a5568] mb-[6px]">
                {category === 'college' ? 'Year Level' : 'Grade Level'}
              </label>
              <select value={year} onChange={e => setYear(e.target.value)} className="w-full p-[10px_12px] [border:2px_solid_#e2e8f0] rounded-[8px] text-black text-[14px] outline-none cursor-pointer bg-white">
                <option value="">All {category === 'college' ? 'Years' : 'Grades'}</option>
                {yearOptions[category]?.map(yr => <option key={yr} value={yr}>{category === 'senior' ? `Grade ${yr}` : yr}</option>)}
              </select>
            </div>}

          {/* Block/Section/Position Dropdown */}
          {(category === 'college' || category === 'senior' || category === 'junior' || category === 'elementary' || category === 'teacher' || category === 'instructor') && <div>
              <label className="block text-[13px] font-semibold text-[#4a5568] mb-[6px]">
                {category === 'college' ? 'Block' : category === 'senior' ? 'Section' : category === 'junior' || category === 'elementary' ? 'Section' : 'Position'}
              </label>
              <select value={block} onChange={e => setBlock(e.target.value)} className="w-full p-[10px_12px] [border:2px_solid_#e2e8f0] rounded-[8px] text-black text-[14px] outline-none cursor-pointer bg-white">
                <option value="">
                  All {category === 'college' ? 'Blocks' : category === 'senior' ? 'Sections' : category === 'junior' || category === 'elementary' ? 'Sections' : 'Positions'}
                </option>
                {sections.map(item => <option key={item} value={item}>{item}</option>)}
              </select>
            </div>}

    
          <div>
            <label className="block text-[13px] font-semibold text-[#4a5568] mb-[6px]">
              <FaSearch className="mr-[6px]" />
              Search (Name or ID)
            </label>
            <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search by name or ID..." className="w-full p-[10px_12px] [border:2px_solid_#e2e8f0] rounded-[8px] text-[14px] outline-none bg-white text-black" />
          </div>
        </div>
      </motion.div>;
  };
  const renderCategoryTable = (cat, catRecords) => {
    if (catRecords.length === 0) return null;
    const columns = getColumnsForCategory(cat);
    return <div key={cat} className="mb-[30px]">
        <h4 style={{
        fontSize: isMobile ? '14px' : '16px',
        fontWeight: '600',
        color: '#2d3748',
        marginBottom: '15px',
        paddingBottom: '10px',
        borderBottom: '2px solid #e2e8f0'
      }}>
          {categoryTitles[cat]} ({catRecords.length} records)
        </h4>
        <div className="overflow-x-auto [-webkit--overflow-scrolling:touch]">
          <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: isMobile ? '12px' : '14px',
          minWidth: isMobile ? '600px' : 'auto'
        }}>
            <thead>
              <tr className="bg-[#f7fafc] [border-bottom:2px_solid_#e2e8f0]">
                {columns.map(col => <th key={col.key} style={{
                padding: isMobile ? '10px 12px' : '12px 16px',
                textAlign: 'left',
                fontWeight: '600',
                color: '#4a5568',
                whiteSpace: 'nowrap'
              }}>
                    {col.label}
                  </th>)}
              </tr>
            </thead>
            <tbody>
              {catRecords.map((record, idx) => <tr key={idx} onMouseEnter={e => !isMobile && (e.currentTarget.style.background = '#f7fafc')} onMouseLeave={e => !isMobile && (e.currentTarget.style.background = 'transparent')} className="[border-bottom:1px_solid_#e2e8f0] [transition:background_0.2s_ease]">
                  {columns.map(col => {
                const content = getCellContent(record, col.key, cat);
                const style = getCellStyle(col.key, record);
                return <td key={col.key} style={style}>
                        {content}
                      </td>;
              })}
                </tr>)}
            </tbody>
          </table>
        </div>
      </div>;
  };
  if (loading && !user) {
    return <div className="flex justify-center items-center h-[100vh] bg-[#f5f7fa]">
        <div className="text-center">
          <div className={`${isMobile ? "h-10 w-10" : "h-[50px] w-[50px]"} mx-auto mb-5 animate-spin rounded-full border-4 border-[#f3f3f3] border-t-[#0b7a3a]`} />
          <p style={{
          color: '#666',
          fontSize: isMobile ? 16 : 18
        }}>Loading...</p>
        </div>
      </div>;
  }
  return <div style={{
    padding: isMobile ? '10px' : '20px',
    background: '#f5f7fa',
    minHeight: '100vh'
  }}>
    
      {isMobile && <div className="flex justify-between items-center mb-[20px] p-[12px_0] [border-bottom:1px_solid_#e2e8f0]">
          <div>
            <h1 className="text-[20px] font-bold text-[#1a202c] m-0">
              Attendance Records
            </h1>
            <p className="text-[12px] text-[#718096] m-[4px_0_0_0]">
              View and filter attendance
            </p>
          </div>
        </div>}

    
      {!isMobile && <motion.div initial={{
      opacity: 0,
      y: -20
    }} animate={{
      opacity: 1,
      y: 0
    }} className="mb-[30px]">
          <h1 style={{
        fontSize: isTablet ? '28px' : '32px',
        fontWeight: '700',
        color: '#1a202c',
        marginBottom: '8px'
      }}>
            Attendance Records
          </h1>
          <p style={{
        color: '#718096',
        fontSize: isTablet ? '14px' : '16px',
        maxWidth: '600px'
      }}>
            View and filter attendance records by category, program, and date
          </p>
        </motion.div>}

     
      {isMobile && <>
          <MobileFiltersButton />
          {mobileFiltersOpen && <MobileFilterPanel />}
        </>}

   
      {!isMobile && <motion.div initial={{
      opacity: 0
    }} animate={{
      opacity: 1
    }} transition={{
      delay: 0.1
    }} style={{
      background: 'white',
      padding: isTablet ? '20px' : '25px',
      borderRadius: '16px',
      boxShadow: '0 4px 6px rgba(0,0,0,0.07)',
      marginBottom: '20px'
    }}>
          <div className="flex items-center [gap:10px] mb-[20px]">
            <FaFilter className="text-[20px] text-[#0b7a3a]" />
            <h3 className="text-[18px] font-semibold text-[#2d3748] m-0">
              Filters
            </h3>
          </div>

          <div style={{
        display: 'grid',
        gridTemplateColumns: isTablet ? 'repeat(2, 1fr)' : 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '15px',
        marginBottom: '15px'
      }}>
            {/* Date Picker */}
            <div>
              <label className="block text-[13px] font-semibold text-[#4a5568] mb-[6px]">
                <FaCalendarAlt className="mr-[6px]" />
                Date
              </label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full p-[10px_12px] [border:2px_solid_#e2e8f0] rounded-[8px] text-[14px] outline-none bg-white text-black" />
            </div>

     
            <div>
              <label className="block text-[13px] font-semibold text-[#4a5568] mb-[6px]">
                Category
              </label>
              <select value={category} onChange={e => handleCategoryChange(e.target.value)} className="w-full p-[10px_12px] [border:2px_solid_#e2e8f0] rounded-[8px] text-[14px] text-black outline-none cursor-pointer bg-white">
                <option value="">All Categories</option>
                <option value="college">College</option>
                <option value="senior">Senior High</option>
                <option value="junior">Junior High</option>
                <option value="elementary">Elementary</option>
                <option value="teacher">Teacher</option>
                <option value="instructor">Instructor</option>
              </select>
            </div>

            {category && <div>
                <label className="block text-[13px] font-semibold text-[#4a5568] mb-[6px]">
                  {category === "teacher" || category === "instructor" ? "Position" : category === "senior" ? "Strand" : category === "junior" || category === "elementary" ? "Grade Level" : category === "college" ? "Program" : "Program"}
                </label>
                <select value={program} onChange={e => {
            setProgram(e.target.value);
            if (category === 'junior' || category === 'elementary') {
              setBlock('');
            }
          }} className="w-full p-[10px_12px] [border:2px_solid_#e2e8f0] rounded-[8px] text-black text-[14px] outline-none cursor-pointer bg-white">
                  <option value="">
                    {category === "teacher" || category === "instructor" ? "All Positions" : category === "senior" ? "All Strands" : category === "junior" || category === "elementary" ? "All Grade Levels" : category === "college" ? "All Programs" : "Program"}
                  </option>
                  {programOptions[category]?.map(prog => <option key={prog} value={prog}>{prog}</option>)}
                </select>
              </div>}

            {(category === 'college' || category === 'senior') && <div>
                <label className="block text-[13px] font-semibold text-[#4a5568] mb-[6px]">
                  {category === 'college' ? 'Year Level' : 'Grade Level'}
                </label>
                <select value={year} onChange={e => setYear(e.target.value)} className="w-full p-[10px_12px] [border:2px_solid_#e2e8f0] rounded-[8px] text-black text-[14px] outline-none cursor-pointer bg-white">
                  <option value="">All {category === 'college' ? 'Years' : 'Grades'}</option>
                  {yearOptions[category]?.map(yr => <option key={yr} value={yr}>{category === 'senior' ? `Grade ${yr}` : yr}</option>)}
                </select>
              </div>}

            
            {(category === 'college' || category === 'senior' || category === 'junior' || category === 'elementary' || category === 'teacher' || category === 'instructor') && <div>
                <label className="block text-[13px] font-semibold text-[#4a5568] mb-[6px]">
                  {category === 'college' ? 'Block' : category === 'senior' ? 'Section' : category === 'junior' || category === 'elementary' ? 'Section' : 'Position'}
                </label>
                <select value={block} onChange={e => setBlock(e.target.value)} className="w-full p-[10px_12px] [border:2px_solid_#e2e8f0] rounded-[8px] text-black text-[14px] outline-none cursor-pointer bg-white">
                  <option value="">
                    All {category === 'college' ? 'Blocks' : category === 'senior' ? 'Sections' : category === 'junior' || category === 'elementary' ? 'Sections' : 'Positions'}
                  </option>
                  {getSectionsForCategory().map(item => <option key={item} value={item}>{item}</option>)}
                </select>
              </div>}

         
            <div>
              <label className="block text-[13px] font-semibold text-[#4a5568] mb-[6px]">
                <FaSearch className="mr-[6px]" />
                Search (Name or ID)
              </label>
              <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search by name or ID..." className="w-full p-[10px_12px] [border:2px_solid_#e2e8f0] rounded-[8px] text-[14px] outline-none bg-white text-black" />
            </div>
          </div>

        
          <div className="flex [gap:10px] justify-end">
            <button onClick={fetchRecords} onMouseEnter={e => e.target.style.background = '#096030'} onMouseLeave={e => e.target.style.background = '#0b7a3a'} className="p-[10px_24px] bg-[#0b7a3a] text-white border-0 rounded-[8px] text-[14px] font-semibold cursor-pointer flex items-center [gap:8px] [transition:all_0.3s_ease]">
              <FaFilter />
              Apply Filters
            </button>
            <button onClick={exportToCSV} disabled={filteredRecords.length === 0} style={{
          padding: '10px 24px',
          background: filteredRecords.length === 0 ? '#cbd5e0' : '#3b82f6',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          fontSize: '14px',
          fontWeight: '600',
          cursor: filteredRecords.length === 0 ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          transition: 'all 0.3s ease'
        }} onMouseEnter={e => {
          if (filteredRecords.length > 0) e.target.style.background = '#2563eb';
        }} onMouseLeave={e => {
          if (filteredRecords.length > 0) e.target.style.background = '#3b82f6';
        }}>
              <FaDownload />
              Export CSV
            </button>
          </div>
        </motion.div>}

      {isMobile && <div className="flex [gap:10px] mb-[15px] flex-wrap">
          <button onClick={fetchRecords} className="[flex:1] p-[12px] bg-[#0b7a3a] text-white border-0 rounded-[8px] text-[14px] font-semibold cursor-pointer flex items-center justify-center [gap:8px] min-w-[120px]">
            <FaFilter />
            Apply
          </button>
          <button onClick={exportToCSV} disabled={filteredRecords.length === 0} style={{
        flex: '1',
        padding: '12px',
        background: filteredRecords.length === 0 ? '#cbd5e0' : '#3b82f6',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        fontSize: '14px',
        fontWeight: '600',
        cursor: filteredRecords.length === 0 ? 'not-allowed' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        minWidth: '120px'
      }}>
            <FaDownload />
            Export
          </button>
        </div>}


      <motion.div initial={{
      opacity: 0,
      y: 20
    }} animate={{
      opacity: 1,
      y: 0
    }} transition={{
      delay: 0.2
    }} style={{
      background: 'white',
      padding: isMobile ? '15px' : '25px',
      borderRadius: '16px',
      boxShadow: '0 4px 6px rgba(0,0,0,0.07)'
    }}>
        <div style={{
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        justifyContent: 'space-between',
        alignItems: isMobile ? 'stretch' : 'center',
        gap: isMobile ? '10px' : '0',
        marginBottom: '20px'
      }}>
          <h3 style={{
          fontSize: isMobile ? '16px' : '18px',
          fontWeight: '600',
          color: '#2d3748',
          margin: 0
        }}>
            Results ({filteredRecords.length} records)
          </h3>
          
          {/* Mobile toggle columns button */}
          {isMobile && category && filteredRecords.length > 0 && <button onClick={() => setShowAllColumns(!showAllColumns)} style={{
          padding: '8px 12px',
          background: showAllColumns ? '#666' : '#0b7a3a',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          fontSize: '12px',
          fontWeight: '600',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          alignSelf: 'flex-start'
        }}>
              {showAllColumns ? <FaEyeSlash /> : <FaEye />}
              {showAllColumns ? 'Hide Details' : 'Show Details'}
            </button>}
        </div>

        {loading ? <div className="text-center p-[40px]">
            <div className="w-[40px] h-[40px] [border:4px_solid_#f3f3f3] [border-top:4px_solid_#0b7a3a] rounded-full animate-spin m-[0_auto_15px]" />
            <p className="text-[#a0aec0]">Loading records...</p>
          </div> : filteredRecords.length === 0 ? <div style={{
        textAlign: 'center',
        padding: isMobile ? '40px' : '60px',
        color: '#a0aec0'
      }}>
            <p style={{
          fontSize: isMobile ? '14px' : '16px',
          marginBottom: '8px'
        }}>📋 No records found</p>
            <p style={{
          fontSize: isMobile ? '12px' : '14px'
        }}>Try adjusting your filters or select a different date</p>
          </div> : category === '' ? <>
            {['college', 'senior', 'junior', 'elementary', 'teacher', 'instructor'].map(cat => renderCategoryTable(cat, categorizedRecords[cat] || []))}
          </> : renderCategoryTable(category, filteredRecords)}
      </motion.div>

      
    </div>;
}
export default AttendanceRecords;
