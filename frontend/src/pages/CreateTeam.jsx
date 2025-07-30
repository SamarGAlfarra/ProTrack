import React, { useState, useEffect, useRef } from "react";
import StudentSideBar from "../components/StudentSideBar";
import "./Admin.css";
import addIcon from "../assets/add-friend.png";
import searchIcon from "../assets/search.png";

const initialMembers = [
  { id: 1, name: "Ali Ahmad", phone: "0598765432", studentId: "S1001", email: "ali@example.com" },
  { id: 2, name: "Layla Khan", phone: "0591234567", studentId: "S1002", email: "layla@example.com" },
  { id: 3, name: "Yousef Omar", phone: "0562233445", studentId: "S1003", email: "yousef@example.com" },
  { id: 4, name: "Fatma Zaid", phone: "0569988776", studentId: "S1004", email: "fatma@example.com" },
  { id: 5, name: "Zaid", phone: "0569988776", studentId: "S1005", email: "zaid@example.com" },
];

const CreateTeam = () => {
  const [searchTerms, setSearchTerms] = useState({
    name: '',
    phone: '',
    studentId: '',
    email: '',
  });

  const [teamName, setTeamName] = useState('');


  const [activeSearch, setActiveSearch] = useState({
    name: false,
    phone: false,
    studentId: false,
    email: false,
  });

  const tableRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (tableRef.current && !tableRef.current.contains(event.target)) {
        setSearchTerms({ name: '', phone: '', studentId: '', email: '' });
        setActiveSearch({ name: false, phone: false, studentId: false, email: false });
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleSearch = (field) => {
    setActiveSearch(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handleSearchChange = (field, value) => {
    setSearchTerms(prev => ({
      ...prev,
      [field]: value.toLowerCase()
    }));
  };

  const filteredMembers = initialMembers.filter(member =>
    member.name.toLowerCase().includes(searchTerms.name) &&
    member.phone.toLowerCase().includes(searchTerms.phone) &&
    member.studentId.toLowerCase().includes(searchTerms.studentId) &&
    member.email.toLowerCase().includes(searchTerms.email)
  );

  return (
    <div className="admin-dashboard">
      <StudentSideBar />

      <div className="dashboard-content">
        <h2 className="dashboard-header">Create/Edit Team</h2>

        <div className="form-group">
          <input
            type="text"
            className="team-name-input"
            placeholder="Enter Team Name"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
          />
        </div>


        <div className="table-wrapper" ref={tableRef}>
          <table className="team-table">
            <thead>
              <tr>
                <th>#</th>

                <th>
                  {activeSearch.name ? (
                    <input
                      type="text"
                      placeholder="Search Name"
                      className="column-search"
                      onChange={(e) => handleSearchChange('name', e.target.value)}
                      autoFocus
                    />
                  ) : (
                    <span className="header-label">
                      Student Name
                      <img
                        src={searchIcon}
                        alt="Search"
                        className="search-icon"
                        onClick={() => toggleSearch('name')}
                      />
                    </span>
                  )}
                </th>

                <th>
                  {activeSearch.phone ? (
                    <input
                      type="text"
                      placeholder="Search Phone"
                      className="column-search"
                      onChange={(e) => handleSearchChange('phone', e.target.value)}
                      autoFocus
                    />
                  ) : (
                    <span className="header-label">
                      Phone Number
                      <img
                        src={searchIcon}
                        alt="Search"
                        className="search-icon"
                        onClick={() => toggleSearch('phone')}
                      />
                    </span>
                  )}
                </th>

                <th>
                  {activeSearch.studentId ? (
                    <input
                      type="text"
                      placeholder="Search ID"
                      className="column-search"
                      onChange={(e) => handleSearchChange('studentId', e.target.value)}
                      autoFocus
                    />
                  ) : (
                    <span className="header-label">
                      Student ID
                      <img
                        src={searchIcon}
                        alt="Search"
                        className="search-icon"
                        onClick={() => toggleSearch('studentId')}
                      />
                    </span>
                  )}
                </th>

                <th>
                  {activeSearch.email ? (
                    <input
                      type="text"
                      placeholder="Search Email"
                      className="column-search"
                      onChange={(e) => handleSearchChange('email', e.target.value)}
                      autoFocus
                    />
                  ) : (
                    <span className="header-label">
                      Email ID
                      <img
                        src={searchIcon}
                        alt="Search"
                        className="search-icon"
                        onClick={() => toggleSearch('email')}
                      />
                    </span>
                  )}
                </th>

                <th></th>
              </tr>
            </thead>
            <tbody>
              {filteredMembers.map((member, index) => (
                <tr key={member.id}>
                  <td>{index + 1}</td>
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
