import { createBrowserRouter, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Pages
import Landing from "../pages/Landing";
import SignIn from "../pages/SignIn";
import SignUp from "../pages/SignUp";
import ForgotPassword from "../pages/ForgotPassword";
import OTP from "../pages/OTP";
import ResetPassword from "../pages/ResetPassword";

// Dashboards
import StudentDashboard from "../pages/StudentDashboard";
import SupervisorDashboard from "../pages/SupervisorDashboard";
import AdminDashboard from "../pages/AdminDashboard";

// Admin subpages
import AllAdmins from "../pages/AllAdmins";
import AllSupervisors from "../pages/AllSupervisors";
import AllStudents from "../pages/AllStudents";
import MyProfile from "../pages/MyProfile";

// ✅ Protected Reset Route
function ProtectedResetRoute({ children }) {
  const email = localStorage.getItem("resetEmail");
  if (!email) return <Navigate to="/forgotpassword" replace />;
  return children;
}

// ✅ Role-Based Protected Route with Approval Check
function ProtectedRoute({ children, allowedRoles }) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/signin" />;
  }

  if (!user.is_approved) {
    return <Navigate to="/" />; // Or a "Pending Approval" screen
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/" />;
  }

  return children;
}

const router = createBrowserRouter([
  { path: "/", element: <Landing /> },
  { path: "/signin", element: <SignIn /> },
  { path: "/signup", element: <SignUp /> },
  { path: "/forgotpassword", element: <ForgotPassword /> },

  {
    path: "/otp",
    element: (
      <ProtectedResetRoute>
        <OTP />
      </ProtectedResetRoute>
    ),
  },
  {
    path: "/resetpassword",
    element: (
      <ProtectedResetRoute>
        <ResetPassword />
      </ProtectedResetRoute>
    ),
  },

  // ✅ Student Dashboard
  {
    path: "/student-dashboard",
    element: (
      <ProtectedRoute allowedRoles={["student"]}>
        <StudentDashboard />
      </ProtectedRoute>
    ),
  },

  // ✅ Supervisor Dashboard
  {
    path: "/supervisor-dashboard",
    element: (
      <ProtectedRoute allowedRoles={["supervisor"]}>
        <SupervisorDashboard />
      </ProtectedRoute>
    ),
  },

  // ✅ Admin Dashboard
  {
    path: "/admin-dashboard",
    element: (
      <ProtectedRoute allowedRoles={["admin"]}>
        <AdminDashboard />
      </ProtectedRoute>
    ),
  },

  // ✅ Admin Subpage - All Admins
  {
    path: "/admin/admins",
    element: (
      <ProtectedRoute allowedRoles={["admin"]}>
        <AllAdmins />
      </ProtectedRoute>
    ),
  },

  // ✅ Admin Subpage - Allrequest
  {
    path: "/admin/request",
    element: (
      <ProtectedRoute allowedRoles={["admin"]}>
        <AdminDashboard/>
      </ProtectedRoute>
    ),
  },

  // ✅ Admin Subpage - All supevisors
  {
    path: "/admin/supervisors",
    element: (
      <ProtectedRoute allowedRoles={["admin"]}>
        <AllSupervisors />
      </ProtectedRoute>
    ),
  },

  // ✅ Admin Subpage - All students
  {
    path: "/admin/students",
    element: (
      <ProtectedRoute allowedRoles={["admin"]}>
        <AllStudents/>
      </ProtectedRoute>
    ),
  },

  // ✅ Admin Subpage - My Profile
  {
    path: "/admin/myprofile",
    element: (
      <ProtectedRoute allowedRoles={["admin"]}>
        <MyProfile/>
      </ProtectedRoute>
    ),
  },
]);

export default router;




