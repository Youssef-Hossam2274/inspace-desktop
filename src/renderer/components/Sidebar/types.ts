export interface MenuItem {
  id: string;
  label: string;
  icon: string;
  href?: string;
  onClick?: () => void;
}

export interface SidebarProps {
  className?: string;
}