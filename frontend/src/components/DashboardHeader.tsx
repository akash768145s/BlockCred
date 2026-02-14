'use client';

import React, { useEffect, useState } from 'react';
import { getRoleTheme } from '@/lib/roleTheme';
import { ROLE_DISPLAY_NAMES } from '@/types/auth';
import type { User } from '@/types/auth';
import type { Role } from '@/types/rbac';
import { adminService } from '@/services/adminService';

/** Legacy role enum -> dashboard route (used to match admin Role.dashboard_route). */
const LEGACY_ROLE_TO_ROUTE: Record<string, string> = {
    ssn_main_admin: '/admin',
    coe: '/coe',
    department_faculty: '/faculty',
    club_coordinator: '/club',
    student: '/student',
    external_verifier: '/verifier',
    student_verifier: '/student-verifier',
};

interface DashboardHeaderProps {
    user: Pick<User, 'name' | 'email' | 'role' | 'role_id' | 'role_name' | 'department'> | null;
    tagline?: string;
    onLogout: () => void;
    maxWidth?: string;
}

function findRoleForUser(roles: Role[], user: NonNullable<DashboardHeaderProps['user']>): Role | undefined {
    if (!roles.length) return undefined;
    if (user.role_id) {
        const byId = roles.find((r) => String(r.id) === String(user.role_id));
        if (byId) return byId;
    }
    if (user.role_name?.trim()) {
        const byName = roles.find((r) => r.name?.toLowerCase() === user.role_name?.toLowerCase());
        if (byName) return byName;
    }
    const legacyDisplayName = ROLE_DISPLAY_NAMES[user.role as keyof typeof ROLE_DISPLAY_NAMES];
    if (legacyDisplayName) {
        const byDisplayName = roles.find((r) => r.name?.toLowerCase() === legacyDisplayName.toLowerCase());
        if (byDisplayName) return byDisplayName;
    }
    const route = LEGACY_ROLE_TO_ROUTE[user.role];
    if (route) {
        return roles.find((r) => r.dashboard_route?.toLowerCase() === route.toLowerCase());
    }
    return undefined;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
    user,
    tagline,
    onLogout,
    maxWidth = 'max-w-7xl',
}) => {
    const role = user?.role ?? 'student';
    const theme = getRoleTheme(role);
    const Icon = theme.Icon;
    const [resolvedRole, setResolvedRole] = useState<Role | null>(null);

    useEffect(() => {
        if (!user) {
            setResolvedRole(null);
            return;
        }
        // Students (and other non-admin roles) get 403 on GET /api/admin/roles — skip fetch and use theme.
        if (user.role === 'student') {
            setResolvedRole(null);
            return;
        }
        let cancelled = false;
        adminService
            .listRoles()
            .then((list: Role[]) => {
                if (cancelled || !Array.isArray(list)) return;
                const found = findRoleForUser(list, user);
                setResolvedRole(found ?? null);
            })
            .catch(() => setResolvedRole(null));
        return () => {
            cancelled = true;
        };
    }, [user?.id, user?.role, user?.role_id, user?.role_name]);

    const legacyRoleEnums = ['ssn_main_admin', 'coe', 'department_faculty', 'club_coordinator', 'external_verifier', 'student_verifier', 'student'];
    const isLegacyEnum = (s: string) => legacyRoleEnums.includes(s?.toLowerCase());
    const roleName =
        resolvedRole?.name ??
        (user?.role_name && !isLegacyEnum(user.role_name) ? user.role_name : null) ??
        theme.displayName;
    const roleDescription = tagline ?? ((resolvedRole?.description?.trim() || '') || theme.tagline);

    return (
        <header className="border-b border-white/10 bg-white/5 backdrop-blur-sm">
            <div className={`${maxWidth} mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between`}>
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl border border-white/20 bg-white/10 flex items-center justify-center shadow-lg">
                        <Icon className={`h-6 w-6 ${theme.iconColor}`} />
                    </div>
                    <div>
                        <p className={`text-[10px] uppercase tracking-[0.4em] ${theme.brandAccent} font-semibold`}>
                            BlockCred
                        </p>
                        <h1 className="text-xl font-semibold text-white mt-1">
                            {roleName} Dashboard
                        </h1>
                        <p className="text-xs text-indigo-200">
                            {roleDescription}
                        </p>
                        {(user?.name || user?.email || user?.department) && (
                            <p className="text-[11px] text-slate-400 mt-1.5">
                                {[user.name, user.email, user.department].filter(Boolean).join(' · ')}
                            </p>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${theme.badgeBg} ${theme.badgeText} border ${theme.badgeBorder}`}>
                        {roleName}
                    </span>
                    <button
                        onClick={onLogout}
                        className="px-4 py-2 text-xs font-semibold text-white border border-white/20 rounded-lg hover:bg-white/10 transition-all"
                    >
                        Logout
                    </button>
                </div>
            </div>
        </header>
    );
};
