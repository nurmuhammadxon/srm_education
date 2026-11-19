import { createBrowserRouter } from "react-router-dom";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import AppLayout from "@/components/AppLayout";
import LoginPage from "@/features/auth/LoginPage";
import StudentsPage from "@/features/students/StudentsPage";
import GroupsPage from "@/features/groups/GroupsPage";
import GroupDetailPage from "@/features/groups/GroupDetailPage";

const Placeholder = ({ title }: { title: string }) => (
  <h1 className="text-2xl font-semibold">{title}</h1>
);

export const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: "/", element: <Placeholder title="Bosh sahifa" /> },
          { path: "/students", element: <StudentsPage /> },
          { path: "/groups", element: <GroupsPage /> },
          { path: "/groups/:id", element: <GroupDetailPage /> },
          { path: "/leads", element: <Placeholder title="Lidlar" /> },
          { path: "/exams", element: <Placeholder title="Imtihonlar" /> },
          {
            element: <ProtectedRoute roles={["ceo"]} />,
            children: [
              { path: "/finance", element: <Placeholder title="Moliya" /> },
              {
                path: "/settings",
                element: <Placeholder title="Sozlamalar" />,
              },
            ],
          },
        ],
      },
    ],
  },
]);
