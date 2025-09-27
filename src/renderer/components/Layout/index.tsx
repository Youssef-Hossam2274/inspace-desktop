import React from 'react';
import Sidebar, { SidebarProvider, useSidebar } from '../Sidebar';
import { LayoutProps } from './types';
import './styles.scss';

const LayoutContent: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isOpen } = useSidebar();
  
  return (
    <div className={`layout__content ${isOpen ? 'layout__content--open' : 'layout__content--closed'}`}>
      {children}
    </div>
  );
};

const Layout: React.FC<LayoutProps> = ({ children, className }) => {
  return (
    <SidebarProvider>
      <div className={`layout ${className || ''}`}>
        <Sidebar />
        <LayoutContent>
          {children}
        </LayoutContent>
      </div>
    </SidebarProvider>
  );
};

export default Layout;