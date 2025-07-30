import React from 'react';
import './ViewSubmission.css';
import sendIcon from '../assets/send.png';
import xbutton from '../assets/xbutton.png'; // ✅ Import the close icon

const ViewSubmission = ({ onClose, student }) => {
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
            <span>Graded: 10/10</span>
            <button className="save-button">Save</button>
          </div>
        </div>

        <div className="comments-box">
          <h4 className="section-title">Comments</h4>

          <div className="comment-wrapper">
            <div className="comment">
              <div className="comment-inner">
                <span className="comment-author">Samar Alfarra</span>
                <span className="comment-time">(01/01/2025 14:41)</span>
                <p>I didn’t submit the text file</p>
              </div>
            </div>

            <div className="comment-input-row">
              <input type="text" placeholder="Add Comment" />
              <button className="send-button">
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
