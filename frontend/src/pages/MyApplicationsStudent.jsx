import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import StudentSideBar from "../components/StudentSideBar";
import approveIcon from "../assets/approve.png";
import pendingIcon from "../assets/pending.png";
import rejectIcon from "../assets/reject.png";
import applyIcon from "../assets/apply.png";
import closeIcon from "../assets/xbutton.png";
import avatar from "../assets/avatar.png";
import axios from "../axios"; // ✅ use your axios wrapper
import "./MyApplicationsStudent.css";

const getStatusIcon = (status) => {
  switch (status) {
    case "Approved":
      return approveIcon;
    case "Pending":
      return pendingIcon;
    case "Rejected":
      return rejectIcon;
    default:
      return pendingIcon;
  }
};

const MyApplicationsStudent = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  // From API
  const [team, setTeam] = useState(null); // {id, name, is_admin:boolean} or null
  const [currentApp, setCurrentApp] = useState(null); // {project:{id,title,supervisor:{...}}, status}
  const [projects, setProjects] = useState([]); // array of {id,title, supervisor:{...}}

  const [selectedSupervisor, setSelectedSupervisor] = useState(null);

  const fetchOverview = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const { data } = await axios.get("/student/applications/overview");
      setTeam(data.team ?? null);
      setCurrentApp(data.current_application ?? null);
      setProjects(Array.isArray(data.available_projects) ? data.available_projects : []);
    } catch (e) {
      setErrorMsg(
        e?.response?.data?.message ||
          "Failed to load applications overview. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  const handleSupervisorClick = (supObj) => {
    if (!supObj) return;
    setSelectedSupervisor({
      name: supObj?.name || "",
      email: supObj?.email || "",
      phone: supObj?.phone_number || supObj?.phone || "",
      department: supObj?.department_name || supObj?.department || "",
      degree: supObj?.educational_degree || supObj?.degree || "",
    });
  };

  const closePopup = () => setSelectedSupervisor(null);

  const filteredProjects = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return projects;
    return projects.filter((p) => {
      const t = (p.title || "").toLowerCase();
      const s = (p?.supervisor?.name || "").toLowerCase();
      return t.includes(q) || s.includes(q);
    });
  }, [projects, searchTerm]);

  const canTeamApply =
    !!team &&
    team.is_admin === true &&
    (!currentApp || !["Pending", "Approved"].includes(currentApp?.status));

  const onApply = async (projectId) => {
    if (!team) return alert("You need a team this semester to apply.");
    if (!team.is_admin) return alert("Only the team admin can apply for a project.");
    if (currentApp && ["Pending", "Approved"].includes(currentApp.status)) {
      return alert("Your team already has a Pending/Approved project.");
    }
    try {
      await axios.post(`/student/applications/apply/${projectId}`);
      alert("Application submitted as Pending.");
      await fetchOverview(); // refresh UI
    } catch (e) {
      const msg =
        e?.response?.data?.message ||
        "Could not submit the application. Please try again.";
      alert(msg);
    }
  };

  return (
    <div className="student-projects-page">
      <StudentSideBar />
      <div className="main-content">
        <div className="filters">
          <input
            type="text"
            placeholder="Search by project or supervisor"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        {/* Errors / Loading */}
        {loading && <div className="project-list">Loading...</div>}
        {!loading && errorMsg && (
          <div className="project-list" style={{ color: "crimson" }}>
            {errorMsg}
          </div>
        )}

        {/* Highlighted current project (if the team already applied) */}
        {!loading && !errorMsg && currentApp && (
          <div className="highlighted-project">
            <div className="highlighted-info">
              <h4>{currentApp?.project?.title}</h4>
              <p
                className="supervisor-name clickable"
                onClick={() => handleSupervisorClick(currentApp?.project?.supervisor)}
              >
                {currentApp?.project?.supervisor?.name}
              </p>
              {currentApp?.project?.description ? (
                <div className="description-box">
                  <p className="description">{currentApp?.project?.description}</p>
                </div>
              ) : null}
            </div>
            <div className="status-indicator">
              <img src={getStatusIcon(currentApp?.status)} alt="status" />
              <p
                className={`status-label ${
                  currentApp?.status === "Approved"
                    ? "approved"
                    : currentApp?.status === "Rejected"
                    ? "rejected"
                    : "pending"
                }`}
              >
                {currentApp?.status}
              </p>
            </div>
          </div>
        )}

        {/* Available projects list */}
        {!loading && !errorMsg && (
          <div className="project-list">
            {filteredProjects.map((project) => (
              <div key={project.id} className="project-row">
                <Link
                  to={`/student/projectdetails/${project.id}`}
                  className="project-title clickable"
                >
                  {project.title}
                </Link>

                <span
                  className="supervised-by clickable"
                  onClick={() => handleSupervisorClick(project.supervisor)}
                >
                  Supervised By: <strong>{project?.supervisor?.name}</strong>
                </span>

                <img
                  src={applyIcon}
                  alt="apply"
                  className="apply-btn"
                  onClick={() => onApply(project.id)}
                  title={
                    canTeamApply
                      ? "Apply"
                      : team
                      ? team.is_admin
                        ? "You already have a Pending/Approved application"
                        : "Only the team admin can apply"
                      : "You need a team to apply"
                  }
                  style={{
                    opacity: canTeamApply ? 1 : 0.4,
                    cursor: canTeamApply ? "pointer" : "not-allowed",
                  }}
                />
              </div>
            ))}
            {filteredProjects.length === 0 && (
              <div className="project-row">No available projects.</div>
            )}
          </div>
        )}

        {/* Supervisor popup */}
        {selectedSupervisor && (
          <div className="supervisor-popup-overlay">
            <div className="supervisor-popup-box">
              <div className="supervisor-popup-header">
                <span>Supervisor Info</span>
                <img
                  src={closeIcon}
                  alt="Close"
                  className="close-icon"
                  onClick={closePopup}
                />
              </div>
              <div className="supervisor-popup-content">
                <div className="supervisor-popup-field">
                  Email ID: {selectedSupervisor.email || "—"}
                </div>
                <div className="supervisor-popup-field">
                  Phone Number: {selectedSupervisor.phone || "—"}
                </div>
                <div className="supervisor-popup-field">
                  Department: {selectedSupervisor.department || "—"}
                </div>
                <div className="supervisor-popup-field">
                  Educational Degree: {selectedSupervisor.degree || "—"}
                </div>
                <div className="supervisor-popup-field">Role: Supervisor</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyApplicationsStudent;
