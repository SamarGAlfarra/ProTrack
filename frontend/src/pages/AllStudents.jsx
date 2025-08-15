import React, { useState, useRef, useEffect } from 'react';
import './Admin.css';
import AdminSidebar from '../components/AdminSideBar';
import peopleIcon from '../assets/delete.png';
import closeIcon from '../assets/xbutton.png';
import searchIcon from '../assets/search.png';
import axios from '../axios'; // ✅ uses your configured axios instance
import Department from '../components/Department.jsx'; // ✅ ADDED

const AllStudents = () => {
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

  // ✅ fetch approved students + project + supervisor
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [firstName, setFirstName] = useState('');

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        // ✅ Get logged-in user info
        const res = await axios.get('/me', { withCredentials: true });
        if (mounted && res.data?.name) {
          setFirstName(res.data.name.split(' ')[0]); // First word of name
        }
      } catch (err) {
        console.error('Failed to fetch user info', err);
      }
    })();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const { data } = await axios.get('/admin/students');
        if (mounted) setRows(data || []);
      } catch (e) {
        if (mounted) setError('Failed to load students.');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

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

  const safe = (v) => (v ?? '').toString().toLowerCase();

  const filteredStudents = rows.filter((s) =>
    safe(s.student_name).includes(searchTerms.name) &&
    safe(s.student_id).includes(searchTerms.studentId) &&
    safe(s.department).includes(searchTerms.department) &&
    safe(s.supervisor_name).includes(searchTerms.supervisor) &&
    safe(s.project_id).includes(searchTerms.projectId)
  );

  // ===== Add Student popup state & handlers (ADDED) =====
  const [form, setForm] = useState({
    name: '',
    studentId: '',
    email: '',
    password: '',
    department: '', // from <Department />
  });
  const [saving, setSaving] = useState(false);
  const [saveErr, setSaveErr] = useState('');

  const onFormChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setSaveErr('');

    if (!form.name || !form.studentId || !form.email || !form.password) {
      setSaveErr('Name, ID, Email, and Password are required.');
      return;
    }

    try {
      setSaving(true);

      // Send department as FK id (or null)
      const payload = {
        name: form.name,
        studentId: form.studentId,
        email: form.email,
        password: form.password,
        department: form.department ? Number(form.department) : null,
      };

      // Backend should create user+student and return:
      // { student_id, student_name, department, project_id, supervisor_name }
      const { data } = await axios.post('/admin/addStudent', payload);

      // Prepend new row to table
      setRows(prev => [data, ...prev]);

      // reset & close
      setForm({ name: '', studentId: '', email: '', password: '', department: '' });
      setShowPopup(false);
    } catch (err) {
      setSaveErr(err?.response?.data?.message || 'Failed to add student.');
    } finally {
      setSaving(false);
    }
  };
  // ======================================================

  return (
    <div className="admin-dashboard">
      <AdminSidebar />
      <div className="dashboard-content">
        <div className="welcome-semester-container">
          <h2 className="welcome-message">
            Welcome Back, {firstName || '...'}
          </h2>
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
                      Supervisor Name
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
              {loading && (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center' }}>Loading…</td>
                </tr>
              )}
              {error && !loading && (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', color: 'red' }}>{error}</td>
                </tr>
              )}
              {!loading && !error && filteredStudents.map((student, index) => (
                <tr key={`${student.student_id}-${index}`}>
                  <td>{index + 1}</td>
                  <td><u>{student.student_name}</u></td>
                  <td>{student.student_id}</td>
                  <td>{student.department || '—'}</td>
                  <td>{student.supervisor_name || '—'}</td>
                  <td>{student.project_id || '—'}</td>
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
            <div className="popup-box" style={{ overflow: 'visible' }}>
              <div className="popup-header">
                <h3>Add Student</h3>
                <img
                  src={closeIcon}
                  alt="Close"
                  className="close-icon"
                  onClick={() => setShowPopup(false)}
                />
                </div>
              <form className="popup-form" onSubmit={onSubmit}>
                <input
                  type="text"
                  name="name"
                  placeholder="Name"
                  className="popup-input"
                  value={form.name}
                  onChange={onFormChange}
                />
                <input
                  type="text"
                  name="studentId"
                  placeholder="ID"
                  className="popup-input"
                  value={form.studentId}
                  onChange={onFormChange}
                />
                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  className="popup-input"
                  value={form.email}
                  onChange={onFormChange}
                />
                <input
                  type="password"
                  name="password"
                  placeholder="Password"
                  className="popup-input"
                  value={form.password}
                  onChange={onFormChange}
                />

                {/* Department selector (same as other pages) */}
                <Department
                  name="department"
                  value={form.department}
                  onChange={onFormChange} // expects {target:{name:'department', value:<deptId>}}
                />

                {saveErr && <div style={{ color: 'red', fontSize: 12, marginTop: 6 }}>{saveErr}</div>}

                <button type="submit" className="popup-submit-btn" disabled={saving}>
                  {saving ? 'Adding…' : 'Add'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AllStudents;
