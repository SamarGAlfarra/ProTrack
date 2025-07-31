import React, { useState } from 'react';
import './ViewSubmission.css';
import xbutton from '../assets/xbutton.png';
import sendIcon from '../assets/send.png';

const ViewSubmissionStudent = ({ onClose }) => {
  const [comments, setComments] = useState([
    {
      author: 'Samar Alfarra',
      time: '01/01/2025 14:41',
      text: 'I didn’t submit the text file',
    },
  ]);
  const [newComment, setNewComment] = useState('');

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

    setComments([newEntry, ...comments]);
    setNewComment('');
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="modal-close" onClick={onClose}>
          <img src={xbutton} alt="Close" />
        </button>

        {/* Title and Grade Row */}
        <div className="grade-row">
            <h3 className="section-title" style={{ marginBottom: 0, marginTop: 0, flex: 1 }}>Your work</h3>
            <span className="grade-score">Graded: --/10</span>
            </div>

        {/* Submission */}
        <div className="submission-box" style={{ textAlign: 'center' }}>
          <input
            type="file"
            id="file"
            multiple
            onChange={(e) => {
                if (e.target.files.length > 5) {
                alert('You can upload a maximum of 5 files.');
                e.target.value = ''; // Clear selection
                }
            }}
            style={{ marginBottom: '12px', fontFamily: 'inherit' }}
            />
          <button className="save-button">Mark as done</button>
        </div>

        {/* Comments Section */}
        <div className="comments-box">
          <h4 className="section-title">Comments</h4>
          <div className="comment-wrapper">
            <div className="comment-list">
              {comments.map((c, index) => (
                <div className="comment" key={index}>
                  <div className="comment-inner">
                    <span className="comment-author">{c.author}</span>{' '}
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

export default ViewSubmissionStudent;
