import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

const instance = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Attach token if available
instance.interceptors.request.use(config => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Fetch departments
export const fetchDepartments = async () => {
  const response = await instance.get("/departments");
  return response.data;
};

// Send OTP
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

export const resetPassword = async (email, password, confirmPassword) => {
  try {
    const response = await instance.post("/reset-password", {
      email,
      password,
      password_confirmation: confirmPassword
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Something went wrong." };
  }
};

// Fetch pending users requests
export const fetchPendingUsers = async () => {
  const response = await instance.get("/admin/pending-users");
  return response.data;
};

// Approve user by ID
export const approveUser = async (id) => {
  const response = await instance.post(`/admin/approve-user/${id}`);
  return response.data;
};

// Reject user by ID
export const rejectUser = async (id) => {
  const response = await instance.delete(`/admin/reject-user/${id}`);
  return response.data;
};


export default instance;



