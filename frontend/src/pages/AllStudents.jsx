import React, { useEffect, useRef, useState } from "react";
import "./Admin.css";
import AdminSidebar from "../components/AdminSideBar";
import searchIcon from "../assets/search.png";
import editIcon from "../assets/edit.png";
import peopleIcon from "../assets/delete.png"; // ← أيقونة الحذف (نفس المستخدمة بباقي الصفحات)
import closeIcon from "../assets/xbutton.png";
import { fetchApprovedStudents } from "../axios";

const AllStudents = () => {
  const [semester, setSemester] = useState("20211");
  const [isEditing, setIsEditing] = useState(false);
  const [tempSemester, setTempSemester] = useState(semester);
  const [showPopup, setShowPopup] = useState(false);

  const [students, setStudents] = useState([]); // بيانات من API
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchTerms, setSearchTerms] = useState({
    name: "",
    studentId: "",
    department: "",
  });

  const [activeSearch, setActiveSearch] = useState({
    name: false,
    studentId: false,
    department: false,
  });

  const tableRef = useRef(null);

  // إغلاق صناديق البحث عند النقر خارج الجدول
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (tableRef.current && !tableRef.current.contains(e.target)) {
        setSearchTerms({ name: "", studentId: "", department: "" });
        setActiveSearch({ name: false, studentId: false, department: false });
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // جلب الطلاب
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await fetchApprovedStudents(); // [{ studentId, name, department, role }]
        if (mounted) setStudents(data || []);
      } catch (err) {
        if (mounted) setError("Failed to load students.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const handleEditClick = () => setIsEditing(true);
  const handleSemesterChange = (e) => setTempSemester(e.target.value);
  const handleSemesterBlur = () => {
    setIsEditing(false);
    setSemester(tempSemester);
  };

  const handleSearchChange = (field, value) => {
    setSearchTerms((prev) => ({
      ...prev,
      [field]: value.toLowerCase(),
    }));
  };

  const toggleSearch = (field) => {
    setActiveSearch((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  // Actions handlers (مكان الربط لاحقًا مع صفحات/Popups)
  const handleEditStudent = (student) => {
    // TODO: افتحي صفحة تفاصيل/تعديل أو Popup
    console.log("Edit student:", student);
    alert(`Edit student ${student.name} (coming soon)`);
  };

  const handleDeleteStudent = (student) => {
    // TODO: اربطيها بـ API حذف بعد تأكيد
    if (window.confirm(`Delete student ${student.name}? (demo)`)) {
      console.log("Delete student:", student);
      alert("Delete action is a placeholder for now.");
    }
  };

  const filteredStudents = students.filter(
    (st) =>
      String(st.name ?? "").toLowerCase().includes(searchTerms.name) &&
      String(st.studentId ?? "").toLowerCase().includes(searchTerms.studentId) &&
      String(st.department ?? "")
        .toLowerCase()
        .includes(searchTerms.department)
  );

  return (
    <div className="admin-dashboard">
      <AdminSidebar />
      <div className="dashboard-content">
        <div className="welcome-semester-container">
          <h2 className="welcome-message">Welcome Back, Ssre</h2>
          <div className="semester-box">
            <span className="semester-label">Current Semester</span>
            {isEditing ? (
              <input
                type="text"
                className="semester-input"
                value={tempSemester}
                onChange={handleSemesterChange}
                onBlur={handleSemesterBlur}
                autoFocus
              />
            ) : (
              <>
                <span className="semester-value">{semester}</span>
                <img
                  src={editIcon}
                  alt="Edit"
                  className="action-icon"
                  onClick={handleEditClick}
                />
              </>
            )}
          </div>
        </div>

        <div className="header-row">
          <h3 className="section-title">All Students</h3>
          <button className="add-admin-btn" onClick={() => setShowPopup(true)}>
            Add Student
          </button>
        </div>

        <div className="table-wrapper" ref={tableRef}>
          <table className="admins-table">
            <thead>
              <tr>
                <th>#</th>

                <th>
                  {activeSearch.name ? (
                    <input
                      type="text"
                      placeholder="Search Name"
                      className="column-search"
                      onChange={(e) => handleSearchChange("name", e.target.value)}
                      autoFocus
                    />
                  ) : (
                    <span className="header-label">
                      Student's Name
                      <img
                        src={searchIcon}
                        alt="Search"
                        className="search-icon"
                        onClick={() => toggleSearch("name")}
                      />
                    </span>
                  )}
                </th>

                <th>
                  {activeSearch.studentId ? (
                    <input
                      type="text"
                      placeholder="Search ID"
                      className="column-search"
                      onChange={(e) =>
                        handleSearchChange("studentId", e.target.value)
                      }
                      autoFocus
                    />
                  ) : (
                    <span className="header-label">
                      Student's ID
                      <img
                        src={searchIcon}
                        alt="Search"
                        className="search-icon"
                        onClick={() => toggleSearch("studentId")}
                      />
                    </span>
                  )}
                </th>

                <th>
                  {activeSearch.department ? (
                    <input
                      type="text"
                      placeholder="Search Dept"
                      className="column-search"
                      onChange={(e) =>
                        handleSearchChange("department", e.target.value)
                      }
                      autoFocus
                    />
                  ) : (
                    <span className="header-label">
                      Department
                      <img
                        src={searchIcon}
                        alt="Search"
                        className="search-icon"
                        onClick={() => toggleSearch("department")}
                      />
                    </span>
                  )}
                </th>

                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5">Loading...</td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan="5">{error}</td>
                </tr>
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan="5">No students found.</td>
                </tr>
              ) : (
                filteredStudents.map((st, idx) => (
                  <tr key={st.studentId || idx}>
                    <td>{idx + 1}</td>
                    <td>
                      <u>{st.name}</u>
                    </td>
                    <td>{st.studentId}</td>
                    <td>{st.department}</td>
                    <td className="action-icons">
                      <img
                        src={editIcon}
                        alt="Edit"
                        className="action-icon"
                        onClick={() => handleEditStudent(st)}
                      />
                      <img
                        src={peopleIcon}
                        alt="Delete"
                        className="action-icon"
                        onClick={() => handleDeleteStudent(st)}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Popup (اختياري لاحقًا) */}
        {showPopup && (
          <div className="popup-overlay">
            <div className="popup-box">
              <div className="popup-header">
                <h3>Add Student</h3>
                <img
                  src={closeIcon}
                  alt="Close"
                  className="close-icon"
                  onClick={() => setShowPopup(false)}
                />
              </div>
              <div className="popup-form">Coming soon…</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AllStudents;
