// src/axios.js
import axios from "axios";

/**
 * Using Vite proxy:
 *  - In vite.config.js, make sure you have:
 *      server: { proxy: { '/api': 'http://127.0.0.1:8000' } }
 *  - Then all API calls go to the same origin via "/api" and cookies work reliably.
 */
const instance = axios.create({
  baseURL: "/api",          
  withCredentials: true,    
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Departments
export const fetchDepartments = async () => {
  const response = await instance.get("/departments");
  return response.data;
};

// Forgot password (send OTP)
export const sendOTP = async (email) => {
  try {
    const response = await instance.post("/forgot-password", { email });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Something went wrong." };
  }
};

// Verify OTP
export const verifyOTP = async (email, otp) => {
  try {
    const response = await instance.post("/verify-otp", { email, otp });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Something went wrong." };
  }
};

// Reset password
export const resetPassword = async (email, password, confirmPassword) => {
  try {
    const response = await instance.post("/reset-password", {
      email,
      password,
      password_confirmation: confirmPassword,
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Something went wrong." };
  }
};

// Admin APIs (authenticated via cookie)
export const fetchPendingUsers = async () => {
  const response = await instance.get("/admin/pending-users");
  return response.data;
};

export const fetchApprovedAdmins = async () => {
  const res = await axios.get("/admin/admins"); // baseURL is /api
  return res.data; // [{ adminId, name, department, role }]
};

export const fetchApprovedSupervisors = async () => {
  const res = await instance.get("/admin/supervisors");
  return res.data; // [{ supervisorId, name, degree, department, role, projects }]
};


export const approvePendingUser = async (userId) => {
  const res = await instance.post(`/admin/users/${userId}/approve`);
  return res.data;
};

export const rejectPendingUser = async (userId) => {
  const res = await instance.post(`/admin/users/${userId}/reject`);
  return res.data;
};

export default instance;
