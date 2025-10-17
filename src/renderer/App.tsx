import React from "react";
import Layout from "./components/Layout";
import useGenerateRoutes from "./routes/useGenerateRoutes";
import { ThemeProvider } from "./contexts/ThemeContext";

const App: React.FC = () => {
  const routes = useGenerateRoutes();

  return (
    <ThemeProvider>
      <Layout>{routes}</Layout>
    </ThemeProvider>
  );
};

export default App;
