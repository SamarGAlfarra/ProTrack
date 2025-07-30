// === StudentDashboard.jsx ===
import React from "react";
import { useNavigate } from "react-router-dom";
import StudentSideBar from "../components/StudentSideBar";
import approveIcon from "../assets/approveicon.png";
import rejectionIcon from "../assets/rejecticon.png";
import deleteIcon from "../assets/delete.png";
import './Admin.css';

const StudentDashboard = () => {
  const navigate = useNavigate(); 

  const handleCreateTeam = () => {
    navigate("/student/createteam");
  };

  return (
    <div className="admin-dashboard">
      <StudentSideBar />

      <div className="dashboard-content">
        <p className="welcome-message">Welcome Back, <strong>Ssre</strong></p>

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
                <tr>
                  <td>1</td>
                  <td>Ali Ahmad</td>
                  <td>001</td>
                  <td>
                    <div className="action-icons">
                      <span className="status-badge approved">Approved</span>
                      <img src={deleteIcon} className="action-icon" alt="delete" />
                    </div>
                  </td>
                </tr>
                <tr>
                  <td>2</td>
                  <td>Layla Khan</td>
                  <td>002</td>
                  <td>
                    <div className="action-icons">
                      <span className="status-badge pending">Pending</span>
                      <img src={deleteIcon} className="action-icon" alt="delete" />
                    </div>
                  </td>
                </tr>
                <tr>
                  <td>3</td>
                  <td>Yousef Omar</td>
                  <td>003</td>
                  <td>
                    <div className="action-icons">
                      <span className="status-badge rejected">Rejected</span>
                      <img src={deleteIcon} className="action-icon" alt="delete" />
                    </div>
                  </td>
                </tr>
                <tr>
                  <td>4</td>
                  <td>Fatma Zaid</td>
                  <td>004</td>
                  <td>
                    <div className="action-icons">
                      <span className="status-badge approved">Approved</span>
                      <img src={deleteIcon} className="action-icon" alt="delete" />
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

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
                {[1, 2, 3, 4].map((n) => (
                  <tr key={n}>
                    <td>{n}</td>
                    <td>Team {String.fromCharCode(64 + n)}</td>
                    <td>{String.fromCharCode(64 + n)}{n}23</td>
                    <td>
                      <div className="action-icons">
                        <img src={approveIcon} className="action-icon" alt="approve" />
                        <img src={rejectionIcon} className="action-icon" alt="reject" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
