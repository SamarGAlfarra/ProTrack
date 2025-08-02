import React from "react";
import { useParams } from "react-router-dom";
import StudentSideBar from "../components/StudentSideBar";
import "./ProjectDetails.css";

const projects = [
  {
    id: 1,
    title: "Restaurant Website",
    supervisor: "Wesam Ashour",
    meetingTime: "Wednesday 14:00 → 16:00",
    summary:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam... ".repeat(
        20
      ),
    files: [
      { name: "draft.txt", url: "#" },
      { name: "summary.pdf", url: "#" },
    ],
  },
  {
    id: 2,
    title: "Mobile App",
    supervisor: "Ruba Salamah",
    meetingTime: "Sunday 10:00 → 12:00",
    summary:
      "This mobile app helps students manage daily assignments and deadlines.",
    files: [{ name: "project-outline.docx", url: "#" }],
  },
];

const StudentProjectDetails = () => {
  const { id } = useParams();
  const project = projects.find((p) => p.id === parseInt(id));

  if (!project) {
    return (
      <div className="supervisor-dashboard">
        <StudentSideBar />
        <div className="project-details-container">
          <h2 className="project-title">Project Not Found</h2>
          <p>No project found for ID: {id}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="supervisor-dashboard">
      <StudentSideBar />

      <div className="project-details-container scrollable-content">
        <h2 className="project-title">Project Details</h2>

        <div className="project-info-box">
          <span className="project-name">{project.title}</span>
          <span className="supervisor-name">
            Supervised By:{" "}
            <span className="blue-link">{project.supervisor}</span>
          </span>
        </div>

        <div className="meeting-time-box">
          Meeting Time : {project.meetingTime}
        </div>

        <div className="summary-box">
          <p className="summary-title">Project Summary</p>
          <div className="summary-text">{project.summary}</div>
        </div>

        <div className="files-section">
          {project.files.map((file, index) => (
            <p key={index}>
              📄 <a href={file.url}>{file.name}</a>
            </p>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StudentProjectDetails;
