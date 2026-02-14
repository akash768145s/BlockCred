'use client';

import React, { useEffect, useState } from 'react';
import { AuthoritiesTab } from './AuthoritiesTab';
import { StudentsTab } from './StudentsTab';
import { adminService } from '@/services/adminService';

interface UsersTabProps {
    users: any[];
    searchTerm: string;
    filterRole: string;
    filterDepartment: string;
    onSearchChange: (value: string) => void;
    onFilterRoleChange: (value: string) => void;
    onFilterDepartmentChange: (value: string) => void;
    onCreateUser: () => void;
    onApproveUser: (userId: string | number) => Promise<any> | void;
    onViewUser: (user: any) => void;
    onEditUser: (user: any) => void;
    onDeleteUser: (user: any) => void;
}

export const UsersTab: React.FC<UsersTabProps> = ({
    users,
    searchTerm,
    filterRole,
    filterDepartment,
    onSearchChange,
    onFilterRoleChange,
    onFilterDepartmentChange,
    onCreateUser,
    onApproveUser,
    onViewUser,
    onEditUser,
    onDeleteUser,
}) => {
    const [activeSubTab, setActiveSubTab] = useState<'authorities' | 'students'>('authorities');
    const [departments, setDepartments] = useState<any[]>([]);
    const [roles, setRoles] = useState<any[]>([]);

    useEffect(() => {
        const load = async () => {
            try {
                const [d, r] = await Promise.all([
                    adminService.listDepartments(),
                    adminService.listRoles(),
                ]);
                setDepartments(Array.isArray(d) ? d : []);
                setRoles(Array.isArray(r) ? r : []);
            } catch (err) {
                console.error(err);
                setDepartments([]);
                setRoles([]);
            }
        };
        load();
    }, []);

    return (
        <div className="space-y-6">
            <div className="border-b border-white/10 bg-white/5 backdrop-blur-sm rounded-t-xl">
                <nav className="flex space-x-1 px-2 pt-2">
                    <button
                        onClick={() => setActiveSubTab('authorities')}
                        className={`px-5 py-2.5 text-sm font-semibold transition-all rounded-t-lg ${activeSubTab === 'authorities'
                            ? 'bg-white/10 text-white border-t border-x border-white/20'
                            : 'text-indigo-200 hover:text-white'
                            }`}
                    >
                        Authorities
                    </button>
                    <button
                        onClick={() => setActiveSubTab('students')}
                        className={`px-5 py-2.5 text-sm font-semibold transition-all rounded-t-lg ${activeSubTab === 'students'
                            ? 'bg-white/10 text-white border-t border-x border-white/20'
                            : 'text-indigo-200 hover:text-white'
                            }`}
                    >
                        Students
                    </button>
                </nav>
            </div>

            {activeSubTab === 'authorities' && (
                <AuthoritiesTab
                    users={users}
                    searchTerm={searchTerm}
                    filterRole={filterRole}
                    onSearchChange={onSearchChange}
                    onFilterChange={onFilterRoleChange}
                    onCreateUser={onCreateUser}
                    onApproveUser={onApproveUser}
                    onViewUser={onViewUser}
                    onEditUser={onEditUser}
                    onDeleteUser={onDeleteUser}
                    roles={roles}
                />
            )}

            {activeSubTab === 'students' && (
                <StudentsTab
                    users={users}
                    searchTerm={searchTerm}
                    filterDepartment={filterDepartment}
                    onSearchChange={onSearchChange}
                    onFilterDepartmentChange={onFilterDepartmentChange}
                    onCreateUser={() => {
                        // student creation is via registration flow (CreateStudentModal)
                        alert('Create students from the Students registration flow (/register) or add a Student modal here if you want.');
                    }}
                    onApproveUser={onApproveUser}
                    onViewUser={onViewUser}
                    onEditUser={onEditUser}
                    onDeleteUser={onDeleteUser}
                    departments={departments.filter((d: any) => d.academic_department)}
                />
            )}
        </div>
    );
};

