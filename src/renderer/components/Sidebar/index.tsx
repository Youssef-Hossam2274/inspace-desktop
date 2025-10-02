import React, { useState, createContext, useContext } from "react";
import { Link } from "react-router-dom";
import { MessageSquare, FlaskConical, History, Sun, Moon } from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";
import { SidebarProps, MenuItem } from "./types";
import styles from "./styles.module.scss";

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
        <div className={styles.sidebarOverlay} onClick={toggleSidebar} />
      )}

      {/* Sidebar */}
      <aside
        className={`${styles.sidebar} ${
          isOpen ? styles.sidebarOpen : styles.sidebarClosed
        } ${className || ""}`}
      >
        {/* Header */}
        <div className={styles.sidebarHeader}>
          <div className={styles.sidebarLogo}>
            {isOpen && <span className={styles.sidebarLogoText}>InSpace</span>}
          </div>
          <button
            className={styles.sidebarToggle}
            onClick={toggleSidebar}
            aria-label={isOpen ? "Close sidebar" : "Open sidebar"}
          >
            <span className={styles.sidebarToggleIcon}>←</span>
          </button>
        </div>

        {/* Navigation */}
        <nav className={styles.sidebarNav}>
          <ul className={styles.sidebarMenu}>
            {menuItems.map((item) => (
              <li key={item.id} className={styles.sidebarMenuItem}>
                <Link style={{ textDecoration: "none" }} to={item.href || "#"}>
                  <button
                    className={styles.sidebarMenuLink}
                    onClick={item.onClick}
                    title={!isOpen ? item.label : undefined}
                  >
                    <span className={styles.sidebarMenuIcon}>
                      {getIcon(item.icon)}
                    </span>
                    {isOpen && (
                      <span className={styles.sidebarMenuText}>
                        {item.label}
                      </span>
                    )}
                  </button>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Footer with Theme Toggle */}
        <div className={styles.sidebarFooter}>
          <button
            className={styles.themeToggle}
            onClick={toggleTheme}
            title={
              theme === "light" ? "Switch to dark mode" : "Switch to light mode"
            }
          >
            <span className={styles.themeToggleIcon}>
              {theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
            </span>
            {isOpen && (
              <span className={styles.themeToggleText}>
                {theme === "light" ? "Dark Mode" : "Light Mode"}
              </span>
            )}
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
