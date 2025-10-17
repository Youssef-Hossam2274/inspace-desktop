import React, { useState, useRef, useLayoutEffect } from "react";

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
    <div className="w-full max-w-[800px] mx-auto p-4">
      <div
        className={`
          flex bg-bg-dark-secondary dark:bg-bg-dark-secondary
          border transition-all duration-200 ease-out
          overflow-hidden gap-3 rounded-xl p-4 px-6
          ${
            isFocused
              ? "border-primary shadow-[0_0_0_3px_rgba(107,125,181,0.3)] dark:border-primary dark:shadow-[0_0_0_3px_rgba(107,125,181,0.3)]"
              : "border-border-dark-secondary dark:border-border-dark-secondary shadow-sm-dark dark:shadow-sm-dark hover:border-border-dark-primary dark:hover:border-border-dark-primary hover:bg-bg-dark-tertiary dark:hover:bg-bg-dark-tertiary"
          }
        `}
      >
        <div className="flex flex-1 flex-col">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={placeholder}
            disabled={disabled}
            className={`
              w-full min-h-[24px] max-h-[200px] bg-transparent
              border-none outline-none resize-none
              font-sans text-base font-normal leading-relaxed
              text-text-dark-primary dark:text-text-dark-primary
              placeholder:text-text-dark-tertiary dark:placeholder:text-text-dark-tertiary
              disabled:opacity-50 disabled:cursor-not-allowed
              scrollbar-thin scrollbar-track-transparent
              scrollbar-thumb-border-dark-primary dark:scrollbar-thumb-border-dark-primary
              scrollbar-thumb-rounded-full
              hover:scrollbar-thumb-text-dark-tertiary dark:hover:scrollbar-thumb-text-dark-tertiary
            `}
            rows={1}
          />
          {message.length > 0 && (
            <div className="flex justify-end text-xs text-text-dark-muted dark:text-text-dark-muted pointer-events-none bg-transparent py-1 px-2">
              {message.length}/{maxLength}
            </div>
          )}
        </div>

        <div className="flex items-center items-end">
          <button
            onClick={handleSubmit}
            disabled={!isMessageValid || disabled}
            className={`
              flex items-center justify-center w-9 h-9 rounded-lg
              border cursor-pointer transition-all duration-200 ease-out
              ${
                isMessageValid
                  ? "bg-primary border-primary text-white hover:bg-primary-dark hover:border-primary-dark hover:text-white hover:not-disabled:scale-105 active:not-disabled:scale-95 [&>svg]:translate-x-px"
                  : "bg-bg-dark-tertiary dark:bg-bg-dark-tertiary border-border-dark-secondary dark:border-border-dark-secondary text-text-dark-tertiary dark:text-text-dark-tertiary hover:not-disabled:bg-bg-dark-quaternary dark:hover:not-disabled:bg-bg-dark-quaternary hover:not-disabled:border-border-dark-primary dark:hover:not-disabled:border-border-dark-primary hover:not-disabled:text-text-dark-secondary dark:hover:not-disabled:text-text-dark-secondary hover:not-disabled:scale-105 active:not-disabled:scale-95"
              }
              disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none
            `}
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
              className="transition-transform duration-200 ease-out"
            >
              <path d="m22 2-7 20-4-9-9-4Z" />
              <path d="M22 2 11 13" />
            </svg>
          </button>
        </div>
      </div>

      <div className="mt-2 flex items-center justify-center">
        <span className="text-xs text-text-dark-muted dark:text-text-dark-muted font-normal">
          Press Enter to send, Shift+Enter for new line
        </span>
      </div>
    </div>
  );
};

export default ChatInput;
