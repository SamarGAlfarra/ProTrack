// src/pages/TaskDetails.jsx
import React, { useState } from 'react';
import SupervisorSideBar from '../components/SupervisorSideBar';
import ViewSubmission from '../components/ViewSubmission';
import './TaskDetails.css';

const TaskDetails = () => {
  const [selectedStudent, setSelectedStudent] = useState(null);

  const handleViewSubmission = (student) => {
    setSelectedStudent(student);
  };

  const closeModal = () => {
    setSelectedStudent(null);
  };

  const students = [
    { name: 'Eman Eldeeb', id: '123456789', status: 'On time' },
    { name: 'Rania Alkiani', id: '123456789', status: 'On time' },
    { name: 'Ahmed Mahdi', id: '123456789', status: 'Late' }
  ];

  return (
    <div className="supervisor-dashboard">
      <SupervisorSideBar />
      <div className="project-details-container">
        <h2 className="project-title">Task 1</h2>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Student Name</th>
                <th>Student ID</th>
                <th>Submission</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student, index) => (
                <tr key={index}>
                  <td>{index + 1}</td>
                  <td>{student.name}</td>
                  <td>{student.id}</td>
                  <td>
                    <button onClick={() => handleViewSubmission(student)}>
                      View Submission
                    </button>
                  </td>
                  <td>
                    <span className={`status ${student.status === 'On time' ? 'on-time' : 'late'}`}>
                      {student.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedStudent && (
        <ViewSubmission student={selectedStudent} onClose={closeModal} />
      )}
    </div>
  );
};

export default TaskDetails;
