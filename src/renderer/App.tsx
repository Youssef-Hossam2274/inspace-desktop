import React from "react";
import Layout from "./components/Layout";
import useGenerateRoutes from "./routes/useGenerateRoutes";

const App: React.FC = () => {
  const routes = useGenerateRoutes();

  return <Layout>{routes}</Layout>;
};

export default App;
