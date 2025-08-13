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

  const [firstName, setFirstName] = useState("");
  const [meId, setMeId] = useState(null);
  const [loadingMe, setLoadingMe] = useState(true);

  const [members, setMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(true);

  const [myRequests, setMyRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [isTeamMode, setIsTeamMode] = useState(false);

  // 🆕 حالة الـ Toast
  const [toastMsg, setToastMsg] = useState("");
  const [showToast, setShowToast] = useState(false);

  // دالة إظهار الـ Toast
  const triggerToast = (msg) => {
    setToastMsg(msg);
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
      setToastMsg("");
    }, 2000);
  };

  const fetchMembers = async () => {
    try {
      const res = await axios.get("/student/team/members", { withCredentials: true });
      setMembers(res?.data?.members || []);
    } catch {
      setMembers([]);
    } finally {
      setLoadingMembers(false);
    }
  };

  const fetchMyRequests = async () => {
    try {
      const resMine = await axios.get("/student/my-join-requests", { withCredentials: true });
      const mine = resMine?.data?.requests || [];
      if (mine.length > 0) {
        setMyRequests(mine);
        setIsTeamMode(false);
        return;
      }
      const resTeam = await axios.get("/student/team/requests", { withCredentials: true });
      setMyRequests(resTeam?.data?.requests || []);
      setIsTeamMode(true);
    } catch {
      setMyRequests([]);
    } finally {
      setLoadingRequests(false);
    }
  };

  const handleRemoveMember = async (studentId) => {
    try {
      await axios.delete(`/student/team/members/${studentId}`, { withCredentials: true });
      setMembers((prev) => prev.filter((m) => m.student_id !== studentId));
      triggerToast("Member removed");
    } catch (e) {
      console.error("Remove member failed", e?.response?.data || e);
    }
  };

  const handleAcceptInvite = async (req) => {
    const prev = [...myRequests];
    setMyRequests((curr) => curr.filter((r) => r.team_id !== req.team_id || r.student_id !== req.student_id));
    try {
      if (isTeamMode) {
        await axios.post(`/student/team/requests/${req.student_id}/approve`, {}, { withCredentials: true });
      } else {
        await axios.post(`/student/my-join-requests/${req.team_id}/accept`, {}, { withCredentials: true });
      }
      await fetchMembers();
      triggerToast("Request approved");
    } catch (e) {
      console.error("Accept failed", e?.response?.data || e);
      setMyRequests(prev);
    }
  };

  const handleRejectInvite = async (req) => {
    const prevRequests = [...myRequests];
    const prevMembers = [...members];

    setMyRequests((curr) => curr.filter((r) => r.team_id !== req.team_id || r.student_id !== req.student_id));

    if (isTeamMode && req.student_id) {
      setMembers((prev) => prev.filter((m) => m.student_id !== req.student_id));
    }

    try {
      if (isTeamMode) {
        await axios.post(`/student/team/requests/${req.student_id}/reject`, {}, { withCredentials: true });
      } else {
        await axios.post(`/student/my-join-requests/${req.team_id}/reject`, {}, { withCredentials: true });
      }
      triggerToast("Request rejected");
    } catch (e) {
      console.error("Reject failed", e?.response?.data || e);
      setMyRequests(prevRequests);
      setMembers(prevMembers);
    }
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data } = await axios.get("/me", { withCredentials: true });
        if (!mounted) return;
        const fullName = data?.name || "";
        setFirstName(fullName.split(" ")[0] || "User");
        setMeId(data?.id ?? null);
      } catch {
        if (!mounted) return;
        setFirstName("User");
      } finally {
        if (mounted) setLoadingMe(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    fetchMembers();
  }, []);

  useEffect(() => {
    fetchMyRequests();
  }, []);

  const handleCreateTeam = () => {
    navigate("/student/createteam");
  };

  const statusClass = (status) => {
    const s = (status || "").toLowerCase();
    if (s === "approved") return "approved";
    if (s === "rejected") return "rejected";
    return "pending";
  };

  const hasApprovedTeam =
    !!meId &&
    members.some((m) => m.student_id === meId && String(m.status || "").toLowerCase() === "approved");

  return (
    <div className="admin-dashboard">
      <StudentSideBar />

      {/* 🆕 Toast message */}
      {showToast && (
        <div style={{
          position: "fixed",
          top: "20px",
          right: "20px",
          backgroundColor: "#333",
          color: "#fff",
          padding: "10px 16px",
          borderRadius: "6px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
          zIndex: 1000,
          fontSize: "14px"
        }}>
          {toastMsg}
        </div>
      )}

      <div className="dashboard-content">
        <p className="welcome-message">
          Welcome Back, <strong>{loadingMe ? "..." : firstName}</strong>
        </p>

        {/* My Team Members */}
        <div className="dashboard-section">
          <div className="dashboard-header">
            <h3 className="section-title">My Team Members</h3>
            <button className="add-admin-btn" onClick={handleCreateTeam}>
              Create/Edit Team
            </button>
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
                {!loadingMembers && members && members.length > 0 ? (
                  members.map((m, idx) => (
                    <tr key={m.student_id}>
                      <td>{idx + 1}</td>
                      <td>{m.student_name}</td>
                      <td>{String(m.student_id).slice(-3).padStart(3, "0")}</td>
                      <td>
                        <div className="action-icons">
                          <span className={`status-badge ${statusClass(m.status)}`}>{m.status}</span>
                          <img
                            src={deleteIcon}
                            className="action-icon"
                            alt="delete"
                            title="Remove member"
                            onClick={() => handleRemoveMember(m.student_id)}
                          />
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} style={{ textAlign: "center" }}>No members yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Incoming Requests */}
        <div className="dashboard-section">
          <h3 className="section-title">Incoming Requests</h3>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Team Name</th>
                  <th>Team's code</th>
                  <th>Team's Admin</th>
                  <th>Approval State</th>
                </tr>
              </thead>
              <tbody>
                {!loadingRequests && myRequests && myRequests.length > 0 ? (
                  myRequests.map((r, idx) => {
                    const disableApprove = isTeamMode ? false : hasApprovedTeam;
                    return (
                      <tr key={`${r.team_id}-${r.student_id || "me"}`}>
                        <td>{idx + 1}</td>
                        <td>{r.team_name}</td>
                        <td>{r.team_code}</td>
                        <td>{r.admin_name || "-"}</td>
                        <td>
                          <div className="action-icons">
                            <img
                              src={approveIcon}
                              className="action-icon"
                              alt="approve"
                              title={disableApprove ? "You are already in another team" : "Accept"}
                              onClick={() => !disableApprove && handleAcceptInvite(r)}
                              style={disableApprove ? { opacity: 0.4, pointerEvents: "none" } : {}}
                            />
                            <img
                              src={rejectionIcon}
                              className="action-icon"
                              alt="reject"
                              title="Reject"
                              onClick={() => handleRejectInvite(r)}
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} style={{ textAlign: "center" }}>There are no joining requests at the moment.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
