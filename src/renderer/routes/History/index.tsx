// routes/History/index.tsx
import { FC } from "react";
import HistoryPanel from "../../components/HistoryPanel";
import styles from "./styles.module.scss";

const History: FC = () => {
  return (
    <div className={styles.historyContainer}>
      <HistoryPanel />
    </div>
  );
};

export default History;

// routes/History/styles.module.scss
// .historyContainer {
//   height: 100vh;
//   display: flex;
//   flex-direction: column;
//   background: var(--bg-primary);
// }
