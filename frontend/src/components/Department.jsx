import React, { useEffect, useState } from "react";
import { fetchDepartments } from "../axios";

function Department({ value, onChange }) {
  const [departments, setDepartments] = useState([]);

  useEffect(() => {
    const loadDepartments = async () => {
      try {
        const data = await fetchDepartments();
        setDepartments(data);
      } catch (error) {
        console.error("Failed to fetch departments", error);
      }
    };

    loadDepartments();
  }, []);

  return (
    <select name="department" value={value} onChange={onChange} required>
      <option value="">Select Department</option>
      {departments.map((dept) => (
        <option key={dept.id} value={dept.id}>
          {dept.name}
        </option>
      ))}
    </select>
  );
}

export default Department;

