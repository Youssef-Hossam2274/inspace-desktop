import React from "react";
import Sidebar, { SidebarProvider, useSidebar } from "../Sidebar";
import { LayoutProps } from "./types";

const LayoutContent: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { isOpen } = useSidebar();

  return (
    <div
      className={`
        flex-1 flex flex-col min-w-0 transition-[margin-left] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
        lg:${isOpen ? "ml-[280px]" : "ml-16"}
      `}
    >
      {children}
    </div>
  );
};

const Layout: React.FC<LayoutProps> = ({ children, className }) => {
  return (
    <SidebarProvider>
      <div
        className={`
          min-h-screen flex
          bg-bg-dark-primary text-text-dark-primary
          dark:bg-bg-dark-primary dark:text-text-dark-primary
          ${className || ""}
        `}
      >
        <Sidebar />
        <LayoutContent>{children}</LayoutContent>
      </div>
    </SidebarProvider>
  );
};

export default Layout;
