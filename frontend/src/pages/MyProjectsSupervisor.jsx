import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import SupervisorSideBar from '../components/SupervisorSideBar';
import './MyProjects.css';

import editIcon from '../assets/edit.png';
import trashIcon from '../assets/trash.png';

const MyProjects = () => {
  const [projects] = useState([
    { id: 1, title: 'Restaurant Website', status: 'Available' },
    { id: 2, title: 'Mobile App', status: 'Available' },
    { id: 3, title: 'Mobile App', status: 'Reserved' },
    { id: 4, title: 'Mobile App', status: 'Reserved' },
  ]);

  return (
    <div className="supervisor-dashboard">
      <SupervisorSideBar />

      <div className="projects-container">
        <h2>My Projects</h2>

        <div className="filters">
          <select>
            <option value="">Subject</option>
          </select>
          <select>
            <option value="">Status</option>
            <option value="Available">Available</option>
            <option value="Reserved">Reserved</option>
          </select>
          <span className="project-limit">Max. Number of projects is 5</span>
        </div>

        <div className="project-list">
          {projects.map((project) => (
            <div className="project-item" key={project.id}>
              <Link to={`/supervisor/myproject/${project.id}`} className="project-title">
                {project.title}
              </Link>

              <span className={`status ${project.status.toLowerCase()}`}>
                {project.status}
              </span>

              <Link to={`/supervisor/editproject/${project.id}`}>
                <img src={editIcon} alt="Edit" className="icon-button" />
              </Link>

              <img src={trashIcon} alt="Delete" className="icon-button" />
            </div>
          ))}
        </div>

        <div className="add-project-wrapper">
          <Link to="/supervisor/addproject">
            <button className="add-project-btn">Add Project</button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default MyProjects;
