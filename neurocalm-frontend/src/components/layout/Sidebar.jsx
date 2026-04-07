import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  Brain, Home, Upload, History, BarChart3,
  Settings, HelpCircle, LogOut, ChevronLeft, ChevronRight,
} from 'lucide-react';
import Avatar from '../common/Avatar';
import useAuthStore from '../../store/authStore';
import useSidebarStore from '../../store/sidebarStore';

const menuItems = [
  { label: 'Dashboard', icon: Home, path: '/dashboard' },
  { label: 'New Analysis', icon: Upload, path: '/dashboard/upload' },
  { label: 'History', icon: History, path: '/history' },
  { label: 'Reports', icon: BarChart3, path: '/reports' },
];

const accountItems = [
  { label: 'Settings', icon: Settings, path: '/settings' },
  { label: 'Help', icon: HelpCircle, path: '/help' },
];

export default function Sidebar() {
  const { user, logout } = useAuthStore();
  const { isCollapsed, toggleCollapsed } = useSidebarStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const location = useLocation();

  const NavItem = ({ item }) => {
    const isActive = location.pathname === item.path;
    return (
      <NavLink
        to={item.path}
        title={item.label}
        className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
          ${isCollapsed ? 'justify-center px-0' : ''}
          ${isActive
            ? 'bg-accent-blue/10 text-accent-blue border-l-[3px] border-accent-blue'
            : 'text-text-secondary hover:bg-bg-glass hover:text-text-primary'
          }`}
      >
        <item.icon size={18} />
        {!isCollapsed && item.label}
      </NavLink>
    );
  };

  const MobileNavItem = ({ item }) => {
    const isActive = location.pathname === item.path;
    return (
      <NavLink
        to={item.path}
        title={item.label}
        className={`flex min-w-[74px] flex-col items-center justify-center gap-1 rounded-xl px-3 py-2 text-[11px] font-medium transition-all ${
          isActive
            ? 'bg-accent-blue/10 text-accent-blue'
            : 'text-text-secondary hover:bg-bg-glass hover:text-text-primary'
        }`}
      >
        <item.icon size={18} />
        <span className="max-w-[68px] truncate">{item.label}</span>
      </NavLink>
    );
  };

  return (
    <>
      <aside
        className={`fixed left-0 top-0 bottom-0 hidden bg-bg-card/80 backdrop-blur-[20px] border-r border-border-color md:flex flex-col z-30 transition-all duration-300 ${
          isCollapsed ? 'w-[92px]' : 'w-[260px]'
        }`}
      >
        {/* Logo */}
        <div className={`py-5 ${isCollapsed ? 'px-3' : 'px-6'}`}>
          <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br from-accent-blue to-accent-purple flex items-center justify-center ${isCollapsed ? '' : 'shrink-0'}`}>
              <Brain size={22} className="text-white" />
            </div>
            {!isCollapsed && (
              <span className="font-display text-[22px] font-bold text-text-primary">
                NeuroCalm
              </span>
            )}
            {!isCollapsed && (
              <button
                onClick={toggleCollapsed}
                className="ml-auto h-9 w-9 rounded-xl border border-border-color bg-bg-glass text-text-muted transition-all hover:border-accent-blue/30 hover:text-text-primary"
                title="Collapse sidebar"
                aria-label="Collapse sidebar"
              >
                <ChevronLeft size={16} className="mx-auto" />
              </button>
            )}
          </div>

          {isCollapsed && (
            <div className="mt-3 flex justify-center">
              <button
                onClick={toggleCollapsed}
                className="h-9 w-9 rounded-xl border border-border-color bg-bg-card/95 text-text-muted shadow-[0_10px_30px_rgba(15,23,42,0.35)] transition-all hover:border-accent-blue/30 hover:text-text-primary"
                title="Expand sidebar"
                aria-label="Expand sidebar"
              >
                <ChevronRight size={16} className="mx-auto" />
              </button>
            </div>
          )}
        </div>

        {/* Menu Section */}
        <div className={`flex-1 py-2 space-y-1 ${isCollapsed ? 'px-2' : 'px-4'}`}>
          {!isCollapsed && (
            <p className="px-4 py-2 text-[11px] uppercase tracking-wider text-text-muted font-medium">
              Menu
            </p>
          )}
          {menuItems.map((item) => (
            <NavItem key={item.label} item={item} />
          ))}

          {!isCollapsed && (
            <p className="px-4 pt-6 pb-2 text-[11px] uppercase tracking-wider text-text-muted font-medium">
              Account
            </p>
          )}
          {accountItems.map((item) => (
            <NavItem key={item.label} item={item} />
          ))}

          <button
            onClick={handleLogout}
            title="Logout"
            className={`flex items-center gap-3 py-2.5 rounded-xl text-sm font-medium text-text-secondary hover:bg-accent-red/10 hover:text-accent-red transition-all duration-200 w-full ${
              isCollapsed ? 'justify-center px-0' : 'px-4'
            }`}
          >
            <LogOut size={18} />
            {!isCollapsed && 'Logout'}
          </button>
        </div>

        {/* User Profile */}
        <div className={`py-4 border-t border-border-color flex items-center ${isCollapsed ? 'px-0 justify-center' : 'px-6 gap-3'}`}>
          <Avatar name={user?.full_name || 'User'} size={38} />
          {!isCollapsed && (
            <div className="min-w-0">
              <p className="text-[13px] font-semibold text-text-primary truncate">
                {user?.full_name || 'User'}
              </p>
              <p className="text-[11px] text-text-muted truncate">
                {user?.email || 'user@example.com'}
              </p>
            </div>
          )}
        </div>
      </aside>

      <nav className="fixed inset-x-3 bottom-3 z-40 rounded-2xl border border-border-color bg-bg-card/95 p-2 shadow-[0_18px_45px_rgba(0,0,0,0.35)] backdrop-blur-xl md:hidden">
        <div className="flex items-center gap-1 overflow-x-auto pb-1">
          {[...menuItems, ...accountItems].map((item) => (
            <MobileNavItem key={item.label} item={item} />
          ))}
          <button
            onClick={handleLogout}
            title="Logout"
            className="flex min-w-[74px] flex-col items-center justify-center gap-1 rounded-xl px-3 py-2 text-[11px] font-medium text-text-secondary transition-all hover:bg-accent-red/10 hover:text-accent-red"
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </nav>
    </>
  );
}
