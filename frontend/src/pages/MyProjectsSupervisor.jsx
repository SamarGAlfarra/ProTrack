import React, { useState } from 'react';
import SupervisorSideBar from '../components/SupervisorSideBar';
import './MyProjects.css';

import editIcon from '../assets/edit.png';
import trashIcon from '../assets/trash.png';

const MyProjects = () => {
  const [projects, setProjects] = useState([
    { title: 'Restaurant Website', status: 'Available', isEditing: false },
    { title: 'Mobile App', status: 'Available', isEditing: false },
    { title: 'Mobile App', status: 'Reserved', isEditing: false },
    { title: 'Mobile App', status: 'Reserved', isEditing: false },
  ]);

  // Start editing on click
  const enableEdit = (index) => {
    setProjects((prev) =>
      prev.map((p, i) =>
        i === index ? { ...p, isEditing: true } : { ...p, isEditing: false }
      )
    );
  };

  // Save status and exit edit mode
  const updateStatus = (index, newStatus) => {
    setProjects((prev) =>
      prev.map((p, i) =>
        i === index ? { ...p, status: newStatus, isEditing: false } : p
      )
    );
  };

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
          {projects.map((project, index) => (
            <div className="project-item" key={index}>
              <span className="project-title">{project.title}</span>

              {project.isEditing ? (
                <select
                  value={project.status}
                  onChange={(e) => updateStatus(index, e.target.value)}
                  className={`status-dropdown ${project.status.toLowerCase()}`}
                  autoFocus
                >
                  <option value="Available">Available</option>
                  <option value="Reserved">Reserved</option>
                </select>
              ) : (
                <span className={`status ${project.status.toLowerCase()}`}>
                  {project.status}
                </span>
              )}

              <img
                src={editIcon}
                alt="Edit"
                className="icon-button"
                onClick={() => enableEdit(index)}
              />
              <img
                src={trashIcon}
                alt="Delete"
                className="icon-button"
              />
            </div>
          ))}
        </div>

        <div className="add-project-wrapper">
          <button className="add-project-btn">Add Project</button>
        </div>
      </div>
    </div>
  );
};

export default MyProjects;
