import React, { useState, useRef, useEffect } from 'react';
import './Admin.css';
import AdminSidebar from '../components/AdminSideBar';
import editIcon from '../assets/edit.png';
import peopleIcon from '../assets/delete.png';
import closeIcon from '../assets/xbutton.png';
import searchIcon from '../assets/search.png';
import logoutIcon from '../assets/logout.png';
import axios from '../axios'; // ✅ your configured axios (withCredentials true)

const AllAdmins = () => {
  const [semester, setSemester] = useState('');               // 🔄 will load from API
  const [isEditing, setIsEditing] = useState(false);
  const [tempSemester, setTempSemester] = useState('');
  const [showPopup, setShowPopup] = useState(false);

  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // current user
  const [me, setMe] = useState(null);
  const [loadingMe, setLoadingMe] = useState(true);

  const [savingSemester, setSavingSemester] = useState(false); // 🆕 UX while saving
  const [semLoadError, setSemLoadError] = useState('');        // 🆕 error display

  const [searchTerms, setSearchTerms] = useState({
    name: '',
    adminId: '',
    department: '',
    role: '',
  });

  const [activeSearch, setActiveSearch] = useState({
    name: false,
    adminId: false,
    department: false,
    role: false,
  });

  const tableRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (tableRef.current && !tableRef.current.contains(event.target)) {
        setSearchTerms({ name: '', adminId: '', department: '', role: '' });
        setActiveSearch({ name: false, adminId: false, department: false, role: false });
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // /me
  useEffect(() => {
    (async () => {
      try {
        const { data } = await axios.get('/me');
        setMe(data);
      } catch {}
      finally { setLoadingMe(false); }
    })();
  }, []);

  // 🆕 Load current semester from API
  useEffect(() => {
    (async () => {
      try {
        const { data } = await axios.get('/semesters/current'); // { id: '20211', name: '20211' }
        const current = data?.id || data?.name || '';
        setSemester(current);
        setTempSemester(current);
      } catch (e) {
        setSemLoadError('Failed to load current semester.');
      }
    })();
  }, []);

  // Load admins
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await axios.get('/admin/admins');
        if (mounted) setAdmins(res.data || []);
      } catch (e) {
        if (mounted) setError('Failed to load admins.');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const handleEditClick = () => setIsEditing(true);
  const handleSemesterChange = (e) => setTempSemester(e.target.value);

  // 🆕 Save on blur: create if missing, set as current
  const handleSemesterBlur = async () => {
    setIsEditing(false);

    const value = (tempSemester || '').trim();
    if (!value || value === semester) {
      // nothing to do or unchanged
      setTempSemester(semester);
      return;
    }

    try {
      setSavingSemester(true);
      setSemLoadError('');
      // PUT /semesters/current { id: "20212" }
      const { data } = await axios.put('/semesters/current', { id: value });
      const updated = data?.id || value;
      setSemester(updated);
      setTempSemester(updated);
    } catch (e) {
      setSemLoadError(e?.response?.data?.message || 'Failed to update current semester.');
      // revert UI
      setTempSemester(semester);
    } finally {
      setSavingSemester(false);
    }
  };

  const handleSearchChange = (field, value) => {
    setSearchTerms(prev => ({ ...prev, [field]: value.toLowerCase() }));
  };

  const toggleSearch = (field) => {
    setActiveSearch(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const filteredAdmins = admins.filter(admin =>
    String(admin.name || '').toLowerCase().includes(searchTerms.name) &&
    String(admin.adminId || '').toLowerCase().includes(searchTerms.adminId) &&
    String(admin.department || '').toLowerCase().includes(searchTerms.department) &&
    String(admin.role || '').toLowerCase().includes(searchTerms.role)
  );

  const firstName = (me?.name || '').split(' ')[0] || 'User';

  return (
    <div className="admin-dashboard">
      <AdminSidebar />

      <div className="dashboard-content">
        <div className="dashboard-header">
          <div className="welcome-semester-container">
            <h2 className="welcome-message">
              {loadingMe ? 'Welcome Back, ...' : `Welcome Back, ${firstName}`}
            </h2>

            <div className="semester-box">
              <span className="semester-label">Current Semester</span>
              {isEditing ? (
                <input
                  type="text"
                  className="semester-input"
                  value={tempSemester}
                  onChange={handleSemesterChange}
                  onBlur={handleSemesterBlur} // 🆕 saves on blur
                  disabled={savingSemester}
                  autoFocus
                />
              ) : (
                <>
                  <span className="semester-value">
                    {semester || (semLoadError ? '—' : 'Loading…')}
                  </span>
                  <img
                    src={editIcon}
                    alt="Edit"
                    className={`action-icon ${savingSemester ? 'disabled' : ''}`}
                    style={{ opacity: savingSemester ? 0.6 : 1, pointerEvents: savingSemester ? 'none' : 'auto' }}
                    onClick={handleEditClick}
                  />
                </>
              )}
            </div>

            {semLoadError && (
              <div style={{ color: 'red', fontSize: 12, marginTop: 6 }}>
                {semLoadError}
              </div>
            )}
          </div>
        </div>

        <div className="header-row">
          <h3 className="section-title">All Admins</h3>
          <button className="add-admin-btn" onClick={() => setShowPopup(true)}>Add Admin</button>
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
                      Admin's Name
                      <img src={searchIcon} alt="Search" className="search-icon" onClick={() => toggleSearch('name')} />
                    </span>
                  )}
                </th>
                <th>
                  {activeSearch.adminId ? (
                    <input
                      type="text"
                      placeholder="Search ID"
                      className="column-search"
                      onChange={(e) => handleSearchChange('adminId', e.target.value)}
                      autoFocus
                    />
                  ) : (
                    <span className="header-label">
                      Admin's ID
                      <img src={searchIcon} alt="Search" className="search-icon" onClick={() => toggleSearch('adminId')} />
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
                      <img src={searchIcon} alt="Search" className="search-icon" onClick={() => toggleSearch('department')} />
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
                      <img src={searchIcon} alt="Search" className="search-icon" onClick={() => toggleSearch('role')} />
                    </span>
                  )}
                </th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr><td colSpan="6">Loading...</td></tr>
              ) : error ? (
                <tr><td colSpan="6">{error}</td></tr>
              ) : (
                filteredAdmins.map((admin, index) => (
                  <tr key={admin.adminId || index}>
                    <td>{index + 1}</td>
                    <td><u>{admin.name}</u></td>
                    <td>{admin.adminId}</td>
                    <td>{admin.department}</td>
                    <td>{admin.role}</td>
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

        {showPopup && (
          <div className="popup-overlay">
            <div className="popup-box">
              <div className="popup-header">
                <h3>Add Admin</h3>
                <img src={closeIcon} alt="Close" className="close-icon" onClick={() => setShowPopup(false)} />
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

export default AllAdmins;
