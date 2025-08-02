import React, { useState } from "react";
import { Link } from "react-router-dom"; // ✅ تم إضافته
import StudentSideBar from "../components/StudentSideBar";
import approveIcon from "../assets/approve.png";
import pendingIcon from "../assets/pending.png";
import rejectIcon from "../assets/reject.png";
import applyIcon from "../assets/apply.png";
import closeIcon from "../assets/xbutton.png";
import avatar from "../assets/avatar.png";
import "./MyApplicationsStudent.css";

const originalProjects = [
  {
    id: 1,
    title: "Restaurant Website",
    supervisor: "Wesam Ashour",
    description:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua...",
    status: "Approved",
  },
  {
    id: 2,
    title: "Mobile App",
    supervisor: "Ruba Salamah",
    status: "Pending",
  },
  {
    id: 3,
    title: "Mobile App",
    supervisor: "Ahmed Mahdi",
    status: "Pending",
  },
  {
    id: 4,
    title: "Mobile App",
    supervisor: "Aiman Abusamara",
    status: "Pending",
  },
];

const supervisorInfo = {
  "Wesam Ashour": {
    email: "wesam@gmail.com",
    phone: "00970597602311",
    department: "Computer Engineering",
    degree: "PHD in IT",
  },
  "Ruba Salamah": {
    email: "ruba@gmail.com",
    phone: "00970590112233",
    department: "Software Engineering",
    degree: "Master in SE",
  },
  "Ahmed Mahdi": {
    email: "ahmed@gmail.com",
    phone: "00970593456789",
    department: "Cybersecurity",
    degree: "PHD in Cybersecurity",
  },
  "Aiman Abusamara": {
    email: "aiman@gmail.com",
    phone: "00970599887766",
    department: "Information Technology",
    degree: "Master in IT",
  },
};

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
  const [selectedSupervisor, setSelectedSupervisor] = useState(null);

  const filteredProjects = originalProjects.filter(
    (project) =>
      project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.supervisor.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSupervisorClick = (name) => {
    const info = supervisorInfo[name];
    if (info) setSelectedSupervisor({ name, ...info });
  };

  const closePopup = () => setSelectedSupervisor(null);

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

        {/* Highlighted project */}
        <div className="highlighted-project">
          <div className="highlighted-info">
            <h4>Restaurant Website</h4>
            <p className="supervisor-name">Wesam Ashour</p>
            <div className="description-box">
              <p className="description">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam...
              </p>
            </div>
          </div>
          <div className="status-indicator">
            <img src={getStatusIcon("Approved")} alt="status" />
            <p className="status-label approved">Approved</p>
          </div>
        </div>

        {/* Filtered project list */}
        <div className="project-list">
          {filteredProjects.map((project, index) => (
            <div key={index} className="project-row">
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
                Supervised By: <strong>{project.supervisor}</strong>
              </span>
              <img src={applyIcon} alt="apply" className="apply-btn" />
            </div>
          ))}
        </div>

        {/* Popup for supervisor info */}
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
                <div className="supervisor-popup-field">Email ID: {selectedSupervisor.email}</div>
                <div className="supervisor-popup-field">Phone Number: {selectedSupervisor.phone}</div>
                <div className="supervisor-popup-field">Department: {selectedSupervisor.department}</div>
                <div className="supervisor-popup-field">Educational Degree: {selectedSupervisor.degree}</div>
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
