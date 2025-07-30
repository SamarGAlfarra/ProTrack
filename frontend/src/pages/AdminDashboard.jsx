import React, { useState, useEffect, useRef } from 'react';
import AdminSidebar from '../components/AdminSideBar';
import './Admin.css';
import approveIcon from "../assets/approveicon.png";
import rejectIcon from "../assets/rejecticon.png";
import logoutIcon from "../assets/logout.png";
import searchIcon from "../assets/search.png";

const AdminDashboard = () => {
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
        setSearchTerms({
          userId: '',
          name: '',
          department: '',
          role: '',
        });
        setActiveSearch({
          userId: false,
          name: false,
          department: false,
          role: false,
        });
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleSearch = (field) => {
    setActiveSearch(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handleSearchChange = (field, value) => {
    setSearchTerms(prev => ({
      ...prev,
      [field]: value.toLowerCase()
    }));
  };

  const requests = [
    { id: 1, userId: '22020', name: 'XYZ1234', department: 'Computer Eng.', role: 'Student' },
    { id: 2, userId: 'Power', name: 'XYZ1234', department: 'Business', role: 'Admin' },
    { id: 3, userId: 'Power', name: 'XYZ1234', department: 'Literature', role: 'Supervisor' },
    { id: 4, userId: 'Power', name: 'XYZ1234', department: 'Physical Health', role: 'Student' },
  ];

  const filteredRequests = requests.filter(req =>
    req.userId.toLowerCase().includes(searchTerms.userId) &&
    req.name.toLowerCase().includes(searchTerms.name) &&
    req.department.toLowerCase().includes(searchTerms.department) &&
    req.role.toLowerCase().includes(searchTerms.role)
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
                <tr key={req.id}>
                  <td>{index + 1}</td>
                  <td>{req.userId}</td>
                  <td>{req.name}</td>
                  <td>{req.department}</td>
                  <td>{req.role}</td>
                  <td className="action-icons">
                    <img src={approveIcon} alt="Approve" className="action-icon" />
                    <img src={rejectIcon} alt="Reject" className="action-icon" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;





