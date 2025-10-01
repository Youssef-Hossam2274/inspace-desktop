import { FC, useState, useRef, useEffect, useCallback } from "react";
import ChatInput from "../../ChatInput";
import styles from "./styles.module.scss";

interface Message {
  id: string;
  content: string;
  timestamp: Date;
  sender: "user" | "assistant";
  actions?: string[];
  status?: "pending" | "approved" | "denied" | "executing" | "completed";
}

const NewChat: FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom function
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    }
  };

  // Check if user is at the bottom of the chat
  const isAtBottom = () => {
    if (!messagesContainerRef.current) return true;
    const { scrollTop, scrollHeight, clientHeight } =
      messagesContainerRef.current;
    return scrollHeight - scrollTop - clientHeight < 50;
  };

  // Handle scroll events
  const handleScroll = useCallback(() => {
    if (messagesContainerRef.current) {
      setShowScrollButton(!isAtBottom());
    }
  }, []);

  // Auto-scroll when messages change (only if user is at bottom)
  useEffect(() => {
    if (!isAtBottom()) {
      scrollToBottom();
    }
  }, [messages, isLoading]);

  // Add scroll event listener
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container) {
      container.addEventListener("scroll", handleScroll);
      return () => container.removeEventListener("scroll", handleScroll);
    }
  }, [handleScroll]);

  const handleAllowActions = async (messageId: string) => {
    // Update message status to executing
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId ? { ...msg, status: "executing" } : msg
      )
    );

    // Hide window and execute actions
    // await window.electronAPI.hideWindow();

    try {
      // Here you would execute the actual actions
      // For now, we'll simulate with a timeout
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Update message status to completed
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId ? { ...msg, status: "completed" } : msg
        )
      );
    } catch (error) {
      console.error("Error executing actions:", error);
      // Update message status back to pending on error
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId ? { ...msg, status: "pending" } : msg
        )
      );
    } finally {
      // Show window again
      await window.electronAPI.showWindow();
    }
  };

  const handleDenyActions = (messageId: string) => {
    // Update message status to denied
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId ? { ...msg, status: "denied" } : msg
      )
    );
  };

  const handleExcuteCua = async (prompt: string, status: string) => {
    console.log(prompt, status);
    if (status === "completed" || status === "error" || status === "failed")
      return;

    try {
      const result = await window.electronAPI.executePrompt(prompt);
      console.log(result);
      const status = result?.result?.status || "pending";
      // Create assistant message with action plan
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content:
          status === "failed"
            ? "I encountered an error"
            : "I will perform the following actions:",
        timestamp: new Date(),
        sender: "assistant",
        actions: result?.result?.action_plan?.map((plan: any) => {
          return plan?.description;
        }),
        status: "pending",
      };

      setMessages((prev) => [...prev, assistantMessage]);

      return await handleExcuteCua(prompt, status);
    } catch (error) {
      console.error("Error executing prompt:", error);

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "Sorry, I encountered an error processing your request.",
        timestamp: new Date(),
        sender: "assistant",
      };

      setMessages((prev) => [...prev, errorMessage]);
      return await handleExcuteCua(prompt, "error");
    } finally {
      setIsLoading(false);
      await window.electronAPI.showWindow();
    }
  };

  const handleSendMessage = async (content: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      content,
      timestamp: new Date(),
      sender: "user",
    };

    setMessages((prev) => [...prev, newMessage]);
    setIsLoading(true);

    // await window.electronAPI.hideWindow();
    await handleExcuteCua(content, "pending");
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
              <div
                key={message.id}
                className={`${styles.message} ${
                  message.sender === "user"
                    ? styles.userMessage
                    : styles.assistantMessage
                }`}
              >
                <div className={styles.messageContent}>
                  {message.content}

                  {/* Show actions inline for assistant messages */}
                  {message.sender === "assistant" && message.actions && (
                    <div className={styles.actionsInMessage}>
                      <div className={styles.actionsTitle}>
                        Planned Actions:
                      </div>
                      {message.actions.map((action, index) => (
                        <div key={index} className={styles.actionItemInline}>
                          {index + 1}. {action}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Show action buttons if this is an assistant message with actions */}
                {message.sender === "assistant" && message.actions && (
                  <div className={styles.actionsButtonContainer}>
                    {/* Show buttons based on status */}
                    {message.status === "pending" && (
                      <div className={styles.actionButtons}>
                        <button
                          className={`${styles.actionButton} ${styles.allowButton}`}
                          onClick={() => handleAllowActions(message.id)}
                        >
                          <svg
                            className={styles.buttonIcon}
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                          Allow Actions
                        </button>
                        <button
                          className={`${styles.actionButton} ${styles.denyButton}`}
                          onClick={() => handleDenyActions(message.id)}
                        >
                          <svg
                            className={styles.buttonIcon}
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                              clipRule="evenodd"
                            />
                          </svg>
                          Deny Actions
                        </button>
                      </div>
                    )}

                    {/* Show status indicators */}
                    {message.status === "executing" && (
                      <div className={styles.statusIndicator}>
                        <div className={styles.loadingSpinner}></div>
                        <span>Executing actions...</span>
                      </div>
                    )}

                    {message.status === "completed" && (
                      <div
                        className={`${styles.statusIndicator} ${styles.completed}`}
                      >
                        <svg
                          className={styles.statusIcon}
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Actions completed successfully
                      </div>
                    )}

                    {message.status === "denied" && (
                      <div
                        className={`${styles.statusIndicator} ${styles.denied}`}
                      >
                        <svg
                          className={styles.statusIcon}
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Actions denied by user
                      </div>
                    )}
                  </div>
                )}

                <div className={styles.messageTime}>
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </div>
            ))}

            {/* Loading indicator for new messages */}
            {isLoading && (
              <div className={`${styles.message} ${styles.assistantMessage}`}>
                <div
                  className={`${styles.messageContent} ${styles.loadingMessage}`}
                >
                  <div className={styles.loadingSpinner}></div>
                  <span>Thinking...</span>
                </div>
              </div>
            )}

            {/* Invisible element to scroll to */}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <div className={styles.inputContainer}>
        {/* Scroll to bottom button */}
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
          disabled={isLoading}
        />
      </div>
    </div>
  );
};

export default NewChat;
