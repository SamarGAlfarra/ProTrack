import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import SupervisorSideBar from '../components/SupervisorSideBar';
import './MyProjects.css';

import editIcon from '../assets/edit.png';
import trashIcon from '../assets/trash.png';
import dropdownArrow from '../assets/arrow.png';


const MyProjects = () => {
  const [projects] = useState([
    { id: 1, title: 'Restaurant Website', status: 'Available' },
    { id: 2, title: 'Mobile App', status: 'Available' },
    { id: 3, title: 'Mobile App', status: 'Reserved' },
    { id: 4, title: 'Mobile App', status: 'Reserved' },
  ]);

  const [filters, setFilters] = useState({ subject: '', status: '' });

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const filteredProjects = projects.filter((project) => {
    const matchSubject = filters.subject
      ? project.title.toLowerCase().includes(filters.subject.toLowerCase())
      : true;
    const matchStatus = filters.status
      ? project.status === filters.status
      : true;
    return matchSubject && matchStatus;
  });

  return (
    <div className="supervisor-dashboard">
      <SupervisorSideBar />

      <div className="projects-container">
        <h2>My Projects</h2>

        <div className="filters">
          <input
            type="text"
            name="subject"
            placeholder="Subject"
            value={filters.subject}
            onChange={handleFilterChange}
            className="filter-dropdown"
          />

          <div className="select-with-arrow">
            <select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className="filter-dropdown"
            >
              <option value="">Status</option>
              <option value="Available">Available</option>
              <option value="Reserved">Reserved</option>
            </select>
            <img src={dropdownArrow} alt="Dropdown Arrow" className="arrow-icon" />
          </div>


          <span className="project-limit">Max. Number of projects is 5</span>
        </div>

        <div className="project-list">
          {filteredProjects.map((project) => (
            <div className="project-item" key={project.id}>
              <Link
                to={`/supervisor/projectdetails/${project.id}`}
                className="project-title"
              >
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
