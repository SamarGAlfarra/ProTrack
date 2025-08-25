import React, { useState, useEffect, useRef } from 'react';
import SupervisorSideBar from '../components/SupervisorSideBar';
import './Admin.css';
import approveIcon from "../assets/approveicon.png";
import rejectIcon from "../assets/rejecticon.png";
import searchIcon from "../assets/search.png";
import closeIcon from "../assets/xbutton.png";
import axios from "../axios";

const SupervisorDashboard = () => {
  const [showPopup, setShowPopup] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState('');
  const [selectedTeamId, setSelectedTeamId] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(false);

  // 👇 fetch logged-in user (like StudentDashboard)
  const [me, setMe] = useState(null);
  const [loadingMe, setLoadingMe] = useState(true);

  const [searchTerms, setSearchTerms] = useState({ teamName: '', teamCode: '', ProjectName: '' });
  const [activeSearch, setActiveSearch] = useState({ teamName: false, teamCode: false, ProjectName: false });
  const tableRef = useRef(null);

  const [requests, setRequests] = useState([]);

  // ========== Get user info ==========
  useEffect(() => {
    (async () => {
      try {
        const { data } = await axios.get('/me', { withCredentials: true });
        setMe(data);
      } catch (e) {
        console.error('Failed to fetch user info', e);
      } finally {
        setLoadingMe(false);
      }
    })();
  }, []);

  // Safely extract first name
  const firstName = (me?.name || '').split(' ')[0] || 'Supervisor';

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

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const { data } = await axios.get('/supervisor/incoming-requests');
        // data.requests = [{ team_id, project_id, team_name, project_title }]
        const mapped = (data.requests || []).map((r) => ({
          id: `${r.team_id}:${r.project_id}`,
          teamId: r.team_id,
          projectId: r.project_id,
          teamName: r.team_name,
          teamCode: String(r.team_id),
          ProjectName: r.project_title,
        }));
        setRequests(mapped);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const toggleSearch = (field) => setActiveSearch(prev => ({ ...prev, [field]: !prev[field] }));
  const handleSearchChange = (field, value) => setSearchTerms(prev => ({ ...prev, [field]: value.toLowerCase() }));

  const handleTeamClick = async (teamName, teamId) => {
    setSelectedTeam(teamName);
    setSelectedTeamId(teamId);
    setShowPopup(true);
    try {
      const { data } = await axios.get(`/supervisor/team/${teamId}/members`);
      setTeamMembers(data.members || []);
    } catch (e) {
      console.error(e);
      setTeamMembers([]);
    }
  };

  const closePopup = () => {
    setShowPopup(false);
    setSelectedTeam('');
    setSelectedTeamId(null);
    setTeamMembers([]);
  };

  const handleDecision = async (teamId, projectId, newStatus) => {
    try {
      await axios.patch(`/supervisor/team-applications/${teamId}/${projectId}`, { status: newStatus });
      setRequests(prev => prev.filter(r => !(r.teamId === teamId && r.projectId === projectId)));
    } catch (e) {
      const msg = e?.response?.data?.message || e.message;
      console.error('Decision failed:', msg);
      alert(`Action failed: ${msg}`);
    }
  };

  const filteredRequests = requests.filter(req =>
    req.teamName.toLowerCase().includes(searchTerms.teamName) &&
    req.teamCode.toLowerCase().includes(searchTerms.teamCode) &&
    req.ProjectName.toLowerCase().includes(searchTerms.ProjectName)
  );

  return (
    <div className="admin-dashboard">
      <SupervisorSideBar />

      <div className="dashboard-content">
        <div className="dashboard-header">
          <h2 className="welcome-message">
            {loadingMe ? 'Welcome Back, …' : `Welcome Back, ${firstName}`}
          </h2>
        </div>

        <h3 className="section-title">Incoming Requests</h3>

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
                      <img src={searchIcon} alt="Search" className="search-icon" onClick={() => toggleSearch('teamName')} />
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
                      <img src={searchIcon} alt="Search" className="search-icon" onClick={() => toggleSearch('teamCode')} />
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
                      <img src={searchIcon} alt="Search" className="search-icon" onClick={() => toggleSearch('ProjectName')} />
                    </span>
                  )}
                </th>
                <th>Approval State</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5">Loading…</td></tr>
              ) : filteredRequests.length === 0 ? (
                <tr><td colSpan="5">No pending requests.</td></tr>
              ) : (
                filteredRequests.map((req, index) => (
                  <tr key={req.id}>
                    <td>{index + 1}</td>
                    <td className="clickable-name" onClick={() => handleTeamClick(req.teamName, req.teamId)}>
                      {req.teamName}
                    </td>
                    <td>{req.teamCode}</td>
                    <td>{req.ProjectName}</td>
                    <td className="action-icons">
                      <img
                        src={approveIcon}
                        alt="Approve"
                        className="action-icon"
                        title="Approve"
                        onClick={() => handleDecision(req.teamId, req.projectId, 'Approved')}
                      />
                      <img
                        src={rejectIcon}
                        alt="Reject"
                        className="action-icon"
                        title="Reject"
                        onClick={() => handleDecision(req.teamId, req.projectId, 'Rejected')}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {showPopup && (
          <div className="team-popup-overlay">
            <div className="team-popup-box">
              <div className="team-popup-header">
                <span>{selectedTeam}</span>
                <img src={closeIcon} alt="Close" className="close-icon" onClick={closePopup} />
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
                  {teamMembers.map((m, i) => (
                    <tr key={i}>
                      <td>{i + 1}</td>
                      <td>{m.name}</td>
                      <td>{m.student_id}</td>
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
