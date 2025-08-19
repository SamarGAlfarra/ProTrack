import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import SupervisorSideBar from '../components/SupervisorSideBar';
import './MyProjects.css';

import editIcon from '../assets/edit.png';
import trashIcon from '../assets/trash.png';
import dropdownArrow from '../assets/arrow.png';

import axios from '../axios';

const MyProjects = () => {
  // Removed initial demo projects, only server data now
  const [serverProjects, setServerProjects] = useState([]);
  const [projLimit, setProjLimit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [filters, setFilters] = useState({ subject: '', status: '' });

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        setLoading(true);
        const { data } = await axios.get('/supervisor/my-projects');
        if (!isMounted) return;

        setServerProjects(Array.isArray(data.projects) ? data.projects : []);
        setProjLimit(
          typeof data.projects_no_limit === 'number' ? data.projects_no_limit : null
        );
      } catch (e) {
        console.error(e);
        setError('Failed to load projects.');
      } finally {
        setLoading(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  // Filter projects from server
  const filteredProjects = serverProjects.filter((project) => {
    const matchSubject = filters.subject
      ? (project.title || '').toLowerCase().includes(filters.subject.toLowerCase())
      : true;
    const matchStatus = filters.status
      ? (project.status || '') === filters.status
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
            placeholder="Search by Subject"
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

          <span className="project-limit">
            {projLimit != null
              ? `Max. Number of projects is ${projLimit}`
              : 'Max. Number of projects is 5'}
          </span>
        </div>

        {loading && <div style={{ marginTop: 8 }}>Loading...</div>}
        {error && <div style={{ marginTop: 8, color: 'crimson' }}>{error}</div>}

        <div className="project-list">
          {filteredProjects.map((project) => (
            <div className="project-item" key={project.id}>
              <Link
                to={`/supervisor/projectdetails/${project.id}`}
                className="project-title"
              >
                {project.title}
              </Link>

              <span className={`status ${String(project.status).toLowerCase()}`}>
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
