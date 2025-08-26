import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import './ProjectDetails.css';
import sendIcon from '../assets/send.png';
import StudentSideBar from '../components/StudentSideBar';
import ViewSubmissionStudent from "../components/viewSubmissionStudent";
import axios from "../axios";

const MyProjectsStudent = () => {
  const { projectId } = useParams();            // <-- from route /student/projects/:projectId
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState('');
  const [meeting, setMeeting] = useState({ title: '', time: '', link: '' });
  const [tasks, setTasks] = useState([]);
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);
  const [activeTaskId, setActiveTaskId] = useState(null);

  // load page data
  useEffect(() => {
    (async () => {
      try {
        const { data } = await axios.get(`/student/projects/${projectId}/details`);
        setPosts(data.posts || []);
        setMeeting({
          title: data.project?.title || 'Project Meeting',
          time: data.project?.meeting_time || '',
          link: data.project?.meeting_link || '#',
        });
        setTasks(data.tasks || []);
      } catch (e) {
        console.error(e);
      }
    })();
  }, [projectId]);

  const handleSend = async () => {
    if (!newPost.trim()) return;
    try {
      const { data } = await axios.post(`/student/projects/${projectId}/posts`, {
        content: newPost.trim(),
      });
      // prepend newly created post (API returns the saved row)
      setPosts([data, ...posts]);
      setNewPost('');
    } catch (e) {
      console.error(e);
    }
  };

  const handleTaskClick = (taskId) => {
    setActiveTaskId(taskId);
    setShowSubmissionModal(true);
  };
  const handleCloseModal = () => {
    setShowSubmissionModal(false);
    setActiveTaskId(null);
  };

  return (
    <div className="supervisor-dashboard">
      <StudentSideBar />
      <div className="project-details-container">
        <h2 className="project-title">{meeting.title || 'Project'}</h2>

        {/* posts */}
        <div className="posts-section">
          {posts.map((post, idx) => (
            <div className="post" key={idx}>
              <div className="post-author">{post.author_name}</div>
              <div className="post-text">{post.content}</div>
              <div className="post-timestamp">{post.timestamp}</div>
            </div>
          ))}
        </div>

        {/* add post */}
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

        {/* meeting */}
        <div className="meeting-section">
          <h3 className="meeting-title">Upcoming Meeting</h3>
          <div className="meeting-box">
            <span>Discussion</span>
            <span>&nbsp;{meeting.time}</span>
            <a className="join-button" href={meeting.link} target="_blank" rel="noreferrer">Join Meeting</a>
          </div>
        </div>

        {/* tasks */}
        <div className="tasks-grade-container">
          <div className="tasks-header-row">
            <h3 className="tasks-title">All Tasks</h3>
            <div className="final-grade">Final Grade: --/100</div>
          </div>
          <div className="tasks-table-wrapper">
            <table className="tasks-table">
              <thead>
                <tr><th>Task</th><th>Deadline</th><th>Status</th></tr>
              </thead>
              <tbody>
                {tasks.map(t => (
                  <tr key={t.id}>
                    <td
                      onClick={() => handleTaskClick(t.id)}
                      style={{ textDecoration: 'underline', cursor: 'pointer' }}
                    >
                      {t.name}
                    </td>
                    <td>{t.deadline}</td>
                    <td>
                      <span className={`status ${t.status.toLowerCase().replace(' ', '-')}`}>{t.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showSubmissionModal && (
        <ViewSubmissionStudent
          taskId={activeTaskId}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
};

export default MyProjectsStudent;
