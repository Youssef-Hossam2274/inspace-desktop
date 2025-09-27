import React, { useState, createContext, useContext } from 'react';
import { SidebarProps, MenuItem } from './types';
import styles from './styles.module.scss';

// Context for sidebar state
interface SidebarContextType {
  isOpen: boolean;
  toggleSidebar: () => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
};

export const SidebarProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
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

const menuItems: MenuItem[] = [
  { id: 'new-chat', label: 'New Chat', icon: '💬', onClick: () => console.log('New Chat') },
  { id: 'history', label: 'Chat History', icon: '📋', onClick: () => console.log('History') },
  { id: 'templates', label: 'Templates', icon: '📄', onClick: () => console.log('Templates') },
  { id: 'settings', label: 'Settings', icon: '⚙️', onClick: () => console.log('Settings') },
  { id: 'help', label: 'Help & Support', icon: '❓', onClick: () => console.log('Help') },
];

const Sidebar: React.FC<SidebarProps> = ({ className }) => {
  const { isOpen, toggleSidebar } = useSidebar();

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && <div className={styles.sidebarOverlay} onClick={toggleSidebar} />}
      
      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : styles.sidebarClosed} ${className || ''}`}>
        {/* Header */}
        <div className={styles.sidebarHeader}>
          <div className={styles.sidebarLogo}>
            <span className={styles.sidebarLogoIcon}>🚀</span>
            {isOpen && <span className={styles.sidebarLogoText}>InSpace</span>}
          </div>
          <button
            className={styles.sidebarToggle}
            onClick={toggleSidebar}
            aria-label={isOpen ? 'Close sidebar' : 'Open sidebar'}
          >
            <span className={styles.sidebarToggleIcon}>
              {isOpen ? '←' : '→'}
            </span>
          </button>
        </div>

        {/* Navigation */}
        <nav className={styles.sidebarNav}>
          <ul className={styles.sidebarMenu}>
            {menuItems.map((item) => (
              <li key={item.id} className={styles.sidebarMenuItem}>
                <button
                  className={styles.sidebarMenuLink}
                  onClick={item.onClick}
                  title={!isOpen ? item.label : undefined}
                >
                  <span className={styles.sidebarMenuIcon}>{item.icon}</span>
                  {isOpen && <span className={styles.sidebarMenuText}>{item.label}</span>}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Footer */}
        <div className={styles.sidebarFooter}>
          <div className={styles.sidebarUser}>
            <div className={styles.sidebarUserAvatar}>👤</div>
            {isOpen && (
              <div className={styles.sidebarUserInfo}>
                <span className={styles.sidebarUserName}>User</span>
                <span className={styles.sidebarUserEmail}>user@example.com</span>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;