'use client';

import React from 'react';
import { Search, Plus, GraduationCap, CheckCircle, Clock, Eye, Edit, Trash2 } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { RoleIcon } from './RoleIcon';

interface StudentsTabProps {
    users: any[];
    searchTerm: string;
    filterDepartment: string;
    onSearchChange: (value: string) => void;
    onFilterDepartmentChange: (value: string) => void;
    onCreateUser: () => void;
    onApproveUser: (userId: string | number) => Promise<any> | void;
    onViewUser: (user: any) => void;
    onEditUser: (user: any) => void;
    onDeleteUser: (user: any) => void;
    // Optional dynamic departments from admin config
    departments?: { id?: string; name: string }[];
}

export const StudentsTab: React.FC<StudentsTabProps> = ({
    users,
    searchTerm,
    filterDepartment,
    onSearchChange,
    onFilterDepartmentChange,
    onCreateUser,
    onApproveUser,
    onViewUser,
    onEditUser,
    onDeleteUser,
    departments: dynamicDepartments,
}) => {
    // Department options from admin (academic departments only, passed by parent)
    const departments =
        Array.isArray(dynamicDepartments) && dynamicDepartments.length > 0
            ? [
                  { value: 'all', label: 'All Departments' },
                  ...dynamicDepartments.map((d) => ({
                      value: d.name,
                      label: d.name,
                  })),
              ]
            : [{ value: 'all', label: 'All Departments' }];

    // Filter only students
    const filteredStudents = (Array.isArray(users) ? users : []).filter(user => {
        const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesDepartment = filterDepartment === 'all' ||
            (user.department && user.department.toLowerCase() === filterDepartment.toLowerCase());
        return matchesSearch && matchesDepartment && user.role === 'student';
    });

    return (
        <div className="space-y-6">
            {/* Department Navbar */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-lg shadow-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-white/10 bg-gradient-to-r from-blue-900/50 to-cyan-900/50">
                    <h3 className="text-sm font-semibold text-slate-200 mb-3">Filter by Department</h3>
                    <div className="flex flex-wrap gap-2">
                        {departments.map((dept) => (
                            <button
                                key={dept.value}
                                onClick={() => onFilterDepartmentChange(dept.value)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filterDepartment === dept.value
                                    ? 'bg-blue-600 text-white shadow-md'
                                    : 'bg-white/10 text-slate-300 hover:bg-white/20 border border-white/20'
                                    }`}
                            >
                                {dept.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Search and Filter */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-white/10 p-6 rounded-lg shadow-lg">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search students..."
                                value={searchTerm}
                                onChange={(e) => onSearchChange(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-white/20 rounded-lg text-white placeholder-slate-400 bg-white/10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white/20"
                            />
                        </div>
                    </div>
                    <button
                        onClick={onCreateUser}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Create Student
                    </button>
                </div>
            </div>

            {/* Students Table */}
            {filteredStudents.length > 0 ? (
                <div className="bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-lg shadow-lg overflow-hidden">
                    <div className="px-6 py-4 border-b border-white/10 bg-gradient-to-r from-blue-900/50 to-cyan-900/50">
                        <h3 className="text-lg font-semibold text-white flex items-center">
                            <GraduationCap className="h-5 w-5 mr-2 text-blue-400" />
                            Students ({filteredStudents.length})
                        </h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-white/10">
                            <thead className="bg-slate-900/50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                                        User
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                                        Student ID
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                                        Department
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                                        10th School
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                                        12th School
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                                        Created
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-slate-800/30 divide-y divide-white/10">
                                {filteredStudents.map((user) => (
                                    <tr key={user.id} className="hover:bg-white/5">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-10 w-10">
                                                    <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
                                                        <RoleIcon role={user.role} />
                                                    </div>
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-white">{user.name}</div>
                                                    <div className="text-sm text-slate-400">{user.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                                            {user.student_id || '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                                            {user.department || '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                                            {user.tenth_school || '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                                            {user.twelfth_school || '-'}
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
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                                            {formatDate(user.created_at)}
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
                                                    <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-medium bg-green-100 text-green-700">
                                                        <CheckCircle className="h-3 w-3 mr-1" />
                                                        Approved
                                                    </span>
                                                )}
                                                <button
                                                    onClick={() => onViewUser(user)}
                                                    className="text-blue-600 hover:text-blue-900"
                                                    title="View Details"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => onEditUser(user)}
                                                    className="text-green-600 hover:text-green-900"
                                                    title="Edit User"
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => onDeleteUser(user)}
                                                    className="text-red-600 hover:text-red-900"
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
                    <GraduationCap className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-white mb-2">No students found</h3>
                    <p className="text-sm text-slate-300 mb-4">
                        {searchTerm
                            ? 'Try adjusting your search criteria'
                            : 'Get started by creating a new student'}
                    </p>
                    {!searchTerm && (
                        <button
                            onClick={onCreateUser}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Create Student
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

