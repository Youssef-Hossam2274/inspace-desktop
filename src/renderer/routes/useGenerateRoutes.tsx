import { useRoutes } from "react-router-dom";
import routesList from "./routesList";

export default function useGenerateRoutes() {

  const activeRoutes = routesList['common']; // This can be dynamic based on user role or other criteria


  const routes = useRoutes(activeRoutes);


  return routes;
}
