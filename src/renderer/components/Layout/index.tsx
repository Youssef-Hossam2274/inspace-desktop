import React from 'react';
import Sidebar, { SidebarProvider, useSidebar } from '../Sidebar';
import { LayoutProps } from './types';
import styles from './styles.module.scss';

const LayoutContent: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isOpen } = useSidebar();
  
  return (
    <div className={`${styles.layoutContent} ${isOpen ? styles.layoutContentOpen : styles.layoutContentClosed}`}>
      {children}
    </div>
  );
};

const Layout: React.FC<LayoutProps> = ({ children, className }) => {
  return (
    <SidebarProvider>
      <div className={`${styles.layout} ${className || ''}`}>
        <Sidebar />
        <LayoutContent>
          {children}
        </LayoutContent>
      </div>
    </SidebarProvider>
  );
};

export default Layout;