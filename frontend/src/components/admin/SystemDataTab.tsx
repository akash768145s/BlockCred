'use client';

import React from 'react';
import { AuthoritiesTab } from './AuthoritiesTab';
import { StudentsTab } from './StudentsTab';

interface SystemDataTabProps {
    users: any[];
    searchTerm: string;
    filterRole: string;
    filterDepartment: string;
    onSearchChange: (value: string) => void;
    onFilterRoleChange: (value: string) => void;
    onFilterDepartmentChange: (value: string) => void;
    onApproveUser: (userId: string | number) => Promise<any> | void;
    onViewUser: (user: any) => void;
    onEditUser: (user: any) => void;
    onDeleteUser: (user: any) => void;
}

export const SystemDataTab: React.FC<SystemDataTabProps> = ({
    users,
    searchTerm,
    filterRole,
    filterDepartment,
    onSearchChange,
    onFilterRoleChange,
    onFilterDepartmentChange,
    onApproveUser,
    onViewUser,
    onEditUser,
    onDeleteUser,
}) => {
    return (
        <div className="space-y-8">
            <section>
                <h2 className="text-sm font-semibold text-indigo-200 mb-3 uppercase tracking-wide">Users</h2>
                <AuthoritiesTab
                    users={users}
                    searchTerm={searchTerm}
                    filterRole={filterRole}
                    onSearchChange={onSearchChange}
                    onFilterChange={onFilterRoleChange}
                    onCreateUser={() => {
                        // creation of issuers still happens via Overview & existing CreateUserModal
                        alert('Use the Overview tab to create new issuing authorities.');
                    }}
                    onApproveUser={onApproveUser}
                    onViewUser={onViewUser}
                    onEditUser={onEditUser}
                    onDeleteUser={onDeleteUser}
                />
            </section>

            <section>
                <h2 className="text-sm font-semibold text-indigo-200 mb-3 uppercase tracking-wide">Students</h2>
                <StudentsTab
                    users={users}
                    searchTerm={searchTerm}
                    filterDepartment={filterDepartment}
                    onSearchChange={onSearchChange}
                    onFilterDepartmentChange={onFilterDepartmentChange}
                    onCreateUser={() => {
                        // creation of students is available from StudentsTab/CreateStudentModal, keep behavior
                        alert('Use the Students section quick actions to create students.');
                    }}
                    onApproveUser={onApproveUser}
                    onViewUser={onViewUser}
                    onEditUser={onEditUser}
                    onDeleteUser={onDeleteUser}
                />
            </section>
        </div>
    );
};

