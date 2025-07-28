import { createContext, useContext, useState } from "react";
import axios from "../axios"; // shared axios instance

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  const login = async (email, password) => {
    const response = await axios.post("/login", { email, password });
    const { access_token, user } = response.data;

    // ✅ Check approval before storing anything
    if (!user.is_approved) {
      throw { message: "Your account is still pending admin approval." };
    }

    localStorage.setItem("token", access_token);
    setUser(user);
    return user;
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  const register = async (data) => {
    const response = await axios.post("/register", data);
    // No token is returned since user isn't approved
    return response.data; // e.g., { message: "...", user: {...} }
  };

  const fetchDepartments = async () => {
    const response = await axios.get("/departments");
    return response.data;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        login,
        logout,
        register,
        fetchDepartments,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Hook to use context in components
export const useAuth = () => useContext(AuthContext);




