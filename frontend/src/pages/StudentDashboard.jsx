// === StudentDashboard.jsx ===
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import StudentSideBar from "../components/StudentSideBar";
import approveIcon from "../assets/approveicon.png";
import rejectionIcon from "../assets/rejecticon.png";
import deleteIcon from "../assets/delete.png";
import "./Admin.css";
import axios from "../axios";

const StudentDashboard = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState(null);
  const [loadingMe, setLoadingMe] = useState(true);
  const [myTeam, setMyTeam] = useState({
    hasApprovedTeam: false,
    members: [],
    counters: {},
    isAdmin: false,
    team: null,
  });
  const [invites, setInvites] = useState({ hideSection: false, invites: [] });

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [{ data: teamData }, { data: invData }] = await Promise.all([
        axios.get("/student/dashboard/my-team"),
        axios.get("/student/incoming-invites"),
      ]);
      setMyTeam(teamData);
      setInvites(invData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const handleCreateTeam = () => navigate("/student/createteam");

    // ✅ Fetch current logged-in user (same approach as AdminDashboard)
  useEffect(() => {
    (async () => {
      try {
        const { data } = await axios.get("/me", { withCredentials: true });
        setMe(data);
      } catch (e) {
        console.error("Failed to fetch user info");
      } finally {
        setLoadingMe(false);
      }
    })();
  }, []);

  // 👇 Extract first name safely
  const firstName = (me?.name || "").split(" ")[0] || "User";


  const removeMember = async (studentId) => {
    if (!myTeam.isAdmin || !myTeam.team) return;
    if (!window.confirm("Remove this member?")) return;
    await axios.delete(`/student/team/${myTeam.team.id}/member/${studentId}`);
    fetchAll();
  };

  const leaveTeam = async () => {
    if (!myTeam.team) return;
    if (!window.confirm("Are you sure you want to leave the team?")) return;
    await axios.post(`/student/team/${myTeam.team.id}/leave`);
    fetchAll();
  };

  const acceptInvite = async (teamId) => {
    await axios.post(`/student/incoming-invites/${teamId}/accept`);
    fetchAll();
  };

  const rejectInvite = async (teamId) => {
    await axios.post(`/student/incoming-invites/${teamId}/reject`);
    fetchAll();
  };

  return (
    <div className="admin-dashboard">
      <StudentSideBar />

      <div className="dashboard-content">
        <p className="welcome-message">
          {loadingMe ? "Welcome Back, ..." : `Welcome Back, ${firstName}`}
        </p>

        {/* Always-visible toolbar for Create/Edit Team */}
        <div className="dashboard-header" style={{ justifyContent: "flex-end" }}>
          <button className="add-admin-btn" onClick={handleCreateTeam}>
            Create/Edit Team
          </button>
        </div>

        {/* My Team Members (shown only if user is approved in a team) */}
        {myTeam.hasApprovedTeam && (
          <div className="dashboard-section">
            <div className="dashboard-header">
              <h3 className="section-title">My Team Members</h3>
              {myTeam?.hasApprovedTeam && (
                <button className="add-admin-btn" onClick={leaveTeam}>
                  Leave Team
                </button>
              )}
            </div>

            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Student Name</th>
                    <th>Student ID</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {myTeam.members.map((m, idx) => (
                    <tr key={m.id}>
                      <td>{idx + 1}</td>
                      <td>{m.name}</td>
                      <td>{m.id}</td>
                      <td>
                        <div className="action-icons">
                          <span
                            className={`status-badge ${
                              m.is_approved ? "approved" : "pending"
                            }`}
                          >
                            {m.is_approved ? "Approved" : "Pending"}
                          </span>
                          {myTeam.isAdmin && !m.is_admin && (
                            <img
                              src={deleteIcon}
                              className="action-icon"
                              alt="delete"
                              onClick={() => removeMember(m.id)}
                              style={{ cursor: "pointer" }}
                            />
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Incoming Requests (only if NOT approved anywhere) */}
        {!invites.hideSection && (
          <div className="dashboard-section">
            <h3 className="section-title">Incoming Requests</h3>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Team Name</th>
                    <th>Team's code</th>
                    <th>Team's Admin Approval State</th>
                  </tr>
                </thead>
                <tbody>
                  {invites.invites.map((r, i) => (
                    <tr key={r.team_id}>
                      <td>{i + 1}</td>
                      <td>{r.team_name}</td>
                      <td>{r.team_id}</td>
                      <td>
                        <div className="action-icons">
                          <img
                            src={approveIcon}
                            className="action-icon"
                            alt="approve"
                            onClick={() => acceptInvite(r.team_id)}
                            style={{ cursor: "pointer" }}
                          />
                          <img
                            src={rejectionIcon}
                            className="action-icon"
                            alt="reject"
                            onClick={() => rejectInvite(r.team_id)}
                            style={{ cursor: "pointer" }}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                  {invites.invites.length === 0 && (
                    <tr>
                      <td colSpan={4} style={{ textAlign: "center" }}>
                        No pending invites
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentDashboard;
