import React, { useState } from 'react';
import { SidebarProps, MenuItem } from './types';
import styles from './styles.module.scss';

const menuItems: MenuItem[] = [
  { id: 'new-chat', label: 'New Chat', icon: '💬', onClick: () => console.log('New Chat') },
  { id: 'history', label: 'Chat History', icon: '📋', onClick: () => console.log('History') },
  { id: 'templates', label: 'Templates', icon: '📄', onClick: () => console.log('Templates') },
  { id: 'settings', label: 'Settings', icon: '⚙️', onClick: () => console.log('Settings') },
  { id: 'help', label: 'Help & Support', icon: '❓', onClick: () => console.log('Help') },
];

const Sidebar: React.FC<SidebarProps> = ({ className }) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && <div className={styles?.sidebarOverlay || 'sidebar-overlay'} onClick={toggleSidebar} />}
      
      {/* Sidebar */}
      <aside className={`${styles?.sidebar || 'sidebar'} ${isOpen ? styles?.sidebarOpen || 'sidebar--open' : styles?.sidebarClosed || 'sidebar--closed'} ${className || ''}`}>
        {/* Header */}
        <div className={styles?.sidebarHeader || 'sidebar__header'}>
          <div className={styles?.sidebarLogo || 'sidebar__logo'}>
            <span className={styles?.sidebarLogoIcon || 'sidebar__logo-icon'}>🚀</span>
            {isOpen && <span className={styles?.sidebarLogoText || 'sidebar__logo-text'}>InSpace</span>}
          </div>
          <button
            className={styles?.sidebarToggle || 'sidebar__toggle'}
            onClick={toggleSidebar}
            aria-label={isOpen ? 'Close sidebar' : 'Open sidebar'}
          >
            <span className={styles?.sidebarToggleIcon || 'sidebar__toggle-icon'}>
              {isOpen ? '←' : '→'}
            </span>
          </button>
        </div>

        {/* Navigation */}
        <nav className={styles?.sidebarNav || 'sidebar__nav'}>
          <ul className={styles?.sidebarMenu || 'sidebar__menu'}>
            {menuItems.map((item) => (
              <li key={item.id} className={styles?.sidebarMenuItem || 'sidebar__menu-item'}>
                <button
                  className={styles?.sidebarMenuLink || 'sidebar__menu-link'}
                  onClick={item.onClick}
                  title={!isOpen ? item.label : undefined}
                >
                  <span className={styles?.sidebarMenuIcon || 'sidebar__menu-icon'}>{item.icon}</span>
                  {isOpen && <span className={styles?.sidebarMenuText || 'sidebar__menu-text'}>{item.label}</span>}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Footer */}
        <div className={styles?.sidebarFooter || 'sidebar__footer'}>
          <div className={styles?.sidebarUser || 'sidebar__user'}>
            <div className={styles?.sidebarUserAvatar || 'sidebar__user-avatar'}>👤</div>
            {isOpen && (
              <div className={styles?.sidebarUserInfo || 'sidebar__user-info'}>
                <span className={styles?.sidebarUserName || 'sidebar__user-name'}>User</span>
                <span className={styles?.sidebarUserEmail || 'sidebar__user-email'}>user@example.com</span>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;