import { FC, useState, useRef, useEffect, useCallback } from "react";
import ChatInput from "../../ChatInput";
import ActionPlanApproval from "../../ActionPlanApproval";
import styles from "./styles.module.scss";

interface Message {
  id: string;
  content: string;
  timestamp: Date;
  sender: "user" | "assistant";
  type?: "text" | "approval";
  actionPlan?: any;
  iteration?: number;
}

const NewChat: FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentPrompt, setCurrentPrompt] = useState<string>("");
  const [currentIteration, setCurrentIteration] = useState<number>(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    }
  };

  const isAtBottom = () => {
    if (!messagesContainerRef.current) return true;
    const { scrollTop, scrollHeight, clientHeight } =
      messagesContainerRef.current;
    return scrollHeight - scrollTop - clientHeight < 50;
  };

  const handleScroll = useCallback(() => {
    if (messagesContainerRef.current) {
      setShowScrollButton(!isAtBottom());
    }
  }, []);

  useEffect(() => {
    if (!isAtBottom()) {
      scrollToBottom();
    }
  }, [messages]);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container) {
      container.addEventListener("scroll", handleScroll);
      return () => container.removeEventListener("scroll", handleScroll);
    }
  }, [handleScroll]);

  // Listen for approval requests
  useEffect(() => {
    window.electronAPI.onApprovalNeeded((data: any) => {
      console.log("Approval needed:", data);

      setCurrentIteration(data.iteration || 0);

      const approvalMessage: Message = {
        id: Date.now().toString(),
        content: "",
        timestamp: new Date(),
        sender: "assistant",
        type: "approval",
        actionPlan: data.actionPlan,
        iteration: data.iteration,
      };

      setMessages((prev) => [...prev, approvalMessage]);
      window.setTimeout(() => scrollToBottom(), 100);
    });

    return () => {
      window.electronAPI.removeApprovalListener();
    };
  }, []);

  const handleApprovalDecision = async (
    decision: "approve" | "retry" | "abort"
  ) => {
    console.log(`User decision: ${decision}`);

    // Remove the approval message
    setMessages((prev) => prev.filter((msg) => msg.type !== "approval"));

    // Add status message based on decision
    const statusMessage: Message = {
      id: Date.now().toString(),
      content:
        decision === "approve"
          ? "Executing actions..."
          : decision === "retry"
            ? "Regenerating action plan..."
            : "Execution aborted",
      timestamp: new Date(),
      sender: "assistant",
    };
    setMessages((prev) => [...prev, statusMessage]);

    // Hide window ONLY when user approves (to execute actions on the actual UI)
    if (decision === "approve") {
      await window.electronAPI.hideWindow();
    }

    // If aborted, add to history and stop processing
    if (decision === "abort") {
      setIsProcessing(false);
      await window.electronAPI.showWindow();
    }

    // Send decision to main process
    await window.electronAPI.sendApprovalDecision(decision);
  };

  const handleSendMessage = async (content: string) => {
    if (isProcessing) return;

    setIsProcessing(true);
    setCurrentPrompt(content);
    setCurrentIteration(0);

    const newMessage: Message = {
      id: Date.now().toString(),
      content,
      timestamp: new Date(),
      sender: "user",
    };

    setMessages((prev) => [...prev, newMessage]);

    try {
      const result = await window.electronAPI.executePrompt(content);
      console.log("Execution result:", result);

      // Show completion message
      const completionMessage: Message = {
        id: Date.now().toString(),
        content: result.success
          ? "Task completed successfully!"
          : `Error: ${result.error}`,
        timestamp: new Date(),
        sender: "assistant",
      };

      setMessages((prev) => [...prev, completionMessage]);
    } catch (error) {
      console.error("Error executing prompt:", error);

      // Add error to history

      const errorMessage: Message = {
        id: Date.now().toString(),
        content: `Error: ${error}`,
        timestamp: new Date(),
        sender: "assistant",
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
      await window.electronAPI.showWindow();
      window.setTimeout(() => scrollToBottom(), 100);
    }
  };

  return (
    <div className={styles.newChatContainer}>
      <div className={styles.messagesContainer} ref={messagesContainerRef}>
        {messages.length === 0 ? (
          <div className={styles.welcomeMessage}>
            <h2>Welcome to InSpace Chat</h2>
            <p>Ask me anything to get started!</p>
          </div>
        ) : (
          <div className={styles.messagesList}>
            {messages.map((message) => (
              <div key={message.id}>
                {message.type === "approval" ? (
                  <ActionPlanApproval
                    actionPlan={message.actionPlan}
                    iteration={message.iteration || 0}
                    onApprove={() => handleApprovalDecision("approve")}
                    onRetry={() => handleApprovalDecision("retry")}
                    onAbort={() => handleApprovalDecision("abort")}
                  />
                ) : (
                  <div
                    className={`${styles.message} ${
                      message.sender === "user"
                        ? styles.userMessage
                        : styles.assistantMessage
                    }`}
                  >
                    <div className={styles.messageContent}>
                      {message.content}
                    </div>
                    <div className={styles.messageTime}>
                      {message.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                )}
              </div>
            ))}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <div className={styles.inputContainer}>
        {showScrollButton && (
          <button
            className={styles.scrollToBottomButton}
            onClick={scrollToBottom}
            title="Scroll to bottom"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m18 15-6-6-6 6" />
            </svg>
          </button>
        )}

        <ChatInput
          onSendMessage={handleSendMessage}
          placeholder="Ask me anything..."
          disabled={isProcessing}
        />
      </div>
    </div>
  );
};

export default NewChat;
