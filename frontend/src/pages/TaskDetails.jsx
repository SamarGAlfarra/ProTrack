// src/pages/TaskDetails.jsx
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import SupervisorSideBar from '../components/SupervisorSideBar';
import './TaskDetails.css';
import '../components/ViewSubmission.css';
import sendIcon from '../assets/send.png';
import xbutton from '../assets/xbutton.png';
import axios from '../axios';

// Popup component (fetches student submission details + comments)
const ViewSubmission = ({ onClose, student, taskId }) => {
  const [files, setFiles] = useState([]);
  const [grade, setGrade] = useState(0);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const studentId = student?.student_id;

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      try {
        setLoading(true);

        // Load files+grade AND the whole comment thread (student + supervisor)
        const [subRes, comRes] = await Promise.all([
          axios.get(`/supervisor/tasks/${taskId}/submissions/${studentId}`),
          axios.get(`/supervisor/tasks/${taskId}/comments/${studentId}`),
        ]);

        if (cancelled) return;

        const sub = subRes?.data || {};
        setFiles(Array.isArray(sub.files) ? sub.files : []);
        setGrade(
          typeof sub.grade === 'number' && !Number.isNaN(sub.grade) ? sub.grade : 0
        );

        const thread = Array.isArray(comRes?.data?.comments)
          ? comRes.data.comments
          : [];
        setComments(thread);
      } catch (e) {
        console.error(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    if (studentId) fetchData();
    return () => {
      cancelled = true;
    };
  }, [taskId, studentId]);

  const handleScoreChange = (e) => {
    const v = Number(e.target.value);
    if (Number.isFinite(v) && v >= 0 && v <= 10) setGrade(v);
  };

  const handleSaveGrade = async () => {
    try {
      setSaving(true);
      await axios.post(
        `/supervisor/tasks/${taskId}/submissions/${studentId}/grade`,
        { grade }
      );
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleSendComment = async () => {
    const text = newComment.trim();
    if (!text) return;
    try {
      const { data } = await axios.post(`/supervisor/tasks/${taskId}/comments`, {
        student_id: studentId,
        comment: text,
      });
      // API returns {author, time, text}; prepend to thread
      setComments((prev) => [data, ...prev]);
      setNewComment('');
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="modal-close" onClick={onClose}>
          <img src={xbutton} alt="Close" />
        </button>

        <h3 className="section-title">Student’s work</h3>

        <div className="submission-box">
          {loading ? (
            <div>Loading...</div>
          ) : (
            <>
              {files.length === 0 && <div>No files submitted.</div>}
              {files.map((f, idx) => (
                <a key={idx} href={f.url} target="_blank" rel="noreferrer">
                  {f.name}
                </a>
              ))}

              <div className="grade-row">
                <span>
                  Graded:{' '}
                  <input
                    type="number"
                    value={grade}
                    onChange={handleScoreChange}
                    className="grade-input"
                    min="0"
                    max="10"
                    step="1"
                  />{' '}
                  / 10
                </span>
                <button
                  className="save-button"
                  disabled={saving}
                  onClick={handleSaveGrade}
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </>
          )}
        </div>

        <div className="comments-box">
          <h4 className="section-title">Comments</h4>
          <div className="comment-wrapper">
            <div className="comment-list">
              {comments.map((c, index) => (
                <div className="comment" key={index}>
                  <div className="comment-inner">
                    <span className="comment-author">{c.author}</span>
                    <span className="comment-time">{c.time ? `(${c.time})` : ''}</span>
                    <p>{c.text}</p>
                  </div>
                </div>
              ))}
              {comments.length === 0 && !loading && (
                <div className="comment">
                  <div className="comment-inner">
                    <p>No comments yet.</p>
                  </div>
                </div>
              )}
            </div>

            <div className="comment-input-row">
              <input
                type="text"
                placeholder="Add Comment"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendComment()}
              />
              <button className="send-button" onClick={handleSendComment}>
                <img src={sendIcon} alt="Send" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ---- Main page (keeps your table/UI classes) ----
const TaskDetails = () => {
  const { id } = useParams(); // task id from URL
  const [taskTitle, setTaskTitle] = useState('Task');
  const [students, setStudents] = useState([]); // [{ student_id, student_name, submitted_at, status, grade }]
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [loading, setLoading] = useState(true);

  const handleViewSubmission = (student) => setSelectedStudent(student);
  const closeModal = () => setSelectedStudent(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        const { data } = await axios.get(`/supervisor/tasks/${id}/submissions`);
        if (cancelled) return;
        setTaskTitle(data?.task?.title || `Task ${id}`);
        setStudents(Array.isArray(data?.submissions) ? data.submissions : []);
      } catch (e) {
        console.error(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    if (id) load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  return (
    <div className="supervisor-dashboard">
      <SupervisorSideBar />
      <div className="project-details-container">
        <h2 className="project-title">{taskTitle}</h2>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Student Name</th>
                <th>Student ID</th>
                <th>Submission</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan="5">Loading...</td>
                </tr>
              )}

              {!loading && students.length === 0 && (
                <tr>
                  <td colSpan="5">No submissions yet.</td>
                </tr>
              )}

              {!loading &&
                students.map((student, index) => (
                  <tr key={student.student_id || index}>
                    <td>{index + 1}</td>
                    <td>{student.student_name}</td>
                    <td>{student.student_id}</td>
                    <td>
                      <button onClick={() => handleViewSubmission(student)}>
                        View Submission
                      </button>
                    </td>
                    <td>
                      <span
                        className={`status ${
                          student.status === 'On time' ? 'on-time' : 'late'
                        }`}
                      >
                        {student.status}
                      </span>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedStudent && (
        <ViewSubmission
          student={selectedStudent}
          taskId={id}
          onClose={closeModal}
        />
      )}
    </div>
  );
};

export default TaskDetails;
