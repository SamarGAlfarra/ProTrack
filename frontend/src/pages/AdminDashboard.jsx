import React, { useState, useEffect, useRef } from 'react';
import AdminSidebar from '../components/AdminSideBar';
import './Admin.css';
import approveIcon from "../assets/approveicon.png";
import rejectIcon from "../assets/rejecticon.png";
import searchIcon from "../assets/search.png";
import axios, { fetchPendingUsers, approvePendingUser, rejectPendingUser } from "../axios";

const AdminDashboard = () => {
  const [requests, setRequests] = useState([]);          // <-- from API
  const [loading, setLoading] = useState(true);          // optional
  const [error, setError] = useState(null);              // optional

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

  // ✅ Fetch pending users on mount
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await fetchPendingUsers(); // [{userId,name,department,role}]
        if (mounted) setRequests(data || []);
      } catch (e) {
        if (mounted) setError("Failed to load pending users.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const toggleSearch = (field) => {
    setActiveSearch(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handleApprove = async (userId) => {
  try {
    await approvePendingUser(userId);
    // Remove from table immediately
    setRequests(prev => prev.filter(u => u.userId !== userId));
  } catch (e) {
    setError(e?.response?.data?.message || "Approval failed.");
  }
};

const handleReject = async (userId) => {
  try {
    await rejectPendingUser(userId);
    // Remove from table immediately
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

  return (
    <div className="admin-dashboard">
      <AdminSidebar />

      <div className="dashboard-content">
        <div className="dashboard-header">
          <h2 className="welcome-message">Welcome Back, Ssre</h2>
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
