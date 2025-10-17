import { RouteObject } from "react-router-dom";
import NewChat from "../components/Pages/NewChat";
import TestingPage from "../components/Pages/Testing";
import { History } from "lucide-react";

const routesList: Record<string, RouteObject[]> = {
  // Auth screens
  auth: [],
  // Common screens for all user types (Admin,type2)
  common: [
    { path: "/", element: <NewChat /> },
    { path: "testing", element: <TestingPage /> },
  ],
};

export default routesList;
