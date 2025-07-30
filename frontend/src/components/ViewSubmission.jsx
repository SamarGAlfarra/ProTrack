import React, { useState } from 'react';
import './ViewSubmission.css';
import sendIcon from '../assets/send.png';
import xbutton from '../assets/xbutton.png';

const ViewSubmission = ({ onClose, student }) => {
  const [comments, setComments] = useState([
    {
      author: 'Samar Alfarra',
      time: '01/01/2025 14:41',
      text: 'I didn’t submit the text file',
    },
  ]);

  const [newComment, setNewComment] = useState('');
  const [score, setScore] = useState(10);
  const [totalScore, setTotalScore] = useState(15);

const handleSendComment = () => {
  if (!newComment.trim()) return;

  const now = new Date().toLocaleString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).replace(',', '');

  const newEntry = {
    author: 'You',
    time: now,
    text: newComment.trim(),
  };

  setComments([newEntry, ...comments]); // ⬅️ newest at top
  setNewComment('');
};


  const handleScoreChange = (e) => {
    const value = Number(e.target.value);
    if (value >= 0 && value <= totalScore) {
      setScore(value);
    }
  };

  const handleTotalChange = (e) => {
    const newTotal = Number(e.target.value);
    if (newTotal >= 1) {
      setTotalScore(newTotal);
      if (score > newTotal) {
        setScore(newTotal); // auto-correct if current score > new total
      }
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
          <a href="#">Lab 1 - 220202966.pdf</a>
          <a href="#">Lab 1 - 220202966.pdf</a>
          <div className="grade-row">
            <span>
              Graded:
              <input
                type="number"
                value={score}
                onChange={handleScoreChange}
                className="grade-input"
              />
              <span> / </span>
              <input
                type="number"
                value={totalScore}
                onChange={handleTotalChange}
                className="grade-total-input"
              />
            </span>
            <button className="save-button">Save</button>
          </div>
        </div>

        <div className="comments-box">
          <h4 className="section-title">Comments</h4>
          <div className="comment-wrapper">
            <div className="comment-list">
              {comments.map((c, index) => (
                <div className="comment" key={index}>
                  <div className="comment-inner">
                    <span className="comment-author">{c.author}</span>
                    <span className="comment-time">({c.time})</span>
                    <p>{c.text}</p>
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

export default ViewSubmission;
