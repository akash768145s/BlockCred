'use client';

import React from 'react';
import { Search, Plus, Shield, CheckCircle, Clock, Eye, Edit, Trash2 } from 'lucide-react';
import { getRoleDisplayName } from '@/lib/utils';
import { RoleIcon } from './RoleIcon';

interface AuthoritiesTabProps {
    users: any[];
    searchTerm: string;
    filterRole: string;
    onSearchChange: (value: string) => void;
    onFilterChange: (value: string) => void;
    onCreateUser: () => void;
    onApproveUser: (userId: string | number) => Promise<any> | void;
    onViewUser: (user: any) => void;
    onEditUser: (user: any) => void;
    onDeleteUser: (user: any) => void;
    /** Roles from admin dashboard (GET /api/admin/roles). Used for filter dropdown. */
    roles?: { id: string; name: string }[];
}

export const AuthoritiesTab: React.FC<AuthoritiesTabProps> = ({
    users,
    searchTerm,
    filterRole,
    onSearchChange,
    onFilterChange,
    onCreateUser,
    onApproveUser,
    onViewUser,
    onEditUser,
    onDeleteUser,
    roles: adminRoles,
}) => {
    // Treat everyone except students as authorities/verifiers
    const authorityUsers = (Array.isArray(users) ? users : []).filter((user) => user.role !== 'student');

    // Role filter options: from admin-created roles only
    const roleOptions = Array.isArray(adminRoles) && adminRoles.length > 0
        ? adminRoles
        : [];

    const filteredAuthorities = authorityUsers.filter((user) => {
        const matchesSearch =
            user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesRole =
            filterRole === 'all' ||
            (user.role_name && user.role_name === filterRole) ||
            (user.role && user.role === filterRole);

        return matchesSearch && matchesRole;
    });

    return (
        <div className="space-y-6">
            {/* Search and Filter */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-white/10 p-6 rounded-lg shadow-lg">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search issuing authorities..."
                                value={searchTerm}
                                onChange={(e) => onSearchChange(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-white/20 rounded-lg text-white placeholder-slate-400 bg-white/10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white/20"
                            />
                        </div>
                    </div>
                    <div className="md:w-56">
                        <select
                            value={filterRole}
                            onChange={(e) => onFilterChange(e.target.value)}
                            className="w-full px-3 py-2 border border-white/20 rounded-lg text-white bg-white/10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="all">All Roles</option>
                            {roleOptions.map((r) => (
                                <option key={r.id} value={r.name} className="bg-slate-800">
                                    {r.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <button
                        onClick={onCreateUser}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Create Authority
                    </button>
                </div>
            </div>

            {/* Issuing Authorities Table */}
            {filteredAuthorities.length > 0 ? (
                <div className="bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-lg shadow-lg overflow-hidden">
                    <div className="px-6 py-4 border-b border-white/10 bg-gradient-to-r from-indigo-900/50 to-purple-900/50">
                        <h3 className="text-lg font-semibold text-white flex items-center">
                            <Shield className="h-5 w-5 mr-2 text-indigo-400" />
                            Issuing Authorities ({filteredAuthorities.length})
                        </h3>
                        <p className="text-xs text-slate-300 mt-1">COE, Faculty, and Club Coordinators</p>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-white/10">
                            <thead className="bg-slate-900/50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                                        User
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                                        Role
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-slate-800/30 divide-y divide-white/10">
                                {filteredAuthorities.map((user) => (
                                    <tr key={user.id} className="hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-10 w-10">
                                                    <div className="h-10 w-10 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
                                                        <RoleIcon role={user.role} />
                                                    </div>
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-white">{user.name}</div>
                                                    <div className="text-sm text-slate-400">{user.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                                                {user.role_name || getRoleDisplayName(user.role)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center space-x-2">
                                                {user.is_active ? (
                                                    <CheckCircle className="h-4 w-4 text-green-400" />
                                                ) : (
                                                    <Clock className="h-4 w-4 text-yellow-400" />
                                                )}
                                                <span className={`text-sm ${user.is_active ? 'text-green-400' : 'text-yellow-400'}`}>
                                                    {user.is_active ? 'Active' : 'Pending'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <div className="flex items-center space-x-2">
                                                {!user.is_approved && (
                                                    <button
                                                        onClick={() => onApproveUser(user.id)}
                                                        className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors shadow-sm"
                                                        title="Approve User"
                                                    >
                                                        <CheckCircle className="h-3 w-3 mr-1" />
                                                        Approve
                                                    </button>
                                                )}
                                                {user.is_approved && (
                                                    <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-medium bg-green-500/20 text-green-300 border border-green-500/30">
                                                        <CheckCircle className="h-3 w-3 mr-1" />
                                                        Approved
                                                    </span>
                                                )}
                                                <button
                                                    onClick={() => onViewUser(user)}
                                                    className="text-blue-400 hover:text-blue-300 transition-colors"
                                                    title="View Details"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => onEditUser(user)}
                                                    className="text-green-400 hover:text-green-300 transition-colors"
                                                    title="Edit User"
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => onDeleteUser(user)}
                                                    className="text-red-400 hover:text-red-300 transition-colors"
                                                    title="Delete User"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-lg shadow-lg p-12 text-center">
                    <Shield className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-white mb-2">No issuing authorities found</h3>
                    <p className="text-sm text-slate-300 mb-4">
                        {searchTerm || filterRole !== 'all'
                            ? 'Try adjusting your search or filter criteria'
                            : 'Get started by creating a new issuing authority'}
                    </p>
                    {!searchTerm && filterRole === 'all' && (
                        <button
                            onClick={onCreateUser}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Create Authority
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

