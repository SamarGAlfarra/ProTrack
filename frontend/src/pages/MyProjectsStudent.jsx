import React, { useState } from 'react';
import './ProjectDetails.css';
import sendIcon from '../assets/send.png';
import StudentSideBar from '../components/StudentSideBar';
import ViewSubmissionStudent from "../components/viewSubmissionStudent";
 // Adjust path if needed

const MyProjectsStudent = () => {
  const [posts, setPosts] = useState([
    {
      author: 'Sahar Ali',
      text: 'Please make it on sunday from 12:00 → 14:00',
      timestamp: '01/01/2025 14:42',
    },
    {
      author: 'Samar Alfarra',
      text: 'Can we change the meeting timing?',
      timestamp: '01/01/2025 14:42',
    },
  ]);
  const [newPost, setNewPost] = useState('');
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);

  const handleSend = () => {
    if (newPost.trim() === '') return;
    const newMessage = {
      author: 'You',
      text: newPost,
      timestamp: new Date().toLocaleString('en-GB').replace(',', ''),
    };
    setPosts([...posts, newMessage]);
    setNewPost('');
  };

  const handleTaskClick = () => {
    setShowSubmissionModal(true);
  };

  const handleCloseModal = () => {
    setShowSubmissionModal(false);
  };

  return (
    <div className="supervisor-dashboard">
      <StudentSideBar />

      <div className="project-details-container">
        <h2 className="project-title">Restaurant Website</h2>

        <div className="posts-section">
          {posts.map((post, index) => (
            <div className="post" key={index}>
              <div className="post-author">{post.author}</div>
              <div className="post-text">{post.text}</div>
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
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          />
          <img src={sendIcon} alt="Send" onClick={handleSend} />
        </div>

        <div className="meeting-section">
          <h3 className="meeting-title">Upcoming Meeting</h3>
          <div className="meeting-box">
            <span>Discussion 1 </span>
            <span> Wednesday at &nbsp;14:00 </span>
            <button className="join-button">Join Meeting</button>
          </div>
        </div>

        <div className="tasks-grade-container">
          <div className="tasks-header-row">
            <h3 className="tasks-title">All Tasks</h3>
            <div className="final-grade">Final Grade: --/100</div>
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
                {[...Array(7)].map((_, index) => (
                  <tr key={index}>
                    <td
                      onClick={handleTaskClick}
                      style={{ textDecoration: 'underline', cursor: 'pointer' }}
                    >
                      Task {index + 1}
                    </td>
                    <td>Apr 15, 2025</td>
                    <td>
                      <span className="status submitted">Submitted</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showSubmissionModal && <ViewSubmissionStudent onClose={handleCloseModal} />}
    </div>
  );
};

export default MyProjectsStudent;
