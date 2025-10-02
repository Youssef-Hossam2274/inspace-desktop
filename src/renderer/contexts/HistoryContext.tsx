import React, { createContext, useContext, useState, useEffect } from "react";

export interface HistoryItem {
  id: string;
  prompt: string;
  timestamp: Date;
  status: "success" | "failed" | "aborted";
  result?: string;
  error?: string;
  iteration?: number;
}

interface HistoryContextType {
  history: HistoryItem[];
  addHistoryItem: (item: Omit<HistoryItem, "id" | "timestamp">) => void;
  clearHistory: () => void;
  deleteHistoryItem: (id: string) => void;
}

const HistoryContext = createContext<HistoryContextType | undefined>(undefined);

export const useHistory = () => {
  const context = useContext(HistoryContext);
  if (!context) {
    throw new Error("useHistory must be used within a HistoryProvider");
  }
  return context;
};

export const HistoryProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    // Load history from localStorage
    const saved = window.localStorage.getItem("execution-history");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Convert timestamp strings back to Date objects
        return parsed.map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp),
        }));
      } catch (error) {
        console.error("Failed to parse history:", error);
        return [];
      }
    }
    return [];
  });

  useEffect(() => {
    // Save history to localStorage whenever it changes
    window.localStorage.setItem("execution-history", JSON.stringify(history));
  }, [history]);

  const addHistoryItem = (item: Omit<HistoryItem, "id" | "timestamp">) => {
    const newItem: HistoryItem = {
      ...item,
      id: Date.now().toString(),
      timestamp: new Date(),
    };

    setHistory((prev) => [newItem, ...prev].slice(0, 50)); // Keep last 50 items
  };

  const clearHistory = () => {
    setHistory([]);
    window.localStorage.removeItem("execution-history");
  };

  const deleteHistoryItem = (id: string) => {
    setHistory((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <HistoryContext.Provider
      value={{ history, addHistoryItem, clearHistory, deleteHistoryItem }}
    >
      {children}
    </HistoryContext.Provider>
  );
};
