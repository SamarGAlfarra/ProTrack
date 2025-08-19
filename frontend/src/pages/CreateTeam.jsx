import React, { useState, useEffect, useRef } from "react";
import StudentSideBar from "../components/StudentSideBar";
import "./Admin.css";
import addIcon from "../assets/add-friend.png";
import searchIcon from "../assets/search.png";
import axios from "../axios";

const CreateTeam = () => {
  const [searchTerms, setSearchTerms] = useState({ name: "", phone: "", studentId: "", email: "" });
  const [teamName, setTeamName] = useState("");
  const [activeSearch, setActiveSearch] = useState({ name: false, phone: false, studentId: false, email: false });
  const [serverPeople, setServerPeople] = useState([]);
  const [teamMeta, setTeamMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const tableRef = useRef(null);

  const fetchPeople = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get("/student/invite/people", {
        params: {
          name: searchTerms.name,
          phone: searchTerms.phone,
          studentId: searchTerms.studentId,
          email: searchTerms.email,
        },
      });
      setServerPeople(data.people || []);
      setTeamMeta(data.team || null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (tableRef.current && !tableRef.current.contains(event.target)) {
        setSearchTerms({ name: "", phone: "", studentId: "", email: "" });
        setActiveSearch({ name: false, phone: false, studentId: false, email: false });
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => { fetchPeople(); }, []);
  useEffect(() => {
    const id = setTimeout(fetchPeople, 300);
    return () => clearTimeout(id);
  }, [searchTerms]);

  const toggleSearch = (field) => setActiveSearch((prev) => ({ ...prev, [field]: !prev[field] }));
  const handleSearchChange = (field, value) =>
    setSearchTerms((prev) => ({ ...prev, [field]: value.toLowerCase() }));

  const onSave = async () => {
  if (!teamName.trim()) {
    alert("Please enter a team name first.");
    return;
  }

  // 👇 Block non-admin from renaming/creating (frontend check)
  if (teamMeta && teamMeta.id && teamMeta.isAdmin === false) {
    alert("You are not the team admin. You cannot edit the team name.");
    return;
  }

  try {
    await axios.post("/student/team/save", { team_name: teamName.trim() });
    await fetchPeople(); // after creating/renaming, you’ll own a team -> candidates will show
    alert("Team saved.");
  } catch (err) {
    // 👇 Show backend error in UI instead of only console
    const msg =
      err?.response?.data?.message ||
      err?.response?.data ||
      "Failed to save team.";
    alert(msg);
  }
};

    const invite = async (studentId) => {
      if (!teamMeta?.id) {
        alert("Create/Save your team first.");
        return;
      }

          // 👇 Block non-admin from inviting
      if (teamMeta.isAdmin === false) {
        alert("You are not the team admin. You cannot invite others.");
        return;
      }

      const atCapacity =
        typeof teamMeta.current_count === "number" &&
        typeof teamMeta.members_limit === "number" &&
        teamMeta.current_count >= teamMeta.members_limit;

      if (atCapacity) {
        alert("Team capacity reached.");
        return;
      }

      try {
        await axios.post(`/student/invite/${studentId}`);
        await fetchPeople();
        alert("Invite sent.");
      } catch (err) {
        const msg =
          err?.response?.data?.message ||
          err?.response?.data ||
          "Failed to send invite.";
        alert(msg);
      }
    };

    const showInviteTable = Boolean(teamMeta?.id);

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

        <div className="save-button-wrapper" style={{ marginBottom: 16 }}>
          <button className="save-button" onClick={onSave}>Save</button>
        </div>

        {/* People I Can Invite – visible only when you are the Team Admin (teamMeta exists) */}
        {showInviteTable ? (
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
                        onChange={(e) => handleSearchChange("name", e.target.value)}
                        autoFocus
                      />
                    ) : (
                      <span className="header-label">
                        Student Name
                        <img src={searchIcon} alt="Search" className="search-icon" onClick={() => toggleSearch("name")} />
                      </span>
                    )}
                  </th>

                  <th>
                    {activeSearch.studentId ? (
                      <input
                        type="text"
                        placeholder="Search ID"
                        className="column-search"
                        onChange={(e) => handleSearchChange("studentId", e.target.value)}
                        autoFocus
                      />
                    ) : (
                      <span className="header-label">
                        Student ID
                        <img src={searchIcon} alt="Search" className="search-icon" onClick={() => toggleSearch("studentId")} />
                      </span>
                    )}
                  </th>

                  <th>
                    {activeSearch.email ? (
                      <input
                        type="text"
                        placeholder="Search Email"
                        className="column-search"
                        onChange={(e) => handleSearchChange("email", e.target.value)}
                        autoFocus
                      />
                    ) : (
                      <span className="header-label">
                        Email ID
                        <img src={searchIcon} alt="Search" className="search-icon" onClick={() => toggleSearch("email")} />
                      </span>
                    )}
                  </th>

                  <th>
                    {activeSearch.phone ? (
                      <input
                        type="text"
                        placeholder="Search Phone"
                        className="column-search"
                        onChange={(e) => handleSearchChange("phone", e.target.value)}
                        autoFocus
                      />
                    ) : (
                      <span className="header-label">
                        Phone Number
                        <img src={searchIcon} alt="Search" className="search-icon" onClick={() => toggleSearch("phone")} />
                      </span>
                    )}
                  </th>

                  <th></th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center" }}>Loading...</td>
                  </tr>
                ) : serverPeople.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center" }}>No candidates</td>
                  </tr>
                ) : (
                  serverPeople.map((member, index) => {
                    const atCapacity =
                      typeof teamMeta.current_count === "number" &&
                      typeof teamMeta.members_limit === "number" &&
                      teamMeta.current_count >= teamMeta.members_limit;

                    return (
                      <tr key={member.id}>
                        <td>{index + 1}</td>
                        <td>{member.name}</td>
                        <td>{member.id}</td>
                        <td>{member.email}</td>
                        <td>{member.phone_number}</td>
                        <td className="icon-cell">
                          <img
                            src={addIcon}
                            alt="add-friend"
                            className="action-icon"
                            style={{ cursor: atCapacity ? "not-allowed" : "pointer", opacity: atCapacity ? 0.5 : 1 }}
                            onClick={() => !atCapacity && invite(member.id)}
                          />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="table-wrapper" style={{ textAlign: "center", padding: 16 }}>
            <em>Save your team name to invite students.</em>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateTeam;
