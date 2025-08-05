// src/router/index.jsx
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

// Supervisor subpages
import MyProjectsSupervisor from "../pages/MyProjectsSupervisor";
import MyProfileSupervisor from "../pages/MyProfileSupervisor";
import AddProject from "../pages/AddProject";
import ProjectDetails from "../pages/ProjectDetails";
import TaskDetails from "../pages/TaskDetails";

// Student subpages
import CreateTeam from "../pages/CreateTeam";
import MyProjectsStudent from "../pages/MyProjectsStudent";
import MyApplicationsStudent from "../pages/MyApplicationsStudent";
import StudentProjectDetails from "../pages/StudentProjectDetails";
import MyProfileStudent from "../pages/MyProfileStudent";

// ✅ Protected Reset Route
function ProtectedResetRoute({ children }) {
  const email = localStorage.getItem("resetEmail");
  if (!email) return <Navigate to="/forgotpassword" replace />;
  return children;
}

// ✅ Role-Based Protected Route with Hydration Awareness
function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();

  // Wait for /me hydration to finish to avoid flicker / false redirects
  if (loading) return null; // or a loading spinner component

  if (!user) {
    return <Navigate to="/signin" replace />;
  }

  if (!user.is_approved) {
    return <Navigate to="/" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
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

  // ✅ Student
  {
    path: "/student-dashboard",
    element: (
      <ProtectedRoute allowedRoles={["student"]}>
        <StudentDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: "/student/createteam",
    element: (
      <ProtectedRoute allowedRoles={["student"]}>
        <CreateTeam />
      </ProtectedRoute>
    ),
  },
  {
    path: "/student/myprofile",
    element: (
      <ProtectedRoute allowedRoles={["student"]}>
        <MyProfileStudent />
      </ProtectedRoute>
    ),
  },
  {
    path: "/student/myprojectsstudent",
    element: (
      <ProtectedRoute allowedRoles={["student"]}>
        <MyProjectsStudent />
      </ProtectedRoute>
    ),
  },
  {
    path: "/student/myApplications",
    element: (
      <ProtectedRoute allowedRoles={["student"]}>
        <MyApplicationsStudent />
      </ProtectedRoute>
    ),
  },
  {
    path: "/student/projectdetails/:id",
    element: (
      <ProtectedRoute allowedRoles={["student"]}>
        <StudentProjectDetails />
      </ProtectedRoute>
    ),
  },

  // ✅ Supervisor
  {
    path: "/supervisor-dashboard",
    element: (
      <ProtectedRoute allowedRoles={["supervisor"]}>
        <SupervisorDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: "/supervisor/addproject",
    element: (
      <ProtectedRoute allowedRoles={["supervisor"]}>
        <AddProject />
      </ProtectedRoute>
    ),
  },
  {
    path: "/supervisor/editproject/:id",
    element: (
      <ProtectedRoute allowedRoles={["supervisor"]}>
        <AddProject />
      </ProtectedRoute>
    ),
  },
  {
    path: "/supervisor/projectdetails/:id",
    element: (
      <ProtectedRoute allowedRoles={["supervisor"]}>
        <ProjectDetails />
      </ProtectedRoute>
    ),
  },
  {
    path: "/supervisor/TaskDetails/:id",
    element: (
      <ProtectedRoute allowedRoles={["supervisor"]}>
        <TaskDetails />
      </ProtectedRoute>
    ),
  },
  {
    path: "/supervisor/myprojects",
    element: (
      <ProtectedRoute allowedRoles={["supervisor"]}>
        <MyProjectsSupervisor />
      </ProtectedRoute>
    ),
  },
  {
    path: "/supervisor/myprofile",
    element: (
      <ProtectedRoute allowedRoles={["supervisor"]}>
        <MyProfileSupervisor />
      </ProtectedRoute>
    ),
  },

  // ✅ Admin
  {
    path: "/admin-dashboard",
    element: (
      <ProtectedRoute allowedRoles={["admin"]}>
        <AdminDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: "/admin/admins",
    element: (
      <ProtectedRoute allowedRoles={["admin"]}>
        <AllAdmins />
      </ProtectedRoute>
    ),
  },
  {
    path: "/admin/request",
    element: (
      <ProtectedRoute allowedRoles={["admin"]}>
        <AdminDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: "/admin/supervisors",
    element: (
      <ProtectedRoute allowedRoles={["admin"]}>
        <AllSupervisors />
      </ProtectedRoute>
    ),
  },
  {
    path: "/admin/students",
    element: (
      <ProtectedRoute allowedRoles={["admin"]}>
        <AllStudents />
      </ProtectedRoute>
    ),
  },
  {
    path: "/admin/myprofile",
    element: (
      <ProtectedRoute allowedRoles={["admin"]}>
        <MyProfile />
      </ProtectedRoute>
    ),
  },
]);

export default router;
