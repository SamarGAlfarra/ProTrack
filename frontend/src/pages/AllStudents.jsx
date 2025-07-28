import React, { useState, useRef, useEffect } from 'react';
import './Admin.css';
import AdminSidebar from '../components/AdminSideBar';
import peopleIcon from '../assets/delete.png';
import editIcon from '../assets/edit.png';
import closeIcon from '../assets/xbutton.png';
import searchIcon from '../assets/search.png';
import logoutIcon from '../assets/logout.png';

const AllStudents = () => {
  const [semester, setSemester] = useState('20211');
  const [isEditing, setIsEditing] = useState(false);
  const [tempSemester, setTempSemester] = useState(semester);
  const [showPopup, setShowPopup] = useState(false);

  const [searchTerms, setSearchTerms] = useState({
    name: '',
    studentId: '',
    department: '',
    supervisor: '',
    projectId: '',
  });

  const [activeSearch, setActiveSearch] = useState({
    name: false,
    studentId: false,
    department: false,
    supervisor: false,
    projectId: false,
  });

  const tableRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (tableRef.current && !tableRef.current.contains(event.target)) {
        setSearchTerms({
          name: '',
          studentId: '',
          department: '',
          supervisor: '',
          projectId: '',
        });
        setActiveSearch({
          name: false,
          studentId: false,
          department: false,
          supervisor: false,
          projectId: false,
        });
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const students = [
    { id: 1, name: 'Ahmed Mahdi', studentId: 'STD001', department: 'IT', supervisor: 'Dr. Ali', projectId: 'PRJ001' },
    { id: 2, name: 'Ahmed Mahdi', studentId: 'STD002', department: 'CS', supervisor: 'Dr. Omar', projectId: 'PRJ002' },
    { id: 3, name: 'Ahmed Mahdi', studentId: 'STD003', department: 'CE', supervisor: 'Dr. Salim', projectId: 'PRJ003' },
    { id: 4, name: 'Ahmed Mahdi', studentId: 'STD004', department: 'EE', supervisor: 'Dr. Layla', projectId: 'PRJ004' },
  ];

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

  const filteredStudents = students.filter((student) =>
    student.name.toLowerCase().includes(searchTerms.name) &&
    student.studentId.toLowerCase().includes(searchTerms.studentId) &&
    student.department.toLowerCase().includes(searchTerms.department) &&
    student.supervisor.toLowerCase().includes(searchTerms.supervisor) &&
    student.projectId.toLowerCase().includes(searchTerms.projectId)
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
                      onChange={(e) => handleSearchChange('name', e.target.value)}
                      autoFocus
                    />
                  ) : (
                    <span className="header-label">
                      Student's Name
                      <img
                        src={searchIcon}
                        alt="Search"
                        className="search-icon"
                        onClick={() => toggleSearch('name')}
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
                      onChange={(e) => handleSearchChange('studentId', e.target.value)}
                      autoFocus
                    />
                  ) : (
                    <span className="header-label">
                      Student's ID
                      <img
                        src={searchIcon}
                        alt="Search"
                        className="search-icon"
                        onClick={() => toggleSearch('studentId')}
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
                      onChange={(e) => handleSearchChange('department', e.target.value)}
                      autoFocus
                    />
                  ) : (
                    <span className="header-label">
                      Department
                      <img
                        src={searchIcon}
                        alt="Search"
                        className="search-icon"
                        onClick={() => toggleSearch('department')}
                      />
                    </span>
                  )}
                </th>

                <th>
                  {activeSearch.supervisor ? (
                    <input
                      type="text"
                      placeholder="Search Supervisor"
                      className="column-search"
                      onChange={(e) => handleSearchChange('supervisor', e.target.value)}
                      autoFocus
                    />
                  ) : (
                    <span className="header-label">
                      Supervisor
                      <img
                        src={searchIcon}
                        alt="Search"
                        className="search-icon"
                        onClick={() => toggleSearch('supervisor')}
                      />
                    </span>
                  )}
                </th>

                <th>
                  {activeSearch.projectId ? (
                    <input
                      type="text"
                      placeholder="Search Project ID"
                      className="column-search"
                      onChange={(e) => handleSearchChange('projectId', e.target.value)}
                      autoFocus
                    />
                  ) : (
                    <span className="header-label">
                      Project ID
                      <img
                        src={searchIcon}
                        alt="Search"
                        className="search-icon"
                        onClick={() => toggleSearch('projectId')}
                      />
                    </span>
                  )}
                </th>

                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((student, index) => (
                <tr key={student.id}>
                  <td>{index + 1}</td>
                  <td><u>{student.name}</u></td>
                  <td>{student.studentId}</td>
                  <td>{student.department}</td>
                  <td>{student.supervisor}</td>
                  <td>{student.projectId}</td>
                  <td className="action-icons">
                    <img src={peopleIcon} alt="Delete" className="action-icon" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Add Student Popup */}
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
                <input type="text" placeholder="ID" className="popup-input" />
                <input type="email" placeholder="Email" className="popup-input" />
                <input type="password" placeholder="Password" className="popup-input" />
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
