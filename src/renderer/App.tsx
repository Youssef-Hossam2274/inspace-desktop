import React from "react";
import Layout from "./components/Layout";
import useGenerateRoutes from "./routes/useGenerateRoutes";
import { ThemeProvider } from "./contexts/ThemeContext";
import { HistoryProvider } from "./contexts/HistoryContext";

const App: React.FC = () => {
  const routes = useGenerateRoutes();

  return (
    <ThemeProvider>
      <HistoryProvider>
        <Layout>{routes}</Layout>
      </HistoryProvider>
    </ThemeProvider>
  );
};

export default App;
