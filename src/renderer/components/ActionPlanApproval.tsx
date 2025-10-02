import React from "react";
import {
  Play,
  X,
  RefreshCw,
  Check,
  Mouse,
  Type,
  Command,
  Clock,
  Copy,
  Clipboard,
} from "lucide-react";

interface ActionStep {
  step_id: number;
  action_type: string;
  description: string;
  target?: {
    elementId?: string;
    content?: string;
    type?: string;
  };
  parameters?: any;
}

interface ActionPlan {
  actions: ActionStep[];
  next_action: string;
  batch_verification?: {
    success_criteria: Array<{
      type: string;
      content: string;
    }>;
  };
}

interface ActionPlanApprovalProps {
  actionPlan: ActionPlan;
  iteration: number;
  onApprove: () => void;
  onRetry: () => void;
  onAbort: () => void;
}

const ActionPlanApproval: React.FC<ActionPlanApprovalProps> = ({
  actionPlan,
  iteration,
  onApprove,
  onRetry,
  onAbort,
}) => {
  const getActionIcon = (actionType: string) => {
    const iconProps = { size: 14, strokeWidth: 2 };
    const icons: Record<string, React.ReactNode> = {
      click: <Mouse {...iconProps} />,
      double_click: <Mouse {...iconProps} />,
      type: <Type {...iconProps} />,
      key_press: <Command {...iconProps} />,
      scroll: <Mouse {...iconProps} />,
      hover: <Mouse {...iconProps} />,
      wait: <Clock {...iconProps} />,
      copy: <Copy {...iconProps} />,
      paste: <Clipboard {...iconProps} />,
    };
    return icons[actionType] || <Play {...iconProps} />;
  };

  return (
    <div className="action-plan-approval">
      <style>{`
        .action-plan-approval {
          background: #1a1a1a;
          border: 1px solid #2a2a2a;
          border-radius: 8px;
          padding: 16px;
          margin: 12px 0;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }

        .approval-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 12px;
          padding-bottom: 12px;
          border-bottom: 1px solid #2a2a2a;
        }
                .abort-button {
          background: #2a2a2a;
          color: #ef4444;
          border: 1px solid #3a3a3a;
        }

        .abort-button:hover {
          background: #ef4444;
          color: white;
          border-color: #dc2626;
        }

        .approval-badge {
          background: #2a2a2a;
          padding: 3px 8px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 500;
          color: #888;
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }

        .approval-title {
          font-size: 14px;
          font-weight: 600;
          margin: 0;
          flex: 1;
          color: #e0e0e0;
        }

        .actions-list {
          margin-bottom: 12px;
          max-height: 280px;
          overflow-y: auto;
        }

        .actions-list::-webkit-scrollbar {
          width: 6px;
        }

        .actions-list::-webkit-scrollbar-track {
          background: #1a1a1a;
        }

        .actions-list::-webkit-scrollbar-thumb {
          background: #3a3a3a;
          border-radius: 3px;
        }

        .action-item {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 8px 10px;
          background: #222;
          border-radius: 6px;
          margin-bottom: 6px;
          transition: background 0.15s ease;
        }

        .action-item:hover {
          background: #282828;
        }

        .action-item:last-child {
          margin-bottom: 0;
        }

        .action-icon {
          color: #6b7280;
          flex-shrink: 0;
          margin-top: 2px;
        }

        .action-content {
          flex: 1;
          min-width: 0;
        }

        .action-type {
          font-size: 11px;
          font-weight: 500;
          text-transform: uppercase;
          color: #6b7280;
          margin-bottom: 3px;
          letter-spacing: 0.3px;
        }

        .action-description {
          font-size: 13px;
          line-height: 1.4;
          margin-bottom: 4px;
          color: #d1d5db;
        }

        .action-details {
          font-size: 11px;
          color: #6b7280;
          font-family: 'SF Mono', Monaco, monospace;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .verification-section {
          background: #222;
          border-radius: 6px;
          padding: 10px;
          margin-bottom: 12px;
          border-left: 2px solid #4b5563;
        }

        .verification-title {
          font-size: 11px;
          font-weight: 600;
          margin-bottom: 8px;
          color: #9ca3af;
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }

        .verification-item {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          padding: 4px 0;
          font-size: 12px;
          color: #9ca3af;
          line-height: 1.4;
        }

        .verification-item span:first-child {
          color: #6b7280;
          margin-top: 2px;
        }

        .approval-actions {
          display: flex;
          gap: 8px;
          justify-content: flex-end;
        }

        .approval-button {
          padding: 7px 14px;
          border: none;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s ease;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .retry-button {
          background: #2a2a2a;
          color: #d1d5db;
          border: 1px solid #3a3a3a;
        }

        .retry-button:hover {
          background: #333;
          border-color: #444;
        }

        .approve-button {
          background: #3b82f6;
          color: white;
          border: 1px solid #2563eb;
        }

        .approve-button:hover {
          background: #2563eb;
        }

        .approval-button:active {
          transform: scale(0.98);
        }
      `}</style>

      <div className="approval-header">
        <span className="approval-badge">Iteration {iteration}</span>
        <h3 className="approval-title">Action Plan Ready</h3>
      </div>

      <div className="actions-list">
        {actionPlan.actions.map((action) => (
          <div key={action.step_id} className="action-item">
            <span className="action-icon">
              {getActionIcon(action.action_type)}
            </span>
            <div className="action-content">
              <div className="action-type">
                {action.action_type.replace("_", " ")}
              </div>
              <div className="action-description">{action.description}</div>
              {(action.target?.content || action.parameters?.text) && (
                <div className="action-details">
                  {action.target?.content &&
                    `Target: ${action.target.content.substring(0, 50)}...`}
                  {action.parameters?.text &&
                    `Text: "${action.parameters.text}"`}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {actionPlan.batch_verification?.success_criteria &&
        actionPlan.batch_verification.success_criteria.length > 0 && (
          <div className="verification-section">
            <div className="verification-title">Success Criteria</div>
            {actionPlan.batch_verification.success_criteria.map(
              (criterion, idx) => (
                <div key={idx} className="verification-item">
                  <span>•</span>
                  <span>
                    {criterion.type}: `&quot;`criterion.content`&quot;`
                  </span>
                </div>
              )
            )}
          </div>
        )}

      <div className="approval-actions">
        <button className="approval-button abort-button" onClick={onAbort}>
          <X size={14} />
          <span>Abort</span>
        </button>
        <div style={{ display: "flex", gap: "8px" }}>
          <button className="approval-button retry-button" onClick={onRetry}>
            <RefreshCw size={14} />
            <span>Regenerate</span>
          </button>
          <button
            className="approval-button approve-button"
            onClick={onApprove}
          >
            <Check size={14} />
            <span>Execute</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ActionPlanApproval;
