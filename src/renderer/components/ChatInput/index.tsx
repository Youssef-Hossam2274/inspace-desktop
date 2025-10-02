import React, { useState, useRef, useLayoutEffect } from "react";
import styles from "./styles.module.scss";

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  placeholder?: string;
  disabled?: boolean;
  maxLength?: number;
}

const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  placeholder = "Ask me anything...",
  disabled = false,
  maxLength = 4000,
}) => {
  const [message, setMessage] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useLayoutEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  const handleSubmit = async () => {
    const trimmedMessage = message.trim();
    if (trimmedMessage && !disabled) {
      onSendMessage(trimmedMessage);
      setMessage("");
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (value.length <= maxLength) {
      setMessage(value);
    }
  };

  const isMessageValid = message.trim().length > 0;

  return (
    <div className={styles.chatInputContainer}>
      <div
        className={`${styles.inputWrapper} ${isFocused ? styles.focused : ""}`}
      >
        <div className={styles.textareaContainer}>
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={placeholder}
            disabled={disabled}
            className={styles.textarea}
            rows={1}
          />
          {message.length > 0 && (
            <div className={styles.characterCount}>
              {message.length}/{maxLength}
            </div>
          )}
        </div>

        <div className={styles.actionsContainer}>
          <button
            onClick={handleSubmit}
            disabled={!isMessageValid || disabled}
            className={`${styles.sendButton} ${
              isMessageValid ? styles.sendButtonActive : ""
            }`}
            title="Send message (Enter)"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m22 2-7 20-4-9-9-4Z" />
              <path d="M22 2 11 13" />
            </svg>
          </button>
        </div>
      </div>

      <div className={styles.hints}>
        <span className={styles.hint}>
          Press Enter to send, Shift+Enter for new line
        </span>
      </div>
    </div>
  );
};

export default ChatInput;
