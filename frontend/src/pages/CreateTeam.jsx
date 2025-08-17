// === CreateTeam.jsx ===
import React, { useState, useEffect, useRef } from "react";
import StudentSideBar from "../components/StudentSideBar";
import "./Admin.css";
import addIcon from "../assets/add-friend.png";
import searchIcon from "../assets/search.png";

// REST APIs
import { initCreateTeam, upsertTeam, inviteStudent } from "../axios";

// Fallback only if API fails
const initialMembers = [
  { id: 1, name: "Ali Ahmad", phone: "0598765432", studentId: "S1001", email: "ali@example.com" },
  { id: 2, name: "Layla Khan", phone: "0591234567", studentId: "S1002", email: "layla@example.com" },
  { id: 3, name: "Yousef Omar", phone: "0562233445", studentId: "S1003", email: "yousef@example.com" },
  { id: 4, name: "Fatma Zaid", phone: "0569988776", studentId: "S1004", email: "fatma@example.com" },
  { id: 5, name: "Zaid", phone: "0569988776", studentId: "S1005", email: "zaid@example.com" },
];

const CreateTeam = () => {
  const [searchTerms, setSearchTerms] = useState({
    name: "",
    phone: "",
    studentId: "",
    email: "",
  });

  const [teamName, setTeamName] = useState("");

  // API candidates normalized to current columns
  const [candidates, setCandidates] = useState([]); // [{id,name,phone,studentId,email}]
  const [loading, setLoading] = useState(true);
  const [usedFallback, setUsedFallback] = useState(false); // true فقط عند فشل API

  const [activeSearch, setActiveSearch] = useState({
    name: false,
    phone: false,
    studentId: false,
    email: false,
  });

  const tableRef = useRef(null);

  // Prompt banner
  const [promptMsg, setPromptMsg] = useState("");
  const [showPrompt, setShowPrompt] = useState(false);
  const triggerPrompt = (msg) => {
    setPromptMsg(String(msg || "Cannot send invite right now."));
    setShowPrompt(true);
    setTimeout(() => setShowPrompt(false), 2500);
  };

  // permissions
  const [isAdmin, setIsAdmin] = useState(false);
  const [hasTeam, setHasTeam] = useState(false);

  // init
  useEffect(() => {
    const fetchInit = async () => {
      try {
        const data = await initCreateTeam(); // { team, members, candidates }
        setTeamName(data?.team?.name || "");
        setIsAdmin(Boolean(data?.team?.is_admin));
        setHasTeam(Boolean(data?.team?.id));

        const mapped =
          (data?.candidates || []).map((u) => ({
            id: u.student_id,
            name: u.student_name || "",
            phone: u.phone || "",
            studentId: String(u.student_id || ""),
            email: u.email || "",
          })) || [];

        setCandidates(mapped);
        setUsedFallback(false); // API نجح حتى لو رجّع 0
      } catch (e) {
        // API فشل → استخدم الداتا الافتراضية
        setCandidates(initialMembers);
        setUsedFallback(true);
      } finally {
        setLoading(false);
      }
    };
    fetchInit();
  }, []);

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

  const toggleSearch = (field) => {
    setActiveSearch((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const handleSearchChange = (field, value) => {
    setSearchTerms((prev) => ({
      ...prev,
      [field]: String(value || "").toLowerCase(),
    }));
  };

  // Save (create or rename)
  const handleSave = async () => {
    if (!teamName.trim()) {
      triggerPrompt("Team name is required.");
      return;
    }

    // If user already has a team but is not the admin → block rename
    if (hasTeam && !isAdmin) {
      triggerPrompt("You can't change team's name or invite others. You are not the team admin");
      return;
    }

    try {
      await upsertTeam(teamName.trim());
      // Refresh
      const data = await initCreateTeam();
      const mapped =
        (data?.candidates || []).map((u) => ({
          id: u.student_id,
          name: u.student_name || "",
          phone: u.phone || "",
          studentId: String(u.student_id || ""),
          email: u.email || "",
        })) || [];

      setTeamName(data?.team?.name || teamName.trim());
      setIsAdmin(Boolean(data?.team?.is_admin));
      setHasTeam(Boolean(data?.team?.id));
      setCandidates(mapped);
      setUsedFallback(false);
    } catch (e) {
      const msg = e?.response?.data?.message;
      if (msg) triggerPrompt(msg);
    }
  };

  // Invite candidate
  const onInvite = async (studentId) => {
    if (!isAdmin) {
      triggerPrompt("You can't change team's name or invite others. You are not the team admin");
      return;
    }

    const before = [...candidates];
    setCandidates((prev) => prev.filter((c) => String(c.id) !== String(studentId)));
    try {
      await inviteStudent(studentId);
    } catch (e) {
      const msg = e?.response?.data?.message || "Could not send invite.";
      triggerPrompt(msg);
      setCandidates(before);
      try {
        const data = await initCreateTeam();
        const mapped =
          (data?.candidates || []).map((u) => ({
            id: u.student_id,
            name: u.student_name || "",
            phone: u.phone || "",
            studentId: String(u.student_id || ""),
            email: u.email || "",
          })) || [];
        setCandidates(mapped);
        setUsedFallback(false);
      } catch {
        setCandidates(initialMembers);
        setUsedFallback(true);
      }
    }
  };

  // لو فشل الـ API نعرض initialMembers، غير هيك نعرض candidates (قد تكون فاضية)
  const rows = usedFallback ? initialMembers : candidates;

  const filteredMembers = rows.filter((member) =>
    (member.name || "").toLowerCase().includes(searchTerms.name) &&
    (member.phone || "").toLowerCase().includes(searchTerms.phone) &&
    (member.studentId || "").toLowerCase().includes(searchTerms.studentId) &&
    (member.email || "").toLowerCase().includes(searchTerms.email)
  );

  return (
    <div className="admin-dashboard">
      <StudentSideBar />

      <div className="dashboard-content">
        <h2 className="dashboard-header">Create/Edit Team</h2>

        {showPrompt && (
          <div
            style={{
              marginBottom: "12px",
              padding: "10px 14px",
              borderRadius: "6px",
              backgroundColor: "#fff4e5",
              border: "1px solid #ffc107",
              color: "#8a6d3b",
              fontSize: "14px",
            }}
          >
            {promptMsg}
          </div>
        )}

        <div className="form-group">
          <input
            type="text"
            className="team-name-input"
            placeholder="Enter Team Name"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            // disable only when the user ALREADY has a team AND is not the admin
            disabled={hasTeam && !isAdmin}
            title={hasTeam && !isAdmin ? "You can't change team's name or invite others. You are not the team admin" : ""}
            style={hasTeam && !isAdmin ? { opacity: 0.7, cursor: "not-allowed" } : {}}
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
                      onChange={(e) => handleSearchChange("name", e.target.value)}
                      autoFocus
                    />
                  ) : (
                    <span className="header-label">
                      Student Name
                      <img
                        src={searchIcon}
                        alt="Search"
                        className="search-icon"
                        onClick={() => toggleSearch("name")}
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
                      onChange={(e) => handleSearchChange("phone", e.target.value)}
                      autoFocus
                    />
                  ) : (
                    <span className="header-label">
                      Phone Number
                      <img
                        src={searchIcon}
                        alt="Search"
                        className="search-icon"
                        onClick={() => toggleSearch("phone")}
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
                      onChange={(e) => handleSearchChange("studentId", e.target.value)}
                      autoFocus
                    />
                  ) : (
                    <span className="header-label">
                      Student ID
                      <img
                        src={searchIcon}
                        alt="Search"
                        className="search-icon"
                        onClick={() => toggleSearch("studentId")}
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
                      onChange={(e) => handleSearchChange("email", e.target.value)}
                      autoFocus
                    />
                  ) : (
                    <span className="header-label">
                      Email ID
                      <img
                        src={searchIcon}
                        alt="Search"
                        className="search-icon"
                        onClick={() => toggleSearch("email")}
                      />
                    </span>
                  )}
                </th>

                <th></th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center" }}>
                    Loading...
                  </td>
                </tr>
              ) : !usedFallback && filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: "20px" }}>
                    There are no students to form a group.
                  </td>
                </tr>
              ) : (
                filteredMembers.map((member, index) => (
                  <tr key={member.id ?? member.studentId}>
                    <td>{index + 1}</td>
                    <td>{member.name}</td>
                    <td>{member.phone}</td>
                    <td>{member.studentId}</td>
                    <td>{member.email}</td>
                    <td className="icon-cell">
                      <button
                        type="button"
                        className="invite-btn"
                        onClick={(e) => {
                          e.stopPropagation(); // prevent row/table handlers from swallowing the click
                          onInvite(member.id ?? member.studentId);
                        }}
                        aria-disabled={!isAdmin}
                        data-disabled={!isAdmin}
                        title={
                          !isAdmin
                            ? "You can't change team's name or invite others. You are not the team admin"
                            : "Invite"
                        }
                      >
                        <img src={addIcon} alt="Invite" className="action-icon" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="save-button-wrapper">
          <button
            className="save-button"
            onClick={handleSave}
            disabled={hasTeam && !isAdmin}
            title={hasTeam && !isAdmin ? "You can't change team's name or invite others. You are not the team admin" : ""}
            style={hasTeam && !isAdmin ? { opacity: 0.7, cursor: "not-allowed" } : {}}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateTeam;