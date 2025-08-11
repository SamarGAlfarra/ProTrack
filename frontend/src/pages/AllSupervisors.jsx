import React, { useState, useRef, useEffect } from 'react';
import './Admin.css';
import AdminSidebar from '../components/AdminSideBar';
import editIcon from '../assets/edit.png';
import peopleIcon from '../assets/delete.png';
import closeIcon from '../assets/xbutton.png';
import searchIcon from '../assets/search.png';
import logoutIcon from '../assets/logout.png';
import axios from '../axios'; // ✅ shared axios instance

const AllSupervisors = () => {
  const [semester, setSemester] = useState('20211');
  const [isEditing, setIsEditing] = useState(false);
  const [tempSemester, setTempSemester] = useState(semester);
  const [showPopup, setShowPopup] = useState(false);

  const [supervisors, setSupervisors] = useState([]);   // ✅ live data
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [searchTerms, setSearchTerms] = useState({
    name: '',
    supervisorId: '',
    degree: '',
    department: '',
    role: '',
    projects: '',
  });

  const [activeSearch, setActiveSearch] = useState({
    name: false,
    supervisorId: false,
    degree: false,
    department: false,
    role: false,
    projects: false,
  });

  const tableRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (tableRef.current && !tableRef.current.contains(event.target)) {
        setSearchTerms({
          name: '',
          supervisorId: '',
          degree: '',
          department: '',
          role: '',
          projects: '',
        });
        setActiveSearch({
          name: false,
          supervisorId: false,
          degree: false,
          department: false,
          role: false,
          projects: false,
        });
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // ✅ Fetch supervisors on mount
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        // Backend: GET /api/admin/supervisors
        const res = await axios.get('/admin/supervisors');
        if (mounted) setSupervisors(res.data || []);
      } catch (e) {
        if (mounted) setError('Failed to load supervisors.');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
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

  const filteredSupervisors = supervisors.filter((sup) =>
    String(sup.name || '').toLowerCase().includes(searchTerms.name) &&
    String(sup.supervisorId || '').toLowerCase().includes(searchTerms.supervisorId) &&
    String(sup.degree || '').toLowerCase().includes(searchTerms.degree) &&
    String(sup.department || '').toLowerCase().includes(searchTerms.department) &&
    String(sup.role || '').toLowerCase().includes(searchTerms.role) &&
    String(sup.projects ?? '').toLowerCase().includes(searchTerms.projects)
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
          <h3 className="section-title">All Supervisors</h3>
          <button className="add-admin-btn" onClick={() => setShowPopup(true)}>
            Add Supervisor
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
                      Supervisor's Name
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
                  {activeSearch.supervisorId ? (
                    <input
                      type="text"
                      placeholder="Search ID"
                      className="column-search"
                      onChange={(e) => handleSearchChange('supervisorId', e.target.value)}
                      autoFocus
                    />
                  ) : (
                    <span className="header-label">
                      Supervisor's ID
                      <img
                        src={searchIcon}
                        alt="Search"
                        className="search-icon"
                        onClick={() => toggleSearch('supervisorId')}
                      />
                    </span>
                  )}
                </th>

                <th>
                  {activeSearch.degree ? (
                    <input
                      type="text"
                      placeholder="Search Degree"
                      className="column-search"
                      onChange={(e) => handleSearchChange('degree', e.target.value)}
                      autoFocus
                    />
                  ) : (
                    <span className="header-label">
                      Educational Degree
                      <img
                        src={searchIcon}
                        alt="Search"
                        className="search-icon"
                        onClick={() => toggleSearch('degree')}
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
                  {activeSearch.role ? (
                    <input
                      type="text"
                      placeholder="Search Role"
                      className="column-search"
                      onChange={(e) => handleSearchChange('role', e.target.value)}
                      autoFocus
                    />
                  ) : (
                    <span className="header-label">
                      Role
                      <img
                        src={searchIcon}
                        alt="Search"
                        className="search-icon"
                        onClick={() => toggleSearch('role')}
                      />
                    </span>
                  )}
                </th>

                <th>
                  {activeSearch.projects ? (
                    <input
                      type="text"
                      placeholder="Search #Projects"
                      className="column-search"
                      onChange={(e) => handleSearchChange('projects', e.target.value)}
                      autoFocus
                    />
                  ) : (
                    <span className="header-label">
                      No. Projects
                      <img
                        src={searchIcon}
                        alt="Search"
                        className="search-icon"
                        onClick={() => toggleSearch('projects')}
                      />
                    </span>
                  )}
                </th>

                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="8">Loading...</td></tr>
              ) : error ? (
                <tr><td colSpan="8">{error}</td></tr>
              ) : (
                filteredSupervisors.map((sup, index) => (
                  <tr key={sup.supervisorId || index}>
                    <td>{index + 1}</td>
                    <td><u>{sup.name}</u></td>
                    <td>{sup.supervisorId}</td>
                    <td>{sup.degree}</td>
                    <td>{sup.department}</td>
                    <td>{sup.role}</td>
                    <td>{sup.projects}</td>
                    <td className="action-icons">
                      <img src={editIcon} alt="Edit" className="action-icon" />
                      <img src={peopleIcon} alt="Delete" className="action-icon" />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Add Supervisor Popup */}
        {showPopup && (
          <div className="popup-overlay">
            <div className="popup-box">
              <div className="popup-header">
                <h3>Add Supervisor</h3>
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
                <input type="text" placeholder="Educational Degree" className="popup-input" />
                <button type="submit" className="popup-submit-btn">Add</button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AllSupervisors;
