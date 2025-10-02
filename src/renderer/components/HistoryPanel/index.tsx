import React, { useState } from "react";
import { useHistory, HistoryItem } from "../../contexts/HistoryContext";
import {
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Trash2,
  Search,
} from "lucide-react";

const HistoryPanel: React.FC = () => {
  const { history, clearHistory, deleteHistoryItem } = useHistory();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<
    "all" | "success" | "failed" | "aborted"
  >("all");

  const filteredHistory = history.filter((item) => {
    const matchesSearch = item.prompt
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesFilter =
      filterStatus === "all" || item.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle size={16} className="status-icon success" />;
      case "failed":
        return <XCircle size={16} className="status-icon error" />;
      case "aborted":
        return <AlertCircle size={16} className="status-icon warning" />;
      default:
        return <Clock size={16} className="status-icon" />;
    }
  };

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="history-panel">
      <style>{`
        .history-panel {
          display: flex;
          flex-direction: column;
          height: 100%;
          background: var(--bg-secondary);
          color: var(--text-primary);
        }

        .history-header {
          padding: 16px;
          border-bottom: 1px solid var(--border-primary);
        }

        .history-title {
          font-size: 18px;
          font-weight: 600;
          margin: 0 0 16px 0;
          color: var(--text-primary);
        }

        .history-controls {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .search-box {
          position: relative;
        }

        .search-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-tertiary);
        }

        .search-input {
          width: 100%;
          padding: 8px 12px 8px 36px;
          background: var(--bg-tertiary);
          border: 1px solid var(--border-primary);
          border-radius: 8px;
          color: var(--text-primary);
          font-size: 14px;
          outline: none;
          transition: all 0.2s;
        }

        .search-input:focus {
          border-color: var(--primary-color);
          background: var(--bg-primary);
        }

        .filter-buttons {
          display: flex;
          gap: 8px;
        }

        .filter-button {
          flex: 1;
          padding: 6px 12px;
          background: var(--bg-tertiary);
          border: 1px solid var(--border-primary);
          border-radius: 6px;
          color: var(--text-secondary);
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .filter-button:hover {
          background: var(--hover-overlay);
          border-color: var(--border-secondary);
        }

        .filter-button.active {
          background: var(--primary-color);
          color: white;
          border-color: var(--primary-color);
        }

        .history-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 8px;
        }

        .history-count {
          font-size: 12px;
          color: var(--text-tertiary);
        }

        .clear-button {
          padding: 4px 10px;
          background: transparent;
          border: 1px solid var(--border-primary);
          border-radius: 6px;
          color: var(--error-color);
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .clear-button:hover {
          background: rgba(239, 68, 68, 0.1);
          border-color: var(--error-color);
        }

        .history-list {
          flex: 1;
          overflow-y: auto;
          padding: 12px;
        }

        .history-item {
          background: var(--bg-tertiary);
          border: 1px solid var(--border-primary);
          border-radius: 8px;
          padding: 12px;
          margin-bottom: 8px;
          transition: all 0.2s;
          cursor: pointer;
        }

        .history-item:hover {
          background: var(--bg-quaternary);
          border-color: var(--border-secondary);
          transform: translateX(2px);
        }

        .history-item-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 8px;
        }

        .history-item-status {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          font-weight: 500;
        }

        .status-icon {
          flex-shrink: 0;
        }

        .status-icon.success {
          color: var(--success-color);
        }

        .status-icon.error {
          color: var(--error-color);
        }

        .status-icon.warning {
          color: var(--warning-color);
        }

        .history-item-time {
          font-size: 11px;
          color: var(--text-tertiary);
        }

        .history-item-prompt {
          font-size: 13px;
          color: var(--text-primary);
          margin-bottom: 6px;
          line-height: 1.4;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .history-item-result {
          font-size: 12px;
          color: var(--text-secondary);
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .history-item-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 8px;
          padding-top: 8px;
          border-top: 1px solid var(--border-primary);
        }

        .history-item-iteration {
          font-size: 11px;
          color: var(--text-tertiary);
        }

        .delete-button {
          padding: 4px 8px;
          background: transparent;
          border: none;
          color: var(--text-tertiary);
          cursor: pointer;
          border-radius: 4px;
          transition: all 0.2s;
          display: flex;
          align-items: center;
        }

        .delete-button:hover {
          background: rgba(239, 68, 68, 0.1);
          color: var(--error-color);
        }

        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          padding: 40px 20px;
          text-align: center;
          color: var(--text-tertiary);
        }

        .empty-state-icon {
          margin-bottom: 16px;
          opacity: 0.5;
        }

        .empty-state-text {
          font-size: 14px;
        }
      `}</style>

      <div className="history-header">
        <h2 className="history-title">Execution History</h2>

        <div className="history-controls">
          <div className="search-box">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="Search prompts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="filter-buttons">
            <button
              className={`filter-button ${filterStatus === "all" ? "active" : ""}`}
              onClick={() => setFilterStatus("all")}
            >
              All
            </button>
            <button
              className={`filter-button ${filterStatus === "success" ? "active" : ""}`}
              onClick={() => setFilterStatus("success")}
            >
              Success
            </button>
            <button
              className={`filter-button ${filterStatus === "failed" ? "active" : ""}`}
              onClick={() => setFilterStatus("failed")}
            >
              Failed
            </button>
            <button
              className={`filter-button ${filterStatus === "aborted" ? "active" : ""}`}
              onClick={() => setFilterStatus("aborted")}
            >
              Aborted
            </button>
          </div>

          <div className="history-actions">
            <span className="history-count">
              {filteredHistory.length}{" "}
              {filteredHistory.length === 1 ? "item" : "items"}
            </span>
            {history.length > 0 && (
              <button className="clear-button" onClick={clearHistory}>
                <Trash2 size={12} />
                Clear All
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="history-list">
        {filteredHistory.length === 0 ? (
          <div className="empty-state">
            <Clock size={48} className="empty-state-icon" />
            <p className="empty-state-text">
              {searchTerm || filterStatus !== "all"
                ? "No matching results"
                : "No execution history yet"}
            </p>
          </div>
        ) : (
          filteredHistory.map((item) => (
            <div key={item.id} className="history-item">
              <div className="history-item-header">
                <div className="history-item-status">
                  {getStatusIcon(item.status)}
                  <span>{item.status}</span>
                </div>
                <span className="history-item-time">
                  {formatTimestamp(item.timestamp)}
                </span>
              </div>

              <div className="history-item-prompt">{item.prompt}</div>

              {item.result && (
                <div className="history-item-result">{item.result}</div>
              )}

              {item.error && (
                <div
                  className="history-item-result"
                  style={{ color: "var(--error-color)" }}
                >
                  {item.error}
                </div>
              )}

              <div className="history-item-footer">
                {item.iteration && (
                  <span className="history-item-iteration">
                    Iteration {item.iteration}
                  </span>
                )}
                <button
                  className="delete-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteHistoryItem(item.id);
                  }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default HistoryPanel;
