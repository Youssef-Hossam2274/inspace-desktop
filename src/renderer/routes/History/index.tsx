import { FC } from "react";
import HistoryPanel from "../../components/HistoryPanel";

const History: FC = () => {
  return (
    <div className="h-screen flex flex-col bg-bg-dark-primary dark:bg-bg-dark-primary">
      <HistoryPanel />
    </div>
  );
};

export default History;
