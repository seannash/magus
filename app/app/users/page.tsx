'use client';

import { useState, useEffect } from 'react';

interface User {
  email: string;
  passwordHash?: string;
  createdAt?: string;
}

export default function UserManagementPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [usersError, setUsersError] = useState('');
  const [resettingPasswordFor, setResettingPasswordFor] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');
  const [resetting, setResetting] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const handleCreateUser = async (e: React.FormEvent) => {
    console.log('handleCreateUser', { email, password });
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      console.log('Create user response:', { status: response.status, data });

      if (response.ok || response.status === 200) {
        setSuccess('User created successfully');
        setEmail('');
        setPassword('');
        // Clear any previous errors
        setUsersError('');
        loadUsers(); // Refresh the user list
      } else {
        const errorMsg = data.error || `Failed to create user (${response.status})`;
        setError(errorMsg);
        console.error('Failed to create user:', { status: response.status, error: errorMsg });
      }
    } catch (err: any) {
      console.error('Error creating user:', err);
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    setLoadingUsers(true);
    setUsersError('');
    try {
      const response = await fetch('/api/users');
      const data = await response.json();
      if (response.ok) {
        setUsers(data.users || []);
        if (data.error) {
          setUsersError(data.error);
        }
      } else {
        setUsersError(data.error || 'Failed to load users');
        setUsers(data.users || []);
      }
    } catch (err) {
      console.error('Failed to load users:', err);
      setUsersError('Failed to load users. Please check your connection.');
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleDeleteUser = async (userEmail: string) => {
    if (!confirm(`Are you sure you want to delete user ${userEmail}?`)) {
      return;
    }

    setDeleting(userEmail);
    setUsersError('');
    setError('');

    try {
      const response = await fetch(`/api/users?email=${encodeURIComponent(userEmail)}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('User deleted successfully');
        loadUsers(); // Refresh the user list
      } else {
        setError(data.error || 'Failed to delete user');
      }
    } catch (err: any) {
      console.error('Error deleting user:', err);
      setError(err.message || 'An error occurred while deleting the user.');
    } finally {
      setDeleting(null);
    }
  };

  const handleResetPassword = async (userEmail: string) => {
    if (!newPassword || newPassword.length < 6) {
      setResetError('Password must be at least 6 characters');
      return;
    }

    setResetting(true);
    setResetError('');
    setResetSuccess('');

    try {
      const response = await fetch('/api/users', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: userEmail, password: newPassword }),
      });

      const data = await response.json();

      if (response.ok) {
        setResetSuccess('Password reset successfully');
        setNewPassword('');
        setTimeout(() => {
          setResettingPasswordFor(null);
          setResetSuccess('');
        }, 2000);
      } else {
        setResetError(data.error || 'Failed to reset password');
      }
    } catch (err: any) {
      console.error('Error resetting password:', err);
      setResetError(err.message || 'An error occurred while resetting the password.');
    } finally {
      setResetting(false);
    }
  };

  // Load users on component mount
  useEffect(() => {
    loadUsers();
  }, []);

  return (
    <div className="flex min-h-screen bg-white dark:bg-black">
      <div className="w-full max-w-4xl mx-auto p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-black dark:text-white mb-2">
            User Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage users for the Magus application
          </p>
        </div>

        {/* Create User Form */}
        <div className="mb-8 rounded-lg border border-gray-200 bg-gray-50 p-6 dark:border-gray-800 dark:bg-gray-900">
          <h2 className="text-xl font-semibold text-black dark:text-white mb-4">
            Create New User
          </h2>
          <form onSubmit={handleCreateUser} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-black dark:text-white mb-1"
              >
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-black placeholder-gray-500 focus:border-black focus:outline-none focus:ring-2 focus:ring-black dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400 dark:focus:border-white dark:focus:ring-white"
                placeholder="Enter user email"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-black dark:text-white mb-1"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-black placeholder-gray-500 focus:border-black focus:outline-none focus:ring-2 focus:ring-black dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400 dark:focus:border-white dark:focus:ring-white"
                placeholder="Enter user password"
              />
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
                {error}
              </div>
            )}

            {success && (
              <div className="rounded-lg bg-green-50 p-3 text-sm text-green-600 dark:bg-green-900/20 dark:text-green-400">
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-black px-4 py-2 font-medium text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-gray-200"
            >
              {loading ? 'Creating...' : 'Create User'}
            </button>
          </form>
        </div>

        {/* Users List */}
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-6 dark:border-gray-800 dark:bg-gray-900">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-black dark:text-white">
              Users
            </h2>
            <button
              onClick={loadUsers}
              disabled={loadingUsers}
              className="rounded-lg px-4 py-2 text-sm font-medium text-black bg-white border border-gray-300 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:text-white dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700"
            >
              {loadingUsers ? 'Loading...' : 'Refresh'}
            </button>
          </div>

          {usersError && !loadingUsers && (
            <div className="mb-4 rounded-lg bg-yellow-50 p-3 text-sm text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">
              {usersError}
            </div>
          )}

          {loadingUsers ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              Loading users...
            </div>
          ) : users.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 text-sm font-medium text-black dark:text-white">
                      Email
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-black dark:text-white">
                      Created
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-black dark:text-white">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr
                      key={user.email}
                      className="border-b border-gray-200 dark:border-gray-700"
                    >
                      <td className="py-3 px-4 text-black dark:text-white">
                        {user.email}
                      </td>
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                        {user.createdAt
                          ? new Date(user.createdAt).toLocaleDateString()
                          : 'N/A'}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => {
                              setResettingPasswordFor(user.email);
                              setNewPassword('');
                              setResetError('');
                              setResetSuccess('');
                            }}
                            className="rounded-lg px-3 py-1 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 transition-colors hover:bg-blue-100 dark:text-blue-400 dark:bg-blue-900/20 dark:border-blue-800 dark:hover:bg-blue-900/30"
                          >
                            Reset Password
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.email)}
                            disabled={deleting === user.email}
                            className="rounded-lg px-3 py-1 text-sm font-medium text-red-600 bg-red-50 border border-red-200 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50 dark:text-red-400 dark:bg-red-900/20 dark:border-red-800 dark:hover:bg-red-900/30"
                          >
                            {deleting === user.email ? 'Deleting...' : 'Delete'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No users found
            </div>
          )}
        </div>

        {/* Reset Password Modal */}
        {resettingPasswordFor && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6 w-full max-w-md mx-4">
              <h3 className="text-xl font-semibold text-black dark:text-white mb-4">
                Reset Password for {resettingPasswordFor}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="newPassword"
                    className="block text-sm font-medium text-black dark:text-white mb-1"
                  >
                    New Password
                  </label>
                  <input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-black placeholder-gray-500 focus:border-black focus:outline-none focus:ring-2 focus:ring-black dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400 dark:focus:border-white dark:focus:ring-white"
                    placeholder="Enter new password (min 6 characters)"
                  />
                </div>

                {resetError && (
                  <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
                    {resetError}
                  </div>
                )}

                {resetSuccess && (
                  <div className="rounded-lg bg-green-50 p-3 text-sm text-green-600 dark:bg-green-900/20 dark:text-green-400">
                    {resetSuccess}
                  </div>
                )}

                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => {
                      setResettingPasswordFor(null);
                      setNewPassword('');
                      setResetError('');
                      setResetSuccess('');
                    }}
                    className="rounded-lg px-4 py-2 text-sm font-medium text-black bg-gray-100 border border-gray-300 transition-colors hover:bg-gray-200 dark:text-white dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleResetPassword(resettingPasswordFor)}
                    disabled={resetting || !newPassword || newPassword.length < 6}
                    className="rounded-lg px-4 py-2 text-sm font-medium text-white bg-black transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-gray-200"
                  >
                    {resetting ? 'Resetting...' : 'Reset Password'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

