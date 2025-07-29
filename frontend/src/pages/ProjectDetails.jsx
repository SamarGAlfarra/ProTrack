import React from 'react';
import { useParams } from 'react-router-dom';
import SupervisorSideBar from '../components/SupervisorSideBar';
import './ProjectDetails.css';

import sendIcon from '../assets/send.png';
import addIcon from '../assets/add.png';

const ProjectDetails = () => {
  const { id } = useParams();

  return (
    <div className="supervisor-dashboard">
      <SupervisorSideBar />

      <div className="project-details-container">
        {/* Project Title */}
        <h2 className="project-title">Restaurant Website</h2>

        {/* Posts */}
        <div className="posts-section">
          <div className="post">
            <div className="post-author">Sahar Ali</div>
            <div className="post-text">Please make it on sunday from 12:00 → 14:00</div>
            <div className="post-timestamp">01/01/2025 14:42</div>
          </div>

          <div className="post">
            <div className="post-author">Samar Alfarra</div>
            <div className="post-text">Can we change the meeting time?</div>
            <div className="post-timestamp">01/01/2025 14:42</div>
          </div>
        </div>

        {/* Add Update */}
        <div className="add-update">
          <input type="text" placeholder="Add Update" />
          <img src={sendIcon} alt="Send" />
        </div>

        {/* Bottom Section */}
        <div className="bottom-section">
          {/* Team Table */}
          <div className="team-info">
            <h3 className="team-title">Team’s Name : <strong>Power</strong></h3>
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
              <img src={addIcon} alt="Add Task" className="add-task-icon" />
            </div>

            {/* Task items */}
            <div className="task">
              <p className="task-title">Task 1</p>
              <p className="task-status">Status: Graded</p>
              <p className="task-due">Due To 01/01/2025 11:59</p>
            </div>

            <div className="task">
              <p className="task-title">Task 1</p>
              <p className="task-status">Status: Graded</p>
              <p className="task-due">Due To 01/01/2025 11:59</p>
            </div>

            <div className="task">
              <p className="task-title">Task 1</p>
              <p className="task-status">Status: Graded</p>
              <p className="task-due">Due To 01/01/2025 11:59</p>
            </div>

            <div className="task">
              <p className="task-title">Task 1</p>
              <p className="task-status">Status: Graded</p>
              <p className="task-due">Due To 01/01/2025 11:59</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetails;
