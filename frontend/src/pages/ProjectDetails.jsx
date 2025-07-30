import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom'; // ✅ added useNavigate
import SupervisorSideBar from '../components/SupervisorSideBar';
import Calendar from '../components/Calendar';
import './ProjectDetails.css';

import sendIcon from '../assets/send.png';
import addIcon from '../assets/add.png';
import calendarIcon from '../assets/calendar.png';
import closeIcon from '../assets/xbutton.png';

const ProjectDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate(); // ✅ initialize navigate

  const [posts, setPosts] = useState([
    {
      author: 'Sahar Ali',
      text: 'Please make it on sunday from 12:00 → 14:00',
      timestamp: '01/01/2025 14:42',
    },
    {
      author: 'Samar Alfarra',
      text: 'Can we change the meeting time?',
      timestamp: '01/01/2025 14:42',
    },
  ]);

  const [newPost, setNewPost] = useState('');
  const [showPopup, setShowPopup] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);

  const [taskTitle, setTaskTitle] = useState('');
  const [deadline, setDeadline] = useState('');
  const [subject, setSubject] = useState('');
  const [file, setFile] = useState(null);

  const handleSend = () => {
    if (newPost.trim() === '') return;
    const newMessage = {
      author: 'You',
      text: newPost,
      timestamp: new Date().toLocaleString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).replace(',', ''),
    };
    setPosts([...posts, newMessage]);
    setNewPost('');
  };

  const handleDateTimeSelect = (date) => {
    const formatted = date.toLocaleString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).replace(',', '');
    setDeadline(formatted);
  };

  const handleCalendarDone = () => {
    setShowCalendar(false);
  };

  return (
    <div className="supervisor-dashboard">
      <SupervisorSideBar />

      <div className="project-details-container">
        <h2 className="project-title">Restaurant Website</h2>

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
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          />
          <img src={sendIcon} alt="Send" onClick={handleSend} />
        </div>

        {/* Bottom Section */}
        <div className="bottom-section">
          {/* Team Info */}
          <div className="team-info">
            <h3 className="team-title">
              Team’s Name : <strong>Power</strong>
            </h3>
            <p className="team-code">Team’s Code : ABC1234</p>

            <div className="table-wrapper">
              <table className="team-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Student Name</th>
                    <th>Student ID</th>
                    <th>Final Grade</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>1</td>
                    <td>Example Name</td>
                    <td>123456</td>
                    <td>A+</td>
                  </tr>
                  <tr>
                    <td>2</td>
                    <td>Another Name</td>
                    <td>654321</td>
                    <td>A</td>
                  </tr>
                  <tr>
                    <td>3</td>
                    <td>Third Member</td>
                    <td>112233</td>
                    <td>B+</td>
                  </tr>
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
              {[1, 2, 3, 4, 5].map((num) => (
                <div
                  className="task"
                  key={num}
                  onClick={() => navigate(`/supervisor/taskdetails/${num}`)} // ✅ navigate on click
                  style={{ cursor: 'pointer' }} // ✅ pointer cursor
                >
                  <div className="task-left">
                    <p className="task-title">Task {num}</p>
                  </div>
                  <div className="task-right">
                    <p className="task-status">Status: Graded</p>
                    <p className="task-due">Due To 01/01/2025 11:59</p>
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
                <h3>Add Task</h3>
                <img
                  src={closeIcon}
                  alt="Close"
                  className="popup-close"
                  onClick={() => {
                    setShowPopup(false);
                    setShowCalendar(false);
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
                      onClear={() => setDeadline('')}
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
                  onChange={(e) => setFile(e.target.files[0])}
                  className="popup-file"
                />

                <button className="popup-save">Save</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectDetails;
