import React from 'react';
import Sidebar from '../Sidebar';
import { LayoutProps } from './types';
import styles from './styles.module.scss';

const Layout: React.FC<LayoutProps> = ({ children, className }) => {
  return (
    <div className={`${styles?.layout || 'layout'} ${className || ''}`}>
      <Sidebar />
      <div className={styles?.layoutContent || 'layout__content'}>
        {children}
      </div>
    </div>
  );
};

export default Layout;