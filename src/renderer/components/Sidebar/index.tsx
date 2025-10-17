import React, { useState, createContext, useContext } from "react";
import { Link } from "react-router-dom";
import { MessageSquare, FlaskConical, History, Sun, Moon } from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";
import { SidebarProps, MenuItem } from "./types";

// Context for sidebar state
interface SidebarContextType {
  isOpen: boolean;
  toggleSidebar: () => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
};

export const SidebarProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  return (
    <SidebarContext.Provider value={{ isOpen, toggleSidebar }}>
      {children}
    </SidebarContext.Provider>
  );
};

const Sidebar: React.FC<SidebarProps> = ({ className }) => {
  const { isOpen, toggleSidebar } = useSidebar();
  const { theme, toggleTheme } = useTheme();

  const menuItems: MenuItem[] = [
    {
      id: "new-chat",
      label: "New Chat",
      icon: "chat",
      href: "/",
    },
    {
      id: "history",
      label: "History",
      icon: "history",
      href: "/history",
    },
    {
      id: "test",
      label: "Testing",
      icon: "test",
      href: "/testing",
    },
  ];

  const getIcon = (iconName: string) => {
    const iconProps = { size: 20, strokeWidth: 2 };
    switch (iconName) {
      case "chat":
        return <MessageSquare {...iconProps} />;
      case "history":
        return <History {...iconProps} />;
      case "test":
        return <FlaskConical {...iconProps} />;
      default:
        return <MessageSquare {...iconProps} />;
    }
  };

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-[998] animate-fade-in lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-screen z-[999] overflow-hidden flex flex-col
          transition-[width,transform] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
          bg-bg-dark-secondary dark:bg-bg-dark-secondary
          border-r border-border-dark-primary dark:border-border-dark-primary
          ${isOpen ? "w-[280px]" : "w-16"}
          max-lg:${isOpen ? "translate-x-0" : "-translate-x-full"}
          ${className || ""}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border-dark-tertiary dark:border-border-dark-tertiary h-16 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            {isOpen && (
              <span className="text-lg font-semibold text-text-dark-primary dark:text-text-dark-primary whitespace-nowrap overflow-hidden transition-opacity duration-300">
                InSpace
              </span>
            )}
          </div>
          <button
            className="
              w-9 h-9 p-0 bg-transparent flex items-center justify-center
              text-text-dark-secondary dark:text-text-dark-secondary
              border border-border-dark-primary dark:border-border-dark-primary
              rounded-lg flex-shrink-0 cursor-pointer
              transition-all duration-200 ease-in-out
              hover:bg-white/5 dark:hover:bg-white/5
              hover:text-text-dark-primary dark:hover:text-text-dark-primary
              hover:border-border-dark-secondary dark:hover:border-border-dark-secondary
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2
            "
            onClick={toggleSidebar}
            aria-label={isOpen ? "Close sidebar" : "Open sidebar"}
          >
            <span
              className={`
                text-sm font-bold block transition-transform duration-200 ease-in-out
                ${isOpen ? "" : "rotate-180"}
              `}
            >
              ←
            </span>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-track-transparent scrollbar-thumb-border-dark-secondary dark:scrollbar-thumb-border-dark-secondary scrollbar-thumb-rounded">
          <ul className="list-none m-0 p-0 px-2 flex flex-col gap-1">
            {menuItems.map((item) => (
              <li key={item.id} className="m-0">
                <Link style={{ textDecoration: "none" }} to={item.href || "#"}>
                  <button
                    className="
                      flex items-center gap-3 w-full px-3 py-3 bg-transparent
                      border-none rounded-lg text-text-dark-secondary dark:text-text-dark-secondary
                      cursor-pointer transition-all duration-200 ease-in-out relative justify-start
                      hover:bg-white/5 dark:hover:bg-white/5
                      hover:text-text-dark-primary dark:hover:text-text-dark-primary
                      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-[-2px]
                      active:bg-white/10 dark:active:bg-white/10
                      group
                    "
                    onClick={item.onClick}
                    title={!isOpen ? item.label : undefined}
                  >
                    <span className="w-6 h-6 flex items-center justify-center flex-shrink-0">
                      {getIcon(item.icon)}
                    </span>
                    {isOpen && (
                      <span className="text-sm font-medium whitespace-nowrap overflow-hidden text-ellipsis transition-opacity duration-300">
                        {item.label}
                      </span>
                    )}
                    {/* Tooltip for closed state */}
                    {!isOpen && (
                      <span
                        className="
                        absolute left-[calc(100%+8px)] top-1/2 -translate-y-1/2
                        bg-bg-dark-quaternary dark:bg-bg-dark-quaternary
                        text-text-dark-primary dark:text-text-dark-primary
                        px-3 py-2 rounded-md whitespace-nowrap text-[13px] z-[1000]
                        border border-border-dark-primary dark:border-border-dark-primary
                        shadow-lg-dark dark:shadow-lg-dark
                        opacity-0 group-hover:opacity-100 pointer-events-none
                        transition-opacity duration-200 delay-500
                        max-lg:hidden
                      "
                      >
                        {item.label}
                        <span
                          className="
                          absolute right-full top-1/2 -translate-y-1/2
                          border-4 border-transparent border-r-border-dark-primary dark:border-r-border-dark-primary
                        "
                        />
                      </span>
                    )}
                  </button>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Footer with Theme Toggle */}
        <div className="p-2 pt-4 border-t border-border-dark-tertiary dark:border-border-dark-tertiary flex-shrink-0">
          <button
            className="
              flex items-center gap-3 w-full px-3 py-3 bg-transparent
              border-none rounded-lg text-text-dark-secondary dark:text-text-dark-secondary
              cursor-pointer transition-all duration-200 ease-in-out
              hover:bg-white/5 dark:hover:bg-white/5
              hover:text-text-dark-primary dark:hover:text-text-dark-primary
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-[-2px]
              group
            "
            onClick={toggleTheme}
            title={
              theme === "light" ? "Switch to dark mode" : "Switch to light mode"
            }
          >
            <span className="w-6 h-6 flex items-center justify-center flex-shrink-0">
              {theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
            </span>
            {isOpen && (
              <span className="text-sm font-medium whitespace-nowrap overflow-hidden text-ellipsis transition-opacity duration-300">
                {theme === "light" ? "Dark Mode" : "Light Mode"}
              </span>
            )}
            {/* Tooltip for closed state */}
            {!isOpen && (
              <span
                className="
                absolute left-[calc(100%+8px)] top-1/2 -translate-y-1/2
                bg-bg-dark-quaternary dark:bg-bg-dark-quaternary
                text-text-dark-primary dark:text-text-dark-primary
                px-3 py-2 rounded-md whitespace-nowrap text-[13px] z-[1000]
                border border-border-dark-primary dark:border-border-dark-primary
                shadow-lg-dark dark:shadow-lg-dark
                opacity-0 group-hover:opacity-100 pointer-events-none
                transition-opacity duration-200 delay-500
                max-lg:hidden
              "
              >
                {theme === "light" ? "Dark Mode" : "Light Mode"}
                <span
                  className="
                  absolute right-full top-1/2 -translate-y-1/2
                  border-4 border-transparent border-r-border-dark-primary dark:border-r-border-dark-primary
                "
                />
              </span>
            )}
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
