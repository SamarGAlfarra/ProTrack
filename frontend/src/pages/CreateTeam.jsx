import React from "react";
import StudentSideBar from "../components/StudentSideBar";
import "./Admin.css";
import addIcon from "../assets/add-friend.png";

const teamMembers = [
  { id: 1, name: "Ali Ahmad", phone: "0598765432", studentId: "S1001", email: "ali@example.com" },
  { id: 2, name: "Layla Khan", phone: "0591234567", studentId: "S1002", email: "layla@example.com" },
  { id: 3, name: "Yousef Omar", phone: "0562233445", studentId: "S1003", email: "yousef@example.com" },
  { id: 4, name: "Fatma Zaid", phone: "0569988776", studentId: "S1004", email: "fatma@example.com" },
  { id: 5, name: "Zaid", phone: "0569988776", studentId: "S1005", email: "zaid@example.com" },
];

const CreateTeam = () => {
  return (
    <div className="admin-dashboard">
      <StudentSideBar />

      <div className="dashboard-content">
        <h2 className="dashboard-header">Create/Edit Team</h2>

        <div className="form-group">
          <p className="team-name-display">Team A</p>

          <div className="search-container">
            <input
              type="text"
              placeholder="Search"
              className="popup-input with-icon"
            />
            <img
              src="https://img.icons8.com/ios-filled/20/000000/search--v1.png"
              alt="Search"
              className="search-icon-inside"
            />
          </div>
        </div>

        <div className="table-wrapper">
          <table className="team-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Student Name</th>
                <th>Phone Number</th>
                <th>Student ID</th>
                <th>Email ID</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {teamMembers.map((member) => (
                <tr key={member.id}>
                  <td>{member.id}</td>
                  <td>{member.name}</td>
                  <td>{member.phone}</td>
                  <td>{member.studentId}</td>
                  <td>{member.email}</td>
                  <td className="icon-cell">
                    <img
                      src={addIcon}
                      alt="add-friend"
                      className="action-icon"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="save-button-wrapper">
          <button className="save-button">Save</button>
        </div>
      </div>
    </div>
  );
};

export default CreateTeam;
