import { motion } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import {
  Search, UserPlus,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import AdminSidebar from '../../components/layout/AdminSidebar';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import UsersTable from '../../components/admin/UsersTable';
import useAuthStore from '../../store/authStore';
import useSidebarStore from '../../store/sidebarStore';
import useToastStore from '../../store/toastStore';
import { useAdmin } from '../../hooks/useAdmin';

export default function AdminUsers() {
  const { user } = useAuthStore();
  const isSidebarCollapsed = useSidebarStore((state) => state.isCollapsed);
  const { users, createUser, deleteUser, error } = useAdmin();
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [newUser, setNewUser] = useState({
    full_name: '',
    email: '',
    password: '',
    role: 'user',
    is_active: true,
  });
  const showToast = useToastStore((state) => state.showToast);

  const resetForm = () => {
    setNewUser({
      full_name: '',
      email: '',
      password: '',
      role: 'user',
      is_active: true,
    });
    setFormError('');
  };

  const openAddUserModal = () => {
    resetForm();
    setIsAddUserOpen(true);
  };

  const closeAddUserModal = () => {
    setIsAddUserOpen(false);
    setIsSubmitting(false);
    setFormError('');
    if (searchParams.get('create') === '1') {
      setSearchParams({}, { replace: true });
    }
  };

  const handleFieldChange = (field, value) => {
    setNewUser((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleCreateUser = async (event) => {
    event.preventDefault();

    if (!newUser.full_name.trim() || !newUser.email.trim() || !newUser.password.trim()) {
      setFormError('Full name, email, and password are required.');
      return;
    }

    if (newUser.password.trim().length < 6) {
      setFormError('Password must be at least 6 characters.');
      return;
    }

    try {
      setIsSubmitting(true);
      setFormError('');
      await createUser({
        ...newUser,
        full_name: newUser.full_name.trim(),
        email: newUser.email.trim(),
        password: newUser.password.trim(),
      });
      showToast({
        title: 'User created',
        message: `${newUser.full_name.trim()} has been added successfully.`,
        variant: 'success',
      });
      closeAddUserModal();
      resetForm();
    } catch (err) {
      setFormError(err?.response?.data?.detail || 'Failed to create user.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    const name = u.full_name || u.email || '';
    return name.toLowerCase().includes(search.toLowerCase());
  });
  const shouldOpenCreateModal = searchParams.get('create') === '1';

  useEffect(() => {
    if (shouldOpenCreateModal) {
      openAddUserModal();
    }
  }, [shouldOpenCreateModal]);

  return (
    <div className="min-h-screen bg-bg-primary">
      <AdminSidebar />

      {/* Main Content */}
      <main className={`px-4 py-6 pb-28 sm:px-6 md:p-8 md:pb-8 transition-all duration-300 ${isSidebarCollapsed ? 'md:ml-[92px]' : 'md:ml-[260px]'}`}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-display font-bold text-text-primary">User Management</h1>
              <p className="text-sm text-text-secondary mt-1">
                Manage platform users and their permissions
              </p>
            </div>
            <Button size="sm" onClick={openAddUserModal}>
              <UserPlus size={16} className="mr-2 inline" />
              Add User
            </Button>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <div className="relative w-full sm:max-w-sm">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search users..."
                className="w-full pl-9 pr-4 py-2.5 bg-bg-glass border border-border-color rounded-xl text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-blue"
              />
            </div>
          </div>

          {error && (
            <p className="text-sm text-accent-red">{error}</p>
          )}

          <Card hover={false}>
            <UsersTable users={filteredUsers} onDelete={deleteUser} />
          </Card>
        </motion.div>
      </main>

      <Modal isOpen={isAddUserOpen} onClose={closeAddUserModal} title="Add User">
        <form onSubmit={handleCreateUser} className="space-y-4">
          <Input
            label="Full Name"
            value={newUser.full_name}
            onChange={(e) => handleFieldChange('full_name', e.target.value)}
            placeholder="Enter full name"
          />

          <Input
            label="Email"
            type="email"
            value={newUser.email}
            onChange={(e) => handleFieldChange('email', e.target.value)}
            placeholder="Enter email address"
          />

          <Input
            label="Password"
            type="password"
            value={newUser.password}
            onChange={(e) => handleFieldChange('password', e.target.value)}
            placeholder="Set a password"
          />

          <div>
            <label className="block text-xs uppercase tracking-wider text-text-muted mb-2 font-medium">
              Role
            </label>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {['user', 'admin'].map((role) => {
                const active = newUser.role === role;
                return (
                  <button
                    key={role}
                    type="button"
                    onClick={() => handleFieldChange('role', role)}
                    className={`rounded-xl border px-3 py-2 text-sm font-medium transition-all ${
                      active
                        ? 'border-accent-blue bg-accent-blue/10 text-accent-blue'
                        : 'border-border-color bg-bg-glass text-text-secondary hover:border-accent-blue/30 hover:text-text-primary'
                    }`}
                  >
                    {role === 'admin' ? 'Administrator' : 'User'}
                  </button>
                );
              })}
            </div>
          </div>

          <label className="flex items-center gap-3 rounded-xl border border-border-color bg-bg-glass px-4 py-3 text-sm text-text-secondary">
            <input
              type="checkbox"
              checked={newUser.is_active}
              onChange={(e) => handleFieldChange('is_active', e.target.checked)}
              className="h-4 w-4 rounded accent-accent-blue"
            />
            Active account
          </label>

          {formError && (
            <p className="text-sm text-accent-red">{formError}</p>
          )}

          <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="ghost" onClick={closeAddUserModal}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create User'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
