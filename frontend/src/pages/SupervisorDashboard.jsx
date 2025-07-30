import React, { useState, useEffect, useRef } from 'react';
import SupervisorSideBar from '../components/SupervisorSideBar';
import './Admin.css'; // Include CSS here
import approveIcon from "../assets/approveicon.png";
import rejectIcon from "../assets/rejecticon.png";
import searchIcon from "../assets/search.png";
import closeIcon from "../assets/xbutton.png"; // Use any red 'X' icon you have

const SupervisorDashboard = () => {
  const [showPopup, setShowPopup] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState('');
  const [searchTerms, setSearchTerms] = useState({ userId: '', name: '', department: '', role: '' });
  const [activeSearch, setActiveSearch] = useState({ userId: false, name: false, department: false, role: false });
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

  const toggleSearch = (field) => {
    setActiveSearch(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handleSearchChange = (field, value) => {
    setSearchTerms(prev => ({ ...prev, [field]: value.toLowerCase() }));
  };

  const handleTeamClick = (teamName) => {
    setSelectedTeam(teamName);
    setShowPopup(true);
  };

  const closePopup = () => {
    setShowPopup(false);
  };

  const requests = [
    { id: 1, userId: 'Power', name: 'XYZ1234', department: 'Computer Eng.', role: 'Student' },
    { id: 2, userId: 'Flowers', name: 'XYZ1234', department: 'Business', role: 'Admin' },
    { id: 3, userId: 'AI', name: 'XYZ1234', department: 'Literature', role: 'Supervisor' },
    { id: 4, userId: 'ProTrack', name: 'XYZ1234', department: 'Physical Health', role: 'Student' },
  ];

  const filteredRequests = requests.filter(req =>
    req.userId.toLowerCase().includes(searchTerms.userId) &&
    req.name.toLowerCase().includes(searchTerms.name) &&
    req.department.toLowerCase().includes(searchTerms.department) &&
    req.role.toLowerCase().includes(searchTerms.role)
  );

  // Dummy team members
  const teamMembers = [
    { name: 'Student A', id: '202301' },
    { name: 'Student B', id: '202302' },
    { name: 'Student C', id: '202303' },
    { name: 'Student D', id: '202304' },
  ];

  return (
    <div className="admin-dashboard">
      <SupervisorSideBar />

      <div className="dashboard-content">
        <div className="dashboard-header">
          <h2 className="welcome-message">Welcome Back, Ssre</h2>
        </div>

        <h3 className="section-title">Incoming Sign Up Requests</h3>

        <div className="table-wrapper" ref={tableRef}>
          <table className="requests-table">
            <thead>
              <tr>
                <th>#</th>
                <th>
                  {activeSearch.userId ? (
                    <input type="text" placeholder="Search Team" className="column-search" onChange={(e) => handleSearchChange('userId', e.target.value)} autoFocus />
                  ) : (
                    <span className="header-label">
                      Team Name
                      <img src={searchIcon} alt="Search" className="search-icon" onClick={() => toggleSearch('userId')} />
                    </span>
                  )}
                </th>
                <th>
                  {activeSearch.name ? (
                    <input type="text" placeholder="Search Code" className="column-search" onChange={(e) => handleSearchChange('name', e.target.value)} autoFocus />
                  ) : (
                    <span className="header-label">
                      Team’s code
                      <img src={searchIcon} alt="Search" className="search-icon" onClick={() => toggleSearch('name')} />
                    </span>
                  )}
                </th>
                <th>Project Name</th>
                <th>Approval State</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.map((req, index) => (
                <tr key={req.id}>
                  <td>{index + 1}</td>
                  <td
                    className="clickable-name"
                    onClick={() => handleTeamClick(req.userId)}
                  >
                    {req.userId}
                  </td>
                  <td>{req.name}</td>
                  <td>{req.department}</td>
                  <td className="action-icons">
                    <img src={approveIcon} alt="Approve" className="action-icon" />
                    <img src={rejectIcon} alt="Reject" className="action-icon" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* === Popup === */}
        {showPopup && (
          <div className="team-popup-overlay">
            <div className="team-popup-box">
              <div className="team-popup-header">
                <span>{selectedTeam}</span>
                <img
                src={closeIcon}
                alt="Close"
                className="close-icon"
                onClick={closePopup}
              />
              </div>
              <table className="team-popup-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Student Name</th>
                    <th>Student ID</th>
                  </tr>
                </thead>
                <tbody>
                  {teamMembers.map((member, i) => (
                    <tr key={i}>
                      <td>{i + 1}</td>
                      <td>{member.name}</td>
                      <td>{member.id}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SupervisorDashboard;
