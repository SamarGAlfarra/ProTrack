import React, { useEffect, useMemo, useState } from "react";
import "./ProjectDetails.css";
import "../components/ViewSubmission.css";
import sendIcon from "../assets/send.png";
import StudentSideBar from "../components/StudentSideBar";
import closeIcon from "../assets/xbutton.png";
import axios from "../axios";

const MyProjectsStudent = () => {
  const [loading, setLoading] = useState(true);

  // Enrollment / project
  const [enrolled, setEnrolled] = useState(false);
  const [project, setProject] = useState(null); // {project_id, title, meeting_time, meeting_link}

  // Posts
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState("");

  // Tasks + grade
  const [tasks, setTasks] = useState([]);
  const [finalGrade, setFinalGrade] = useState(null);

  // Task popup
  const [showPopup, setShowPopup] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  // Submission modal
  const [showSubmission, setShowSubmission] = useState(false);
  const [submission, setSubmission] = useState(null); // {file_path, grade, timestamp} or null
  const [selectedFiles, setSelectedFiles] = useState([]); // FileList -> Array
  const [deadlinePassed, setDeadlinePassed] = useState(false);

  // Comments in submission modal
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");

  // ---------- Helpers ----------
  const openMeeting = () => {
    if (project?.meeting_link) window.open(project.meeting_link, "_blank");
  };

  const statusClass = (s) =>
    `status ${String(s || "").toLowerCase().replace(/\s+/g, "-")}`;

  const formattedGrade = useMemo(() => {
    if (finalGrade === null || finalGrade === undefined) return "--/100";
    const g = Math.round(finalGrade);
    return `${g}/100`;
  }, [finalGrade]);

  // ---------- Initial load ----------
  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        // 1) enrollment + project
        const { data: mp } = await axios.get("/student/my-project");
        if (!mp?.enrolled) {
          setEnrolled(false);
          setLoading(false);
          return;
        }
        setEnrolled(true);
        setProject(mp.project);

        // 2) posts
        const { data: p } = await axios.get(
          `/student/projects/${mp.project.project_id}/posts`
        );
        setPosts(p.posts || []);

        // 3) tasks + final grade
        const { data: t } = await axios.get(
          `/student/projects/${mp.project.project_id}/tasks`
        );
        setTasks(t.tasks || []);
        setFinalGrade(t.final_grade ?? null);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  // ---------- Posts ----------
  const handleSendPost = async () => {
    if (!newPost.trim() || !project) return;
    try {
      const { data } = await axios.post(
        `/student/projects/${project.project_id}/posts`,
        { content: newPost.trim() }
      );
      // Prepend newly created post from API (already with author & timestamp)
      setPosts((prev) => [data.post, ...prev]);
      setNewPost("");
    } catch (e) {
      console.error(e);
    }
  };

  // ---------- Tasks / popups ----------
  const handleTaskClick = async (task) => {
    setShowPopup(true);
    setSelectedTask(task);

    try {
      // fetch details that include an absolute file URL (same idea as supervisor)
      const { data } = await axios.get(`/student/tasks/${task.id}`);
      const resolvedFiles = [];

      if (Array.isArray(data?.files) && data.files.length > 0) {
        data.files.forEach((f) => {
          if (f?.url) resolvedFiles.push({ name: f.name || "File", url: f.url });
        });
      } else if (data?.file_url) {
        resolvedFiles.push({ name: data.file_name || "File", url: data.file_url });
      }

      setSelectedTask((prev) =>
        prev && prev.id === task.id ? { ...prev, resolvedFiles } : prev
      );
    } catch (e) {
      console.error(e);
    }
  };

  // Load submission + comments when opening submission modal
  const openSubmissionModal = async (task) => {
    if (!task) return;
    try {
      const [{ data: sub }, { data: comm }] = await Promise.all([
        axios.get(`/student/tasks/${task.id}/submission`),
        axios.get(`/student/tasks/${task.id}/comments`),
      ]);

      setSubmission(sub?.submission || null);
      setComments(comm?.comments || []);
      setSelectedFiles([]);
      const now = new Date().getTime();
      setDeadlinePassed(new Date(task.deadline).getTime() < now);
      setShowSubmission(true);
    } catch (e) {
      console.error(e);
    }
  };

  // ---------- Submission create/update ----------
  const onFilesChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 5) {
      alert("You can upload a maximum of 5 files.");
      e.target.value = "";
      return;
    }
    setSelectedFiles(files);
  };

  const handleMarkAsDone = async () => {
    if (!selectedTask) return;
    try {
      const form = new FormData();
      selectedFiles.forEach((f) => form.append("files[]", f));

      if (submission) {
        await axios.post(
          `/student/tasks/${selectedTask.id}/submission/update`,
          form,
          { headers: { "Content-Type": "multipart/form-data" } }
        );
      } else {
        await axios.post(`/student/tasks/${selectedTask.id}/submission`, form, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      // Refresh submission + tasks
      const [{ data: sub }, { data: t }] = await Promise.all([
        axios.get(`/student/tasks/${selectedTask.id}/submission`),
        axios.get(`/student/projects/${project.project_id}/tasks`),
      ]);
      setSubmission(sub?.submission || null);
      setTasks(t.tasks || []);
      setFinalGrade(t.final_grade ?? null);
      setSelectedFiles([]);
      alert("Saved successfully.");
    } catch (e) {
      if (e?.response?.status === 422) {
        alert(e.response.data?.message || "Validation error.");
      } else {
        console.error(e);
        alert("Something went wrong.");
      }
    }
  };

  // ---------- Comments ----------
  const handleSendComment = async () => {
    if (!newComment.trim() || !selectedTask) return;
    try {
      const { data } = await axios.post(
        `/student/tasks/${selectedTask.id}/comments`,
        { comment: newComment.trim() }
      );
      setComments((prev) => [data.comment, ...prev]);
      setNewComment("");
    } catch (e) {
      console.error(e);
    }
  };

  // ---------- File URL helpers ----------
  // Resolve the backend origin correctly
  const BACKEND_ORIGIN = (() => {
    const envOrigin = import.meta?.env?.VITE_BACKEND_ORIGIN;
    if (envOrigin && /^https?:\/\//i.test(envOrigin)) {
      return envOrigin.replace(/\/+$/, "");
    }

    const b = axios?.defaults?.baseURL || "";
    try {
      if (/^https?:\/\//i.test(b)) return new URL(b).origin;
    } catch {}

    // Dev fallback so /storage opens on Laravel (8000) not Vite (5174)
    if (window.location.port === "5174" || window.location.port === "5173") {
      return "http://localhost:8000";
    }

    // Production (Laravel serves SPA)
    return window.location.origin;
  })();

  const toAbsoluteUrl = (p) => {
    if (!p) return "#";
    if (/^https?:\/\//i.test(p)) return p; // already absolute
    let path = String(p).replace(/^\/+/, "");
    if (!/^storage\//i.test(path)) path = `storage/${path}`;
    return `${BACKEND_ORIGIN}/${path}`;
  };

  // ---------- UI ----------
  if (loading) {
    return (
      <div className="supervisor-dashboard">
        <StudentSideBar />
        <div className="project-details-container">
          <h2 className="project-title">Loading…</h2>
        </div>
      </div>
    );
  }

  if (!enrolled) {
    return (
      <div className="supervisor-dashboard">
        <StudentSideBar />
        <div className="project-details-container">
          <h2 className="project-title">My Project</h2>
          <div className="meeting-section" style={{ marginTop: 16 }}>
            You are not enrolled in any project yet.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="supervisor-dashboard">
      <StudentSideBar />

      <div className="project-details-container">
        <h2 className="project-title">{project?.title || "Project"}</h2>

        {/* Posts */}
        <div className="posts-section">
          {posts.map((post, i) => (
            <div className="post" key={`${post.timestamp}-${i}`}>
              <div className="post-author">{post.author}</div>
              <div className="post-text">{post.content}</div>
              <div className="post-timestamp">{post.timestamp}</div>
            </div>
          ))}
        </div>

        <div className="add-update">
          <input
            type="text"
            placeholder="Add Update"
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSendPost()}
          />
          <img src={sendIcon} alt="Send" onClick={handleSendPost} />
        </div>

        {/* Meeting */}
        <div className="meeting-section">
          <h3 className="meeting-title">Upcoming Meeting</h3>
          <div className="meeting-box">
            <span>Discussion </span>
            <span>
              &nbsp;
              {project?.meeting_time
                ? new Date(project.meeting_time).toLocaleString()
                : "--"}
            </span>
            <button className="join-button" onClick={openMeeting}>
              Join Meeting
            </button>
          </div>
        </div>

        {/* Tasks */}
        <div className="tasks-grade-container">
          <div className="tasks-header-row">
            <h3 className="tasks-title">All Tasks</h3>
            <div className="final-grade">Final Grade: {formattedGrade}</div>
          </div>

          <div className="tasks-table-wrapper">
            <table className="tasks-table">
              <thead>
                <tr>
                  <th>Task</th>
                  <th>Deadline</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((t) => (
                  <tr key={t.id}>
                    <td
                      onClick={() => handleTaskClick(t)}
                      style={{ textDecoration: "underline", cursor: "pointer" }}
                    >
                      {t.title}
                    </td>
                    <td>
                      {t.deadline ? new Date(t.deadline).toLocaleString() : "--"}
                    </td>
                    <td>
                      <span className={statusClass(t.status)}>{t.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Task Details Popup */}
      {showPopup && selectedTask && (
        <div className="popup-overlay">
          <div className="popup-box">
            <div className="popup-header">
              <h3>{selectedTask.title}</h3>
              <img
                src={closeIcon}
                alt="Close"
                className="popup-close"
                onClick={() => setShowPopup(false)}
              />
            </div>

            <div className="popup-body">
              <div className="popup-input">
                <strong>Task Title: </strong> {selectedTask.title}
              </div>

              <div className="popup-input">
                <strong>Task Published date: </strong>{" "}
                {selectedTask.timestamp
                  ? new Date(selectedTask.timestamp).toLocaleString()
                  : "--"}
              </div>

              <div className="popup-input">
                <strong>Task Deadline: </strong>{" "}
                {selectedTask.deadline
                  ? new Date(selectedTask.deadline).toLocaleString()
                  : "--"}
              </div>

              <div className="popup-textarea">
                <strong>Description:</strong> {selectedTask.description || "—"}
              </div>

              <div className="files-section">
                {Array.isArray(selectedTask?.resolvedFiles) &&
                selectedTask.resolvedFiles.length > 0 ? (
                  selectedTask.resolvedFiles.map((f, i) => (
                    <div key={i}>
                      <a href={f.url} target="_blank" rel="noreferrer">
                        📄 {f.name || `File ${i + 1}`}
                      </a>
                    </div>
                  ))
                ) : Array.isArray(selectedTask?.files) &&
                  selectedTask.files.length > 0 ? (
                  selectedTask.files.map((fp, i) => (
                    <div key={i}>
                      <a
                        href={toAbsoluteUrl(fp)}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        📄 {fp?.split("/").pop() || `File ${i + 1}`}
                      </a>
                    </div>
                  ))
                ) : selectedTask?.file ? (
                  String(selectedTask.file)
                    .split(",")
                    .map((fp, i) => (
                      <div key={i}>
                        <a
                          href={toAbsoluteUrl(fp)}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          📄 {fp?.split("/").pop() || `File ${i + 1}`}
                        </a>
                      </div>
                    ))
                ) : (
                  <p>—</p>
                )}
              </div>

              <button
                className="popup-save"
                onClick={() => {
                  setShowPopup(false);
                  openSubmissionModal(selectedTask);
                }}
              >
                View Submission
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Submission Modal */}
      {showSubmission && selectedTask && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button
              className="modal-close"
              onClick={() => setShowSubmission(false)}
            >
              <img src={closeIcon} alt="Close" />
            </button>

            {/* Title and Grade Row */}
            <div className="grade-row">
              <h3
                className="section-title"
                style={{ marginBottom: 0, marginTop: 0, flex: 1 }}
              >
                Your work
              </h3>
              <span className="grade-score">
                {submission?.grade != null
                  ? `Graded: ${submission.grade}/10`
                  : "Graded: --/10"}
              </span>
            </div>

            {/* Existing files */}
            <div className="submission-box" style={{ textAlign: "left" }}>
              <div style={{ marginBottom: 10 }}>
                <strong>Submitted files: </strong>

                {Array.isArray(submission?.files) &&
                submission.files.length > 0 ? (
                  submission.files.map((f, i) => (
                    <div key={i}>
                      <a href={f.url} target="_blank" rel="noreferrer">
                        📄 {f.name || `File ${i + 1}`}
                      </a>
                    </div>
                  ))
                ) : submission?.file_path ? (
                  String(submission.file_path)
                    .split(",")
                    .map((p, i) => {
                      const trimmed = p.trim();
                      return (
                        <div key={i}>
                          <a
                            href={toAbsoluteUrl(trimmed)}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            📄 {trimmed.split("/").pop() || `File ${i + 1}`}
                          </a>
                        </div>
                      );
                    })
                ) : (
                  <span>—</span>
                )}
              </div>

              <div style={{ textAlign: "center" }}>
                <input
                  type="file"
                  id="file"
                  multiple
                  onChange={onFilesChange}
                  style={{ marginBottom: "12px", fontFamily: "inherit" }}
                />
                <button
                  className="save-button"
                  onClick={handleMarkAsDone}
                  disabled={submission && deadlinePassed}
                  title={
                    submission && deadlinePassed
                      ? "Deadline passed. Updating files is disabled."
                      : undefined
                  }
                >
                  Mark as done
                </button>
              </div>
            </div>

            {/* Comments Section */}
            <div className="comments-box">
              <h4 className="section-title">Comments</h4>
              <div className="comment-wrapper">
                <div className="comment-list">
                  {comments.map((c, index) => (
                    <div className="comment" key={index}>
                      <div className="comment-inner">
                        <span className="comment-author">{c.author}</span>{" "}
                        <span className="comment-time">({c.timestamp})</span>
                        <p>{c.comment}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="comment-input-row">
                  <input
                    type="text"
                    placeholder="Add Comment"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSendComment()}
                  />
                  <button className="send-button" onClick={handleSendComment}>
                    <img src={sendIcon} alt="Send" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyProjectsStudent;
