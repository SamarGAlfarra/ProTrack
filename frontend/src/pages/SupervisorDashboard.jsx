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
  const [searchTerms, setSearchTerms] = useState({ teamName: '', teamCode: '', ProjectName: '' });
  const [activeSearch, setActiveSearch] = useState({ teamName: false, teamCode: false, ProjectName: false });
  const tableRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (tableRef.current && !tableRef.current.contains(event.target)) {
        setSearchTerms({ teamName: '', teamCode: '', ProjectName: '' });
        setActiveSearch({ teamName: false, teamCode: false, ProjectName: false });
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
    { id: 1, teamName: 'Power', teamCode: 'XYZ1234', ProjectName: 'Computer Eng.' },
    { id: 2, teamName: 'Flowers', teamCode: 'XYZ2345', ProjectName: 'Business' },
    { id: 3, teamName: 'AI', teamCode: 'XYZ3456', ProjectName: 'Literature' },
    { id: 4, teamName: 'ProTrack', teamCode: 'XYZ4567', ProjectName: 'Physical Health' },
  ];

  const filteredRequests = requests.filter(req =>
    req.teamName.toLowerCase().includes(searchTerms.teamName) &&
    req.teamCode.toLowerCase().includes(searchTerms.teamCode) &&
    req.ProjectName.toLowerCase().includes(searchTerms.ProjectName)
  );

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
          <h2 className="welcome-message">Welcome Back, Supervisor</h2>
        </div>

        <h3 className="section-title">Incoming Sign Up Requests</h3>

        <div className="table-wrapper" ref={tableRef}>
          <table className="requests-table">
            <thead>
              <tr>
                <th>#</th>
                <th>
                  {activeSearch.teamName ? (
                    <input
                      type="text"
                      placeholder="Search Team"
                      className="column-search"
                      onChange={(e) => handleSearchChange('teamName', e.target.value)}
                      autoFocus
                    />
                  ) : (
                    <span className="header-label">
                      Team Name
                      <img
                        src={searchIcon}
                        alt="Search"
                        className="search-icon"
                        onClick={() => toggleSearch('teamName')}
                      />
                    </span>
                  )}
                </th>
                <th>
                  {activeSearch.teamCode ? (
                    <input
                      type="text"
                      placeholder="Search Code"
                      className="column-search"
                      onChange={(e) => handleSearchChange('teamCode', e.target.value)}
                      autoFocus
                    />
                  ) : (
                    <span className="header-label">
                      Team’s Code
                      <img
                        src={searchIcon}
                        alt="Search"
                        className="search-icon"
                        onClick={() => toggleSearch('teamCode')}
                      />
                    </span>
                  )}
                </th>
                <th>
                  {activeSearch.ProjectName ? (
                    <input
                      type="text"
                      placeholder="Search Project Name"
                      className="column-search"
                      onChange={(e) => handleSearchChange('ProjectName', e.target.value)}
                      autoFocus
                    />
                  ) : (
                    <span className="header-label">
                      Project Name
                      <img
                        src={searchIcon}
                        alt="Search"
                        className="search-icon"
                        onClick={() => toggleSearch('ProjectName')}
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
                  <td
                    className="clickable-name"
                    onClick={() => handleTeamClick(req.teamName)}
                  >
                    {req.teamName}
                  </td>
                  <td>{req.teamCode}</td>
                  <td>{req.ProjectName}</td>
                  <td className="action-icons">
                    <img src={approveIcon} alt="Approve" className="action-icon" />
                    <img src={rejectIcon} alt="Reject" className="action-icon" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

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
