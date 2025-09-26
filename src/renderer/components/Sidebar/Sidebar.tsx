import React from 'react';
import './Sidebar.scss';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

interface MenuItem {
  id: string;
  label: string;
  icon: string;
  href?: string;
  onClick?: () => void;
}

const menuItems: MenuItem[] = [
  { id: 'new-chat', label: 'New Chat', icon: '💬', onClick: () => console.log('New Chat') },
  { id: 'history', label: 'Chat History', icon: '📋', onClick: () => console.log('History') },
  { id: 'templates', label: 'Templates', icon: '📄', onClick: () => console.log('Templates') },
  { id: 'settings', label: 'Settings', icon: '⚙️', onClick: () => console.log('Settings') },
  { id: 'help', label: 'Help & Support', icon: '❓', onClick: () => console.log('Help') },
];

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onToggle }) => {
  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && <div className="sidebar-overlay" onClick={onToggle} />}
      
      {/* Sidebar */}
      <aside className={`sidebar ${isOpen ? 'sidebar--open' : 'sidebar--closed'}`}>
        {/* Header */}
        <div className="sidebar__header">
          <div className="sidebar__logo">
            <span className="sidebar__logo-icon">🚀</span>
            {isOpen && <span className="sidebar__logo-text">InSpace</span>}
          </div>
          <button
            className="sidebar__toggle"
            onClick={onToggle}
            aria-label={isOpen ? 'Close sidebar' : 'Open sidebar'}
          >
            <span className="sidebar__toggle-icon">
              {isOpen ? '←' : '→'}
            </span>
          </button>
        </div>

        {/* Navigation */}
        <nav className="sidebar__nav">
          <ul className="sidebar__menu">
            {menuItems.map((item) => (
              <li key={item.id} className="sidebar__menu-item">
                <button
                  className="sidebar__menu-link"
                  onClick={item.onClick}
                  title={!isOpen ? item.label : undefined}
                >
                  <span className="sidebar__menu-icon">{item.icon}</span>
                  {isOpen && <span className="sidebar__menu-text">{item.label}</span>}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Footer */}
        <div className="sidebar__footer">
          <div className="sidebar__user">
            <div className="sidebar__user-avatar">👤</div>
            {isOpen && (
              <div className="sidebar__user-info">
                <span className="sidebar__user-name">User</span>
                <span className="sidebar__user-email">user@example.com</span>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;