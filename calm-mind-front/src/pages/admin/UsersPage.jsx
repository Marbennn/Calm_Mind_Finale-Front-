import React, { useState, useEffect } from 'react';
import AdminSidebar from '../../components/admin/AdminSidebar';
import AdminHeader from '../../components/admin/AdminHeader';
import { SearchIcon, X } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

const UsersPage = () => {
  const { users, usersLoading, usersError, fetchAllUsers } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredUsers, setFilteredUsers] = useState([]);

  useEffect(() => {
    fetchAllUsers();
  }, [fetchAllUsers]);

  // Handle search
  useEffect(() => {
    const filtered = (users || []).filter(user => {
      const name = (user?.name || [user?.firstName, user?.lastName].filter(Boolean).join(' ')).toLowerCase();
      const sid = (user?.studentId || '').toString().toLowerCase();
      return name.includes(searchQuery.toLowerCase()) || sid.includes(searchQuery.toLowerCase());
    });
    setFilteredUsers(filtered);
  }, [searchQuery, users]);

  return (
    <div className="flex h-screen">
      <AdminSidebar />
      <div className="flex-1 overflow-hidden">
        <AdminHeader title="User Management" tips="Search users by name or student ID, or use filters to narrow down the list." />
        <main className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div className="text-sm text-gray-600">
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-gray-100 text-gray-800 font-medium">
                Total: {users?.length || 0}
              </span>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative mb-6">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <SearchIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent sm:text-sm"
              placeholder="Search by name or student ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search"
                  className="p-1 rounded-md text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student ID</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Year Level</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {usersLoading ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 text-sm text-gray-500 text-center">Loading users...</td>
                    </tr>
                  ) : usersError ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 text-sm text-red-500 text-center">{usersError}</td>
                    </tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 text-sm text-gray-500 text-center">
                        No users found.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user?.studentId || user?.id || user?._id}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user?.name || [user?.firstName, user?.lastName].filter(Boolean).join(' ')}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user?.yearLevel || user?.level || (user?.profile && user?.profile.level) || ''}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user?.department || (user?.profile && user?.profile.department) || ''}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user?.course || ''}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user?.role}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default UsersPage;