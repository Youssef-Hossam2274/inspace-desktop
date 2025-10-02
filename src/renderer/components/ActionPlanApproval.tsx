import React from "react";

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
}

const ActionPlanApproval: React.FC<ActionPlanApprovalProps> = ({
  actionPlan,
  iteration,
  onApprove,
  onRetry,
}) => {
  const getActionIcon = (actionType: string) => {
    const icons: Record<string, string> = {
      click: "👆",
      double_click: "👆👆",
      type: "⌨️",
      key_press: "🔘",
      scroll: "📜",
      hover: "🖱️",
      wait: "⏱️",
      copy: "📋",
      paste: "📌",
    };
    return icons[actionType] || "▶️";
  };

  return (
    <div className="action-plan-approval">
      <style>{`
        .action-plan-approval {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 16px;
          padding: 24px;
          margin: 16px 0;
          color: white;
          box-shadow: 0 8px 32px rgba(102, 126, 234, 0.3);
        }

        .approval-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 20px;
        }

        .approval-badge {
          background: rgba(255, 255, 255, 0.2);
          padding: 6px 12px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 600;
          backdrop-filter: blur(10px);
        }

        .approval-title {
          font-size: 20px;
          font-weight: 700;
          margin: 0;
          flex: 1;
        }

        .actions-list {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 20px;
          backdrop-filter: blur(10px);
        }

        .action-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 12px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 8px;
          margin-bottom: 8px;
          transition: all 0.2s ease;
        }

        .action-item:hover {
          background: rgba(255, 255, 255, 0.15);
          transform: translateX(4px);
        }

        .action-item:last-child {
          margin-bottom: 0;
        }

        .action-icon {
          font-size: 24px;
          flex-shrink: 0;
        }

        .action-content {
          flex: 1;
        }

        .action-type {
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          opacity: 0.8;
          margin-bottom: 4px;
          letter-spacing: 0.5px;
        }

        .action-description {
          font-size: 14px;
          line-height: 1.5;
          margin-bottom: 8px;
        }

        .action-details {
          font-size: 12px;
          opacity: 0.7;
          font-family: 'Monaco', 'Courier New', monospace;
        }

        .verification-section {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 20px;
          backdrop-filter: blur(10px);
        }

        .verification-title {
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 12px;
          opacity: 0.9;
        }

        .verification-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px;
          font-size: 13px;
          opacity: 0.8;
        }

        .approval-actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
        }

        .approval-button {
          padding: 12px 24px;
          border: none;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .retry-button {
          background: rgba(255, 255, 255, 0.15);
          color: white;
          backdrop-filter: blur(10px);
        }

        .retry-button:hover {
          background: rgba(255, 255, 255, 0.25);
          transform: translateY(-2px);
        }

        .approve-button {
          background: white;
          color: #667eea;
        }

        .approve-button:hover {
          background: #f0f0f0;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .approval-button:active {
          transform: translateY(0);
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
            <div className="verification-title">✓ Success Criteria:</div>
            {actionPlan.batch_verification.success_criteria.map(
              (criterion, idx) => (
                <div key={idx} className="verification-item">
                  <span>•</span>
                  <span>
                    {criterion.type}: &quot;{criterion.content}&quot;
                  </span>
                </div>
              )
            )}
          </div>
        )}

      <div className="approval-actions">
        <button className="approval-button retry-button" onClick={onRetry}>
          <span>🔄</span>
          <span>Regenerate Plan</span>
        </button>
        <button className="approval-button approve-button" onClick={onApprove}>
          <span>✓</span>
          <span>Execute Actions</span>
        </button>
      </div>
    </div>
  );
};

export default ActionPlanApproval;
