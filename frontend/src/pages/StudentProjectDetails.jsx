import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import StudentSideBar from "../components/StudentSideBar";
import axios from "../axios";
import "./ProjectDetails.css";

const STORAGE_BASE = "http://127.0.0.1:8000/storage/";

// Build absolute storage URL and encode segments
function buildStorageUrl(p) {
  if (!p) return "#";
  const cleaned = String(p).replace(/^\/+/, ""); // trim leading /
  const encoded = cleaned
    .split("/")
    .map((seg) => encodeURIComponent(seg))
    .join("/");
  return STORAGE_BASE + encoded;
}

function fileNameFromPath(p) {
  if (!p) return "file";
  return String(p).split("/").pop() || "file";
}

const StudentProjectDetails = () => {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [project, setProject] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setErr("");
        const { data } = await axios.get(`/student/projects/${id}`);
        setProject(data.project || null);
      } catch (e) {
        setErr(e?.response?.data?.message || "Failed to load project details.");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  // Hard-open in a new tab (bypasses any router hijack)
  const openExternal = (url) => {
    // window.open guarantees navigation to exact URL
    window.open(url, "_blank", "noopener,noreferrer");
  };

  if (loading) {
    return (
      <div className="supervisor-dashboard">
        <StudentSideBar />
        <div className="project-details-container">
          <h2 className="project-title">Project Details</h2>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (err || !project) {
    return (
      <div className="supervisor-dashboard">
        <StudentSideBar />
        <div className="project-details-container">
          <h2 className="project-title">Project Not Found</h2>
          <p>{err || `No project found for ID: ${id}`}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="supervisor-dashboard project-details-page ">
      <StudentSideBar />

      <div className="project-details-container scrollable-content">
        <h2 className="project-title">Project Details</h2>

        <div className="project-info-box">
          <span className="project-name">{project.title}</span>
          <span className="supervisor-name">
            Supervised By:{" "}
            <span className="blue-link">{project?.supervisor?.name}</span>
          </span>
        </div>

        <div className="meeting-time-box">
          Meeting Time : {project.meeting_time_label || "—"}
        </div>

        <div className="summary-box">
          <p className="summary-title">Project Summary</p>
          <div className="summary-text">{project.summary || "—"}</div>
        </div>
      </div>
    </div>
  );
};

export default StudentProjectDetails;
