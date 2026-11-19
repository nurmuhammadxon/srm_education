import { createBrowserRouter } from "react-router-dom";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import AppLayout from "@/components/AppLayout";
import LoginPage from "@/features/auth/LoginPage";
import DashboardPage from "@/features/dashboard/DashboardPage";
import StudentsPage from "@/features/students/StudentsPage";
import GroupsPage from "@/features/groups/GroupsPage";
import GroupDetailPage from "@/features/groups/GroupDetailPage";
import LeadsPage from "@/features/leads/LeadsPage";
import PaymentsPage from "@/features/payments/PaymentsPage";
import ExamsPage from "@/features/exams/ExamsPage";
import ExamDetailPage from "@/features/exams/ExamDetailPage";
import FinancePage from "@/features/finance/FinancePage";
import SettingsPage from "@/features/settings/SettingsPage";

export const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: "/", element: <DashboardPage /> },
          { path: "/students", element: <StudentsPage /> },
          { path: "/groups", element: <GroupsPage /> },
          { path: "/groups/:id", element: <GroupDetailPage /> },
          { path: "/exams", element: <ExamsPage /> },
          { path: "/exams/:id", element: <ExamDetailPage /> },
          {
            element: <ProtectedRoute roles={["ceo", "admin"]} />,
            children: [
              { path: "/leads", element: <LeadsPage /> },
              { path: "/payments", element: <PaymentsPage /> },
            ],
          },
          {
            element: <ProtectedRoute roles={["ceo"]} />,
            children: [
              { path: "/finance", element: <FinancePage /> },
              { path: "/settings", element: <SettingsPage /> },
            ],
          },
        ],
      },
    ],
  },
]);