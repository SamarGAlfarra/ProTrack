import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import SupervisorSideBar from "../components/SupervisorSideBar";
import Calendar from "../components/Calendar";
import "./ProjectDetails.css";

import axios from "../axios";
import sendIcon from "../assets/send.png";
import addIcon from "../assets/add.png";
import calendarIcon from "../assets/calendar.png";
import closeIcon from "../assets/xbutton.png";

const ProjectDetails = () => {
  const { id } = useParams();                 // project id from URL
  const navigate = useNavigate();

  // ---- page state ----
  const [loading, setLoading] = useState(true);
  const [projectTitle, setProjectTitle] = useState("");
  const [posts, setPosts] = useState([]);
  const [team, setTeam] = useState({ name: "", code: "" });
  const [members, setMembers] = useState([]); // [{# idx, name, student_id, final_grade}]
  const [tasks, setTasks] = useState([]);     // [{id, title, deadline_str, status}]

  // add post
  const [newPost, setNewPost] = useState("");

  // add task popup
  const [showPopup, setShowPopup] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [deadline, setDeadline] = useState(""); // human string (from Calendar)
  const [subject, setSubject] = useState("");
  const [file, setFile] = useState([]); // up to 5 files

  // --- helpers ---
  const formattedDeadlineISO = useMemo(() => {
    // backend expects ISO if possible
    if (!deadline) return "";
    // accept "DD/MM/YYYY HH:mm" (en-GB) coming from Calendar; convert to ISO 8601
    const [datePart, timePart] = deadline.split(" ");
    if (!datePart || !timePart) return deadline;
    const [dd, mm, yyyy] = datePart.split("/");
    return `${yyyy}-${mm}-${dd}T${timePart}:00`;
  }, [deadline]);

  // ---- load everything ----
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const { data } = await axios.get(`/supervisor/projects/${id}/details`);
        // shape returned by backend below in controller
        setProjectTitle(data.project.title);
        setPosts(data.posts);                      // [{author, text, timestamp}]
        setTeam({ name: data.team.name, code: data.team.code });
        setMembers(data.members);                  // [{index,name,student_id,final_grade}]
        setTasks(data.tasks);                      // [{id,title,deadline_str,status}]
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  // ---- posts ----
  const handleSend = async () => {
    if (!newPost.trim()) return;
    try {
      const { data } = await axios.post(`/supervisor/projects/${id}/posts`, {
        content: newPost.trim(),
      });
      // API returns the created post with author + formatted timestamp
      setPosts((prev) => [data, ...prev]);
      setNewPost("");
    } catch (e) {
      console.error(e);
    }
  };

  const [isEditing, setIsEditing] = useState(false);
const [activeTaskId, setActiveTaskId] = useState(null);
const [existingFile, setExistingFile] = useState(null); // {name, url} | null
const openEditTask = async (taskId) => {
  try {
    setIsEditing(true);
    setActiveTaskId(taskId);
    setShowPopup(true);
    setShowCalendar(false);

    const { data } = await axios.get(`/supervisor/tasks/${taskId}`);

    setTaskTitle(data.title || "");
    setSubject(data.description || "");
    // show as "DD/MM/YYYY HH:mm" like your add flow expects
    setDeadline(data.deadline_display || "");
    setExistingFile(
      data.file_url ? { name: data.file_name, url: data.file_url } : null
    );
    setFile([]); // user may choose a replacement
  } catch (e) {
    console.error(e);
  }
};
const handleUpdateTask = async () => {
  if (!activeTaskId) return;
  if (!taskTitle.trim() || !formattedDeadlineISO) return;

  try {
    const form = new FormData();
    form.append("title", taskTitle.trim());
    form.append("deadline", formattedDeadlineISO);
    form.append("description", subject || "");
    if (file.length > 0) {
      form.append("attachments[]", file[0]); // replace with first file
    }

    const { data } = await axios.post(
      `/supervisor/tasks/${activeTaskId}`,
      form,
      { headers: { "Content-Type": "multipart/form-data" } }
    );

    setTasks(data.tasks);

    // reset
    setIsEditing(false);
    setActiveTaskId(null);
    setTaskTitle("");
    setDeadline("");
    setSubject("");
    setFile([]);
    setExistingFile(null);
    setShowCalendar(false);
    setShowPopup(false);
  } catch (e) {
    console.error(e);
  }
};


  // ---- calendar helpers ----
  const handleDateTimeSelect = (date) => {
    const formatted = date
      .toLocaleString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
      .replace(",", "");
    setDeadline(formatted);
  };
  const handleCalendarDone = () => setShowCalendar(false);

  // ---- add task ----
  const handleSaveTask = async () => {
    if (!taskTitle.trim() || !formattedDeadlineISO) return;

    try {
      const form = new FormData();
      form.append("title", taskTitle.trim());
      form.append("deadline", formattedDeadlineISO); // ISO 8601
      form.append("description", subject || "");
      // optional attachments (<=5 files)
      for (let i = 0; i < file.length; i++) {
        form.append("attachments[]", file[i]);
      }

      const { data } = await axios.post(
        `/supervisor/projects/${id}/tasks`,
        form,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      // API returns the new task plus the refreshed list; keep it simple and refresh tasks
      setTasks(data.tasks);

      // reset popup
      setTaskTitle("");
      setDeadline("");
      setSubject("");
      setFile([]);
      setShowCalendar(false);
      setShowPopup(false);
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return (
      <div className="supervisor-dashboard">
        <SupervisorSideBar />
        <div className="project-details-container">
          <h2 className="project-title">Loading...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="supervisor-dashboard">
      <SupervisorSideBar />

      <div className="project-details-container">
        <h2 className="project-title">{projectTitle || "Project"}</h2>

        {/* Posts */}
        <div className="posts-section">
          {posts.map((post, index) => (
            <div className="post" key={index}>
              <div className="post-author">{post.author}</div>
              <div className="post-text">{post.text}</div>
              <div className="post-timestamp">{post.timestamp}</div>
            </div>
          ))}
        </div>

        {/* Add Update */}
        <div className="add-update">
          <input
            type="text"
            placeholder="Add Post..."
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
          />
          <img src={sendIcon} alt="Send" onClick={handleSend} />
        </div>

        {/* Bottom Section */}
        <div className="bottom-section">
          {/* Team Info */}
          <div className="team-info">
            <h3 className="team-title">
              Team’s Name : <strong>{team.name || "-"}</strong>
            </h3>
            <p className="team-code">Team’s Code : {team.code || "-"}</p>

            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Student Name</th>
                    <th>Student ID</th>
                    <th>Final Grade</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((m, idx) => (
                    <tr key={m.student_id || idx}>
                      <td>{m.index}</td>
                      <td>{m.name}</td>
                      <td>{m.student_id}</td>
                      <td>{m.final_grade}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Task List */}
          <div className="tasks-box">
            <div className="tasks-header">
              <span>All Tasks</span>
              <img
                src={addIcon}
                alt="Add Task"
                className="add-task-icon"
                onClick={() => setShowPopup(true)}
              />
            </div>

            <div className="tasks-list">
              {tasks.map((t) => (
                <div
                  className="task"
                  key={t.id}
                  onClick={() => navigate(`/supervisor/taskdetails/${t.id}`)}
                  style={{ cursor: "pointer" }}
                >
                  <div className="task-left">
                    <p className="task-title">{t.title}</p>
                    <button
                    className="task-edit-link"
                    onClick={(e) => {
                      e.stopPropagation();
                      openEditTask(t.id);
                    }}
                  >
                    Edit
                  </button>
                  </div>
                  <div className="task-right">
                    <p className="task-status">Status: {t.status}</p>
                    <p className="task-due">Due To {t.deadline_str}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Add Task Popup */}
        {showPopup && (
          <div className="popup-overlay">
            <div className="popup-box">
              <div className="popup-header">
                <h3>{isEditing ? "Edit Task" : "Add Task"}</h3>
                <img
                  src={closeIcon}
                  alt="Close"
                  className="popup-close"
                  onClick={() => {
                    setShowPopup(false);
                    setShowCalendar(false);
                    setIsEditing(false);
                    setActiveTaskId(null);
                    setExistingFile(null);
                  }}
                />
              </div>

              <div className="popup-body">
                <input
                  type="text"
                  placeholder="Task Title:"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="popup-input"
                />

                <div className="popup-deadline">
                  <input
                    type="text"
                    placeholder="Deadline"
                    value={deadline}
                    readOnly
                    className="popup-input"
                  />
                  <img
                    src={calendarIcon}
                    alt="calendar"
                    className="calendar-icon"
                    onClick={() => setShowCalendar(!showCalendar)}
                  />
                </div>

                {showCalendar && (
                  <div className="calendar-wrapper">
                    <Calendar
                      onDateTimeSelect={handleDateTimeSelect}
                      onClear={() => setDeadline("")}
                      onDone={handleCalendarDone}
                    />
                  </div>
                )}

                <textarea
                  placeholder="Subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="popup-textarea"
                />

                

                <input
                  type="file"
                  multiple
                  onChange={(e) => setFile([...e.target.files].slice(0, 5))}
                  className="popup-file"
                />
                {file.length > 0 && (
                  <ul className="file-list">
                    {file.map((f, index) => (
                      <li key={index}>{f.name}</li>
                    ))}
                  </ul>
                )}

                {isEditing && existingFile && (
                  <div className="popup-existing-file">
                    Current file: <a href={existingFile.url} target="_blank" rel="noreferrer">{existingFile.name}</a>
                  </div>
                )}

                <button
                  className="popup-save"
                  onClick={isEditing ? handleUpdateTask : handleSaveTask}
                >
                  {isEditing ? "Update" : "Save"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectDetails;
