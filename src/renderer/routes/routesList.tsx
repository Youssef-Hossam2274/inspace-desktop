import { RouteObject } from "react-router-dom";
import NewChat from "../components/Pages/NewChat";

const routesList: Record<string, RouteObject[]> = {
  // Auth screens
  auth: [],
  // Common screens for all user types (Admin,type2)
  common: [{ path: "/", element: <NewChat /> }],
};

export default routesList;
