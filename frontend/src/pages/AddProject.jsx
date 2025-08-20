import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import SupervisorSideBar from '../components/SupervisorSideBar';
import './AddProject.css';
import axios from "../axios";

const AddProject = () => {
  const [projectName, setProjectName] = useState('');
  const [meetingDay, setMeetingDay] = useState('');
  const [startTime, setStartTime] = useState('');
  const [meetingLink, setMeetingLink] = useState('');
  const [summary, setSummary] = useState('');
  const [files, setFiles] = useState([]);

  // ✅ ملفات موجودة مسبقًا (عرض فقط)
  const [existingFiles, setExistingFiles] = useState([]); // [{name, url}]

  const { id } = useParams();
  const isEditMode = !!id;

  useEffect(() => {
    if (isEditMode) {
      (async () => {
        try {
          const { data } = await axios.get(`/supervisor/projects/${id}`);

          setProjectName(data.title || '');
          setMeetingDay(data.meeting_day || '');
          setStartTime(data.start_time || '');
          setMeetingLink(data.meeting_link || '');
          setSummary(data.summary || '');
          setFiles([]); // لن نعيد رفع القديمة

          // ✅ جهّز الملفات الموجودة للعرض
          const ex = (data.files || []).map((p, idx) => ({
            name: (p || '').split('/').pop(),
            url: (data.file_urls && data.file_urls[idx]) ? data.file_urls[idx] : null,
          }));
          setExistingFiles(ex);

          return; // لا نحتاج أي fallback
        } catch (e) {
          console.warn('Failed to fetch project, leaving fields empty.', e);
        }
      })();
    }
  }, [id, isEditMode]);

  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files);

    if (selected.length + files.length > 5) {
      alert('You can only upload a maximum of 5 files.');
      return;
    }

    setFiles(prev => [...prev, ...selected]);
  };

  const getFileIcon = (fileName) => {
    const ext = (fileName || '').split('.').pop().toLowerCase();
    const icons = {
      pdf: 'https://cdn-icons-png.flaticon.com/512/337/337946.png',
      txt: 'https://cdn-icons-png.flaticon.com/512/3022/3022255.png',
      doc: 'https://cdn-icons-png.flaticon.com/512/281/281760.png',
      docx: 'https://cdn-icons-png.flaticon.com/512/281/281760.png',
      jpg: 'https://cdn-icons-png.flaticon.com/512/136/136524.png',
      png: 'https://cdn-icons-png.flaticon.com/512/136/136524.png',
      default: 'https://cdn-icons-png.flaticon.com/512/716/716784.png',
    };
    return icons[ext] || icons['default'];
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const form = new FormData();
    form.append("title", projectName);
    form.append("meeting_day", meetingDay);
    form.append("start_time", startTime);
    form.append("meeting_link", meetingLink);
    form.append("summary", summary);
    if (files && files.length > 0) {
      files.forEach((f) => form.append("files[]", f));
    }

    try {
      if (isEditMode) {
        // await axios.put(`/supervisor/projects/${id}`, form);
        await axios.post(`/supervisor/projects/${id}`, form); // حسب الراوت لديك
        alert("Project updated successfully.");
      } else {
        const { data } = await axios.post("/supervisor/projects", form);
        alert(`Project created. ID = ${data.project_id}`);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to save project. Please check console.");
    }
  };

  return (
    <div className="supervisor-dashboard">
      <SupervisorSideBar />

      <div className="projects-container">
        <h2>{isEditMode ? 'Edit Project' : 'Add Project'}</h2>

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
              <option value="Thursday">Thursday</option>
              <option value="Friday">Friday</option>
            </select>

            <select value={startTime} onChange={(e) => setStartTime(e.target.value)} required>
              <option value="">Start Time</option>
              <option value="08:00">08:00</option>
              <option value="09:00">09:00</option>
              <option value="10:00">10:00</option>
              <option value="11:00">11:00</option>
              <option value="12:00">12:00</option>
              <option value="13:00">13:00</option>
              <option value="14:00">14:00</option>
              <option value="15:00">15:00</option>
              <option value="16:00">16:00</option>
              <option value="17:00">17:00</option>
              <option value="18:00">18:00</option>
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
                accept="*"
                multiple
                onChange={handleFileChange}
              />
              <span className="no-file-text">
                {files.length === 0 ? 'No File Chosen' : ''}
              </span>
            </div>

            {/* ملفات جديدة مختارة الآن */}
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

            {/* ✅ عرض الملفات الموجودة مسبقًا (Edit فقط) */}
            {isEditMode && existingFiles.length > 0 && (
              <div className="file-preview" style={{ marginTop: '8px' }}>
                {existingFiles.map((f, i) => (
                  <div className="file-icon-label" key={`existing-${i}`}>
                    <img src={getFileIcon(f.name)} alt="file" className="file-icon" />
                    {f.url ? (
                      <a
                        className="file-link"
                        href={f.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {f.name}
                      </a>
                    ) : (
                      <span className="file-link">{f.name}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="form-row right-align">
            <button type="submit" className="add-project-btn">
              {isEditMode ? 'Update' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddProject;
