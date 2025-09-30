import { FC, useState, useRef, useEffect, useCallback } from "react";
import ChatInput from "../../ChatInput";
import styles from "./styles.module.scss";

interface Message {
  id: string;
  content: string;
  timestamp: Date;
  sender: "user" | "assistant";
}

const NewChat: FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [showScrollButton, setShowScrollButton] = useState(false);
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
  }, [messages]);

  // Add scroll event listener
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container) {
      container.addEventListener("scroll", handleScroll);
      return () => container.removeEventListener("scroll", handleScroll);
    }
  }, [handleScroll]);

  const handleExcuteActions = async () => {
    // Execute nut.js functionality - move mouse and take screenshot
  };

  const handleSendMessage = (content: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      content,
      timestamp: new Date(),
      sender: "user",
    };

    setMessages((prev) => [...prev, newMessage]);

    // Always scroll to bottom when user sends a message
    // window.setTimeout(() => scrollToBottom(), 100);

    // Here you would typically send the message to your AI service
    // For now, we'll just add a mock response
    window.setTimeout(() => {
      const responseMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "I received your message: " + content,
        timestamp: new Date(),
        sender: "assistant",
      };
      setMessages((prev) => [...prev, responseMessage]);
      // Scroll to bottom when response arrives
      // window.setTimeout(() => scrollToBottom(), 100);
      handleExcuteActions();
    }, 1000);
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
                <div className={styles.messageContent}>{message.content}</div>
                <div className={styles.messageTime}>
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </div>
            ))}

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
        />
      </div>
    </div>
  );
};

export default NewChat;
