import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import StudentSideBar from "../components/StudentSideBar";
import axios from "../axios";
import "./ProjectDetails.css";

const StudentProjectDetails = () => {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [project, setProject] = useState(null);

  const load = async () => {
    setLoading(true);
    setErr("");
    try {
      const { data } = await axios.get(`/student/projects/${id}`);
      setProject(data.project || null);
    } catch (e) {
      setErr(e?.response?.data?.message || "Failed to load project details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

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

        <div className="files-section">
          {(project.files || []).map((f, idx) => (
            <p key={idx}>
              📄{" "}
              {f.url ? (
                <a href={f.url} target="_blank" rel="noreferrer">
                  {f.name}
                </a>
              ) : (
                f.name
              )}
            </p>
          ))}
          {(!project.files || project.files.length === 0) && <p>—</p>}
        </div>
      </div>
    </div>
  );
};

export default StudentProjectDetails;
