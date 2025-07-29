import React, { useState } from 'react';
import SupervisorSideBar from '../components/SupervisorSideBar';
import './AddProject.css';

const AddProject = () => {
  const [projectName, setProjectName] = useState('');
  const [meetingDay, setMeetingDay] = useState('');
  const [startTime, setStartTime] = useState('');
  const [meetingLink, setMeetingLink] = useState('');
  const [summary, setSummary] = useState('');
  const [files, setFiles] = useState([]);

  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files);
    const validFiles = selected.filter(file =>
      ['application/pdf', 'text/plain'].includes(file.type)
    );

    if (validFiles.length + files.length > 2) {
      alert('You can only upload a maximum of 2 files.');
      return;
    }

    setFiles(validFiles);
  };

  const getFileIcon = (fileName) => {
    const ext = fileName.split('.').pop().toLowerCase();
    if (ext === 'pdf') {
      return 'https://cdn-icons-png.flaticon.com/512/337/337946.png';
    } else if (ext === 'txt') {
      return 'https://cdn-icons-png.flaticon.com/512/3022/3022255.png';
    }
    return '';
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log({
      projectName,
      meetingDay,
      startTime,
      meetingLink,
      summary,
      files,
    });
  };

  return (
    <div className="supervisor-dashboard">
      <SupervisorSideBar />

      <div className="projects-container">
        <h2>Add Project</h2>

        <form className="add-project-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <label>Project Name</label>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              required
            />
          </div>

          <div className="form-row">
            <label>Meeting Time</label>
            <select value={meetingDay} onChange={(e) => setMeetingDay(e.target.value)} required>
              <option value="">Choose Day</option>
              <option value="Saturday">Saturday</option>
              <option value="Sunday">Sunday</option>
              <option value="Monday">Monday</option>
              <option value="Tuesday">Tuesday</option>
              <option value="Wednesday">Wednesday</option>
              
            </select>

            <select value={startTime} onChange={(e) => setStartTime(e.target.value)} required>
              <option value="">Start Time</option>
              <option value="09:00">09:00</option>
              <option value="10:00">10:00</option>
              <option value="11:00">10:00</option>
              <option value="12:00">10:00</option>
              <option value="1:00">10:00</option>
              <option value="2:00">10:00</option>
              <option value="3:00">10:00</option>
            </select>
          </div>

          <div className="form-row">
            <label>Meeting Link</label>
            <input
              type="url"
              value={meetingLink}
              onChange={(e) => setMeetingLink(e.target.value)}
              required
            />
          </div>

          <div className="form-row vertical">
            <label>Project Summary</label>
            <textarea
              rows="5"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              required
            ></textarea>
          </div>

          <div className="form-row vertical">
            <label>Upload Files</label>
            <div className="file-upload-row">
              <label htmlFor="fileUpload" className="file-choose-btn">Choose Files</label>
              <input
                type="file"
                id="fileUpload"
                className="hidden-file-input"
                accept=".pdf,.txt"
                multiple
                onChange={handleFileChange}
              />
              <span className="no-file-text">
                {files.length === 0 ? 'No File Chosen' : ''}
              </span>
            </div>

            {files.length > 0 && (
              <div className="file-preview">
                {files.map((file, index) => (
                  <div className="file-icon-label" key={index}>
                    <img src={getFileIcon(file.name)} alt="file" className="file-icon" />
                    <span className="file-link">{file.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="form-row right-align">
            <button type="submit" className="add-project-btn">Save</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddProject;
