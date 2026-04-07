import { useEffect, useRef, useState } from 'react';
import { MoreHorizontal, Shield, Trash2, User } from 'lucide-react';
import Avatar from '../common/Avatar';
import Badge from '../common/Badge';

export default function UsersTable({ users = [], onDelete }) {
  const [openMenuUserId, setOpenMenuUserId] = useState(null);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!openMenuUserId) {
      return undefined;
    }

    const handleOutsideClick = (event) => {
      if (!menuRef.current?.contains(event.target)) {
        setOpenMenuUserId(null);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [openMenuUserId]);

  const handleDeleteClick = (user) => {
    if (user.is_active === false) {
      setOpenMenuUserId(null);
      return;
    }

    const confirmed = window.confirm(`Deactivate ${user.full_name || user.email}?`);
    if (!confirmed) {
      return;
    }

    setOpenMenuUserId(null);
    onDelete?.(user.id);
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px]">
        <thead>
          <tr className="border-b border-border-color">
            {['User', 'Role', 'Analyses', 'Status', 'Joined', 'Actions'].map((col) => (
              <th
                key={col}
                className="text-left py-3 px-4 text-[11px] uppercase tracking-wider text-text-muted font-medium"
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr
              key={user.id}
              className="border-b border-border-color/50 hover:bg-bg-glass transition-colors"
            >
              <td className="py-3 px-4">
                <div className="flex items-center gap-3">
                  <Avatar name={user.full_name || user.email} size={36} />
                  <div>
                    <p className="text-sm font-medium text-text-primary">{user.full_name || 'Unknown'}</p>
                    <p className="text-[11px] text-text-muted">{user.email}</p>
                  </div>
                </div>
              </td>
              <td className="py-3 px-4">
                <Badge variant={user.role === 'admin' ? 'purple' : 'default'}>
                  {user.role === 'admin' ? <Shield size={10} /> : <User size={10} />}
                  {user.role || 'user'}
                </Badge>
              </td>
              <td className="py-3 px-4 text-sm text-text-primary">
                {user.analyses_count ?? 0}
              </td>
              <td className="py-3 px-4">
                <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${
                  user.is_active !== false ? 'text-accent-green' : 'text-accent-red'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    user.is_active !== false ? 'bg-accent-green' : 'bg-accent-red'
                  }`} />
                  {user.is_active !== false ? 'Active' : 'Inactive'}
                </span>
              </td>
              <td className="py-3 px-4 text-sm text-text-secondary">
                {user.created_at ? new Date(user.created_at).toLocaleDateString() : '--'}
              </td>
              <td className="py-3 px-4">
                <div ref={openMenuUserId === user.id ? menuRef : null} className="relative">
                  <button
                    type="button"
                    onClick={() => setOpenMenuUserId((current) => (current === user.id ? null : user.id))}
                    className="w-8 h-8 rounded-lg border border-border-color flex items-center justify-center text-text-muted hover:border-accent-blue hover:text-accent-blue transition-all"
                    aria-label={`Open actions for ${user.full_name || user.email}`}
                  >
                    <MoreHorizontal size={14} />
                  </button>

                  {openMenuUserId === user.id && (
                    <div className="absolute right-0 z-20 mt-2 min-w-[160px] overflow-hidden rounded-xl border border-border-color bg-bg-secondary/95 shadow-[0_18px_40px_rgba(0,0,0,0.35)] backdrop-blur-xl">
                      <button
                        type="button"
                        onClick={() => handleDeleteClick(user)}
                        disabled={user.is_active === false}
                        className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm text-accent-red transition-colors hover:bg-accent-red/10 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent"
                      >
                        <Trash2 size={14} />
                        {user.is_active === false ? 'User inactive' : 'Deactivate user'}
                      </button>
                    </div>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
