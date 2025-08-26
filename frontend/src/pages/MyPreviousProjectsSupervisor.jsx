import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import SupervisorSideBar from '../components/SupervisorSideBar';
import './MyProjects.css';

import editIcon from '../assets/edit.png';
import trashIcon from '../assets/trash.png';
import dropdownArrow from '../assets/arrow.png';

import axios from '../axios';

const MyPreviousProjectsSupervisor = () => {
  const [serverProjects, setServerProjects] = useState([]);
  const [projLimit, setProjLimit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [filters, setFilters] = useState({ subject: '' });

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get('/supervisor/previous-projects');
      setServerProjects(Array.isArray(data.projects) ? data.projects : []);
      setProjLimit(typeof data.projects_no_limit === 'number' ? data.projects_no_limit : null);
      setError(null);
    } catch (e) {
      console.error(e);
      setError('Failed to load projects.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!mounted) return;
      await fetchProjects();
    })();
    return () => { mounted = false; };
  }, []);

  const onActivate = async (projectId) => {
    try {
      setLoading(true);
      await axios.post(`/supervisor/projects/${projectId}/activate`);
      // Remove it from the list (it’s now in current semester)
      setServerProjects((prev) => prev.filter(p => p.id !== projectId));
    } catch (e) {
      console.error(e);
      setError('Activation failed.');
    } finally {
      setLoading(false);
    }
  };

  // Basic client-side subject filter (server already returns only reserved, non-current)
  const filteredProjects = serverProjects.filter((p) => {
    const matchSubject = filters.subject
      ? (p.title || '').toLowerCase().includes(filters.subject.toLowerCase())
      : true;
    return matchSubject;
  });

  return (
    <div className="supervisor-dashboard">
      <SupervisorSideBar />

      <div className="projects-container">
        <h2>My Previous Projects</h2>

        <div className="filters">
          <input
            type="text"
            name="subject"
            placeholder="Search by Subject"
            value={filters.subject}
            onChange={handleFilterChange}
            className="filter-dropdown"
          />
        </div>

        {loading && <div style={{ marginTop: 8 }}>Loading...</div>}
        {error && <div style={{ marginTop: 8, color: 'crimson' }}>{error}</div>}

        <div className="project-list">
          {filteredProjects.map((project) => (
            <div className="project-item" key={project.id}>
              <Link
                to={`/supervisor/projectdetails/${project.id}`}
                className="project-title"
                title={project.semester_name ? `Semester: ${project.semester_name}` : ''}
              >
                {project.title}
              </Link>
              <button
                className="pp-activate"
                onClick={() => onActivate(project.id)}
              >
                Activate
              </button>
            </div>
          ))}

          {!loading && filteredProjects.length === 0 && (
            <div style={{ marginTop: 8 }}>No previous reserved projects found.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyPreviousProjectsSupervisor;
