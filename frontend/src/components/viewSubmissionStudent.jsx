import React, { useEffect, useState } from 'react';
import './ViewSubmission.css';
import xbutton from '../assets/xbutton.png';
import sendIcon from '../assets/send.png';
import axios from "../axios";

const ViewSubmissionStudent = ({ taskId, onClose }) => {
  const [grade, setGrade] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [files, setFiles] = useState([]);

  const load = async () => {
    try {
      const { data } = await axios.get(`/student/tasks/${taskId}/details`);
      setGrade(data.grade);
      setComments(data.comments || []);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [taskId]);

  const onFiles = (e) => {
    if (e.target.files.length > 5) {
      alert('You can upload a maximum of 5 files.');
      e.target.value = '';
      setFiles([]);
      return;
    }
    setFiles([...e.target.files]);
  };

  const markAsDone = async () => {
    if (!files.length) { alert('Please attach up to 5 files.'); return; }
    const form = new FormData();
    files.forEach((f) => form.append('files[]', f));
    try {
      await axios.post(`/student/tasks/${taskId}/submit`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setFiles([]);
      await load(); // refresh grade/comments after submit
      alert('Submitted!');
    } catch (e) { console.error(e); }
  };

  const sendComment = async () => {
    if (!newComment.trim()) return;
    try {
      const { data } = await axios.post(`/student/tasks/${taskId}/comments`, {
        content: newComment.trim(),
      });
      setComments([data, ...comments]);
      setNewComment('');
    } catch (e) { console.error(e); }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="modal-close" onClick={onClose}>
          <img src={xbutton} alt="Close" />
        </button>

        <div className="grade-row">
          <h3 className="section-title" style={{ marginBottom: 0, marginTop: 0, flex: 1 }}>Your work</h3>
          <span className="grade-score">Graded: {grade !== null ? `${grade}/10` : '--/10'}</span>
        </div>

        <div className="submission-box" style={{ textAlign: 'center' }}>
          <input type="file" id="file" multiple onChange={onFiles} style={{ marginBottom: '12px', fontFamily: 'inherit' }} />
          <button className="save-button" onClick={markAsDone}>Mark as done</button>
        </div>

        <div className="comments-box">
          <h4 className="section-title">Comments</h4>
          <div className="comment-wrapper">
            <div className="comment-list">
              {comments.map((c, i) => (
                <div className="comment" key={i}>
                  <div className="comment-inner">
                    <span className="comment-author">{c.author_name}</span>{' '}
                    <span className="comment-time">({c.timestamp})</span>
                    <p>{c.content}</p>
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
                onKeyDown={(e) => e.key === 'Enter' && sendComment()}
              />
              <button className="send-button" onClick={sendComment}>
                <img src={sendIcon} alt="Send" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewSubmissionStudent;
