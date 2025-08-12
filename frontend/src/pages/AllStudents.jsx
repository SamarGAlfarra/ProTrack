// src/pages/AllStudents.jsx
import React, { useState, useRef, useEffect } from "react";
import "./Admin.css";
import AdminSidebar from "../components/AdminSideBar";

import editIcon from "../assets/edit.png";
import peopleIcon from "../assets/delete.png";
import closeIcon from "../assets/xbutton.png";
import searchIcon from "../assets/search.png";

import axios from "../axios";
// إن كانت موجودة في axios.js سنستخدمها، وإن لم تكن فالكود سيعمل بالفallback
import { fetchApprovedStudents as tryFetchApprovedStudents } from "../axios";

const AllStudents = () => {
  const [semester, setSemester] = useState("20211");
  const [isEditing, setIsEditing] = useState(false);
  const [tempSemester, setTempSemester] = useState(semester);
  const [showPopup, setShowPopup] = useState(false);

  const [students, setStudents] = useState([]);
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

  // إغلاق حقول البحث عند النقر خارج الجدول
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (tableRef.current && !tableRef.current.contains(event.target)) {
        setSearchTerms({ name: "", studentId: "", department: "" });
        setActiveSearch({ name: false, studentId: false, department: false });
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ---- جلب الطلاب مع Fallbacks
  useEffect(() => {
    let mounted = true;

    const normalize = (data) => {
      // نقبل أكثر من شكل Response
      if (Array.isArray(data)) return data;
      if (Array.isArray(data?.students)) return data.students;
      return [];
    };

    (async () => {
      setLoading(true);
      setError("");

      try {
        let list = [];

        // 1) جرّب دالة fetchApprovedStudents إن كانت موجودة
        if (typeof tryFetchApprovedStudents === "function") {
          try {
            const res1 = await tryFetchApprovedStudents({ semester });
            list = normalize(res1);
          } catch (e) {
            // نكمل على الفولباك التالي
          }
        }

        // 2) جرّب /admin/approved-students
        if ((!list || list.length === 0)) {
          try {
            const res2 = await axios.get("/admin/approved-students", {
              params: { semester },
            });
            list = normalize(res2.data);
          } catch (e) {
            // نكمل على الفولباك التالي
          }
        }

        // 3) جرّب /admin/students
        if ((!list || list.length === 0)) {
          try {
            const res3 = await axios.get("/admin/students", {
              params: { semester },
            });
            list = normalize(res3.data);
          } catch (e) {
            // إذا فشل الكل سنرمي الخطأ لاحقًا
          }
        }

        if (!mounted) return;

        if (!list || list.length === 0) {
          setStudents([]);
          setError("Failed to load students.");
        } else {
          setStudents(list);
          setError("");
        }
      } catch (e) {
        if (!mounted) return;
        console.error("Students API error:", {
          status: e?.response?.status,
          data: e?.response?.data,
          message: e?.message,
        });
        setStudents([]);
        setError("Failed to load students.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [semester]);

  // هيدر السمستر
  const handleEditClick = () => setIsEditing(true);
  const handleSemesterChange = (e) => setTempSemester(e.target.value);
  const handleSemesterBlur = () => {
    setIsEditing(false);
    setSemester(tempSemester || semester);
  };

  // البحث
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

  // فلترة
  const filteredStudents = students.filter((st) => {
    const name = String(st.name ?? st.student_name ?? "").toLowerCase();
    const sid = String(
      st.studentId ??
        st.student_id ??
        st.university_id ??
        st.student_university_id ??
        st.number ??
        ""
    ).toLowerCase();
    const dept = String(st.department ?? st.department_name ?? "").toLowerCase();

    return (
      name.includes(searchTerms.name) &&
      sid.includes(searchTerms.studentId) &&
      dept.includes(searchTerms.department)
    );
  });

  // Helpers (تطبيع الحقول)
  const getName = (s) => s.name ?? s.student_name ?? "—";
  const getStudentId = (s) =>
    s.studentId ??
    s.student_id ??
    s.university_id ??
    s.student_university_id ??
    s.number ??
    "—";
  const getDept = (s) => s.department ?? s.department_name ?? "—";
  const getSupervisorName = (s) =>
    s.supervisorName ?? s.supervisor_name ?? "—";
  const getProjectId = (s) => s.projectId ?? s.project_id ?? "—";

  // Actions (ديمو)
  const handleEditStudent = (student) =>
    alert(`Edit student ${getName(student)} (demo)`);
  const handleDeleteStudent = (student) => {
    if (window.confirm(`Delete ${getName(student)}? (demo)`)) {
      alert("Delete action is a placeholder for now.");
    }
  };

  return (
    <div className="admin-dashboard">
      <AdminSidebar />

      <div className="dashboard-content">
        {/* نفس الهيدر المستخدم في AllSupervisors.jsx */}
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

        {/* عنوان الجدول وزر الإضافة */}
        <div className="header-row">
          <h3 className="section-title">All Students</h3>
          <button className="add-admin-btn" onClick={() => setShowPopup(true)}>
            Add Student
          </button>
        </div>

        {/* الجدول بنفس الكلاسات (admins-table) مثل AllSupervisors */}
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

                {/* الأعمدة الإضافية */}
                <th>Supervisor Name</th>
                <th>Project ID</th>

                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7">Loading...</td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan="7">{error}</td>
                </tr>
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan="7">No students found.</td>
                </tr>
              ) : (
                filteredStudents.map((st, index) => (
                  <tr
                    key={
                      st.studentId ||
                      st.student_id ||
                      st.university_id ||
                      st.project_id ||
                      index
                    }
                  >
                    <td>{index + 1}</td>
                    <td>
                      <u>{getName(st)}</u>
                    </td>
                    <td>{getStudentId(st)}</td>
                    <td>{getDept(st)}</td>
                    <td>{getSupervisorName(st)}</td>
                    <td>{getProjectId(st)}</td>
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

        {/* Popup إضافة (اختياري) */}
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
              <form className="popup-form">
                <input type="text" placeholder="Name" className="popup-input" />
                <input type="text" placeholder="Student ID" className="popup-input" />
                <input type="text" placeholder="Department" className="popup-input" />
                <button type="submit" className="popup-submit-btn">Add</button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AllStudents;
