import React, { useState, useEffect, useRef } from 'react';
import AdminSidebar from '../components/AdminSideBar';
import './Admin.css';
import approveIcon from "../assets/approveicon.png";
import rejectIcon from "../assets/rejecticon.png";
import searchIcon from "../assets/search.png";
import editIcon from '../assets/edit.png';
import api, { fetchPendingUsers, approvePendingUser, rejectPendingUser } from "../axios";

const AdminDashboard = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 👇 For logged-in user info
  const [me, setMe] = useState(null);
  const [loadingMe, setLoadingMe] = useState(true);

  const [searchTerms, setSearchTerms] = useState({
    userId: '',
    name: '',
    department: '',
    role: '',
  });

  const [activeSearch, setActiveSearch] = useState({
    userId: false,
    name: false,
    department: false,
    role: false,
  });

  const tableRef = useRef(null);

  // ===== Current Semester state (moved here) =====
  const [semester, setSemester] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [tempSemester, setTempSemester] = useState('');
  const [savingSemester, setSavingSemester] = useState(false);
  const [semLoadError, setSemLoadError] = useState('');
  const [semFormatError, setSemFormatError] = useState('');
  const isValidSemester = (s) => /^\d{4}[123]$/.test(String(s || '').trim());
  // ==============================================

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (tableRef.current && !tableRef.current.contains(event.target)) {
        setSearchTerms({ userId: '', name: '', department: '', role: '' });
        setActiveSearch({ userId: false, name: false, department: false, role: false });
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ✅ Fetch current logged-in user
  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/me', { withCredentials: true });
        setMe(data);
      } catch (e) {
        console.error("Failed to fetch user info");
      } finally {
        setLoadingMe(false);
      }
    })();
  }, []);

  // ✅ Fetch pending users on mount
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await fetchPendingUsers();
        if (mounted) setRequests(data || []);
      } catch (e) {
        if (mounted) setError("Failed to load pending users.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // 🆕 Load current semester from API (moved here)
  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/semesters/current');
        const current = data?.id || data?.name || '';
        setSemester(current);
        setTempSemester(current);
      } catch (e) {
        setSemLoadError('Failed to load current semester.');
      }
    })();
  }, []);

  const toggleSearch = (field) => {
    setActiveSearch(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handleApprove = async (userId) => {
    try {
      await approvePendingUser(userId);
      setRequests(prev => prev.filter(u => u.userId !== userId));
    } catch (e) {
      setError(e?.response?.data?.message || "Approval failed.");
    }
  };

  const handleReject = async (userId) => {
    try {
      await rejectPendingUser(userId);
      setRequests(prev => prev.filter(u => u.userId !== userId));
    } catch (e) {
      setError(e?.response?.data?.message || "Rejection failed.");
    }
  };

  const handleSearchChange = (field, value) => {
    setSearchTerms(prev => ({ ...prev, [field]: value.toLowerCase() }));
  };

  const filteredRequests = requests.filter(req =>
    String(req.userId ?? '').toLowerCase().includes(searchTerms.userId) &&
    String(req.name ?? '').toLowerCase().includes(searchTerms.name) &&
    String(req.department ?? '').toLowerCase().includes(searchTerms.department) &&
    String(req.role ?? '').toLowerCase().includes(searchTerms.role)
  );

  // 👇 Extract first name safely
  const firstName = (me?.name || '').split(' ')[0] || 'User';

  // ===== Semester handlers (moved here) =====
  const handleEditClick = () => setIsEditing(true);

  const handleSemesterChange = (e) => {
    const val = e.target.value;
    setTempSemester(val);
    if (!val) {
      setSemFormatError('');
    } else {
      setSemFormatError(
        isValidSemester(val)
          ? ''
          : 'Semester format must be YYYY + 1|2|3 (stands for fall, spring or summer semester) (e.g., 20251)'
      );
    }
  };

  const handleSemesterBlur = async () => {
    const value = (tempSemester || '').trim();

    if (!value) {
      setSemFormatError('');
      setIsEditing(false);
      setTempSemester(semester);
      return;
    }

    if (!isValidSemester(value)) {
      setSemFormatError('Semester format must be YYYY + 1|2|3 (stands for fall, spring or summer semester) (e.g., 20251)');
      setIsEditing(true);
      return;
    }

    if (value === semester) {
      setSemFormatError('');
      setIsEditing(false);
      return;
    }

    try {
      setSavingSemester(true);
      setSemLoadError('');
      setSemFormatError('');

      const termDigit = value.slice(-1);
      const termMap = { '1': 'fall', '2': 'spring', '3': 'summer' };
      const name = termMap[termDigit] || '';

      const { data } = await api.put('/semesters/current', { id: value, name });
      const updated = data?.id || value;
      setSemester(updated);
      setTempSemester(updated);
      setIsEditing(false);
    } catch (e) {
      setSemLoadError(e?.response?.data?.message || 'Failed to update current semester.');
      setTempSemester(semester);
      setIsEditing(false);
    } finally {
      setSavingSemester(false);
    }
  };
  // ==========================================

  return (
    <div className="admin-dashboard">
      <AdminSidebar />

      <div className="dashboard-content">
        <div className="dashboard-header">
          <h2 className="welcome-message">
            {loadingMe ? "Welcome Back, ..." : `Welcome Back, ${firstName}`}
          </h2>

          {/* ===== Current Semester box (now here) ===== */}
          <div className="semester-box">
            <span className="semester-label">Current Semester</span>
            {isEditing ? (
              <div className="semester-edit-wrap">
                <input
                  type="text"
                  className={`semester-input ${semFormatError ? 'invalid' : ''}`}
                  value={tempSemester}
                  onChange={handleSemesterChange}
                  onBlur={handleSemesterBlur}
                  disabled={savingSemester}
                  inputMode="numeric"
                  maxLength={5}
                  placeholder="e.g., 20251"
                  autoFocus
                />
                {semFormatError && (
                  <span style={{ color: 'red', fontSize: '12px', marginTop: '4px' }}>
                    {semFormatError}
                  </span>
                )}
              </div>
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
          {/* ============================================ */}
        </div>

        <h3 className="section-title">Incoming Sign Up Requests</h3>

        <div className="table-wrapper" ref={tableRef}>
          {loading ? (
            <div>Loading...</div>
          ) : error ? (
            <div>{error}</div>
          ) : (
            <table className="requests-table">
              <colgroup>
                <col className="col-small" />
                <col className="col-medium" />
                <col className="col-medium" />
                <col className="col-medium" />
                <col className="col-medium" />
                <col className="col-actions" />
              </colgroup>
              <thead>
                <tr>
                  <th>#</th>
                  <th>
                    {activeSearch.userId ? (
                      <input
                        type="text"
                        placeholder="Search ID"
                        className="column-search"
                        onChange={(e) => handleSearchChange('userId', e.target.value)}
                        autoFocus
                      />
                    ) : (
                      <span className="header-label">
                        ID
                        <img
                          src={searchIcon}
                          alt="Search"
                          className="search-icon"
                          onClick={() => toggleSearch('userId')}
                        />
                      </span>
                    )}
                  </th>
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
                        Name
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
                  <th>Approval State</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.map((req, index) => (
                  <tr key={req.userId}>
                    <td>{index + 1}</td>
                    <td>{req.userId}</td>
                    <td>{req.name}</td>
                    <td>{req.department || '-'}</td>
                    <td>{req.role}</td>
                    <td className="action-icons">
                      <img
                        src={approveIcon}
                        alt="Approve"
                        className="action-icon"
                        onClick={() => handleApprove(req.userId)}
                      />
                      <img
                        src={rejectIcon}
                        alt="Reject"
                        className="action-icon"
                        onClick={() => handleReject(req.userId)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;