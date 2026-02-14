import type { UserRole } from '@/types/auth';
import { ROLE_DISPLAY_NAMES } from '@/types/auth';
import { LucideIcon, Shield, ShieldCheck, UserCheck, FileText, GraduationCap, Award, User } from 'lucide-react';

/** Role-only accents for header (badge + BlockCred label). Rest of app uses same indigo theme. */
export interface RoleDashboardTheme {
    displayName: string;
    tagline: string;
    /** Role badge pill only */
    badgeBg: string;
    badgeText: string;
    badgeBorder: string;
    /** BlockCred label + icon accent only */
    brandAccent: string;
    iconColor: string;
    Icon: LucideIcon;
}

const theme = (
    badgeBg: string,
    badgeText: string,
    badgeBorder: string,
    brandAccent: string,
    iconColor: string,
    Icon: LucideIcon,
    displayName: string,
    tagline: string
): RoleDashboardTheme => ({
    displayName,
    tagline,
    badgeBg,
    badgeText,
    badgeBorder,
    brandAccent,
    iconColor,
    Icon,
});

export const ROLE_DASHBOARD_THEMES: Record<UserRole, RoleDashboardTheme> = {
    ssn_main_admin: theme(
        'bg-red-500/20', 'text-red-200', 'border-red-400/30',
        'text-red-300', 'text-red-400',
        Shield, ROLE_DISPLAY_NAMES.ssn_main_admin,
        'Manage users, roles, departments & credentials'
    ),
    coe: theme(
        'bg-blue-500/20', 'text-blue-200', 'border-blue-400/30',
        'text-blue-300', 'text-blue-400',
        FileText, ROLE_DISPLAY_NAMES.coe,
        'Manage academic credentials & results'
    ),
    department_faculty: theme(
        'bg-emerald-500/20', 'text-emerald-200', 'border-emerald-400/30',
        'text-emerald-300', 'text-emerald-400',
        GraduationCap, ROLE_DISPLAY_NAMES.department_faculty,
        'Manage student certificates & documents'
    ),
    club_coordinator: theme(
        'bg-purple-500/20', 'text-purple-200', 'border-purple-400/30',
        'text-purple-300', 'text-purple-400',
        Award, ROLE_DISPLAY_NAMES.club_coordinator,
        'Manage participation certificates & achievements'
    ),
    external_verifier: theme(
        'bg-teal-500/20', 'text-teal-200', 'border-teal-400/30',
        'text-teal-300', 'text-teal-400',
        ShieldCheck, ROLE_DISPLAY_NAMES.external_verifier,
        'View & verify credentials · Manage student data'
    ),
    student_verifier: theme(
        'bg-amber-500/20', 'text-amber-200', 'border-amber-400/30',
        'text-amber-300', 'text-amber-400',
        UserCheck, ROLE_DISPLAY_NAMES.student_verifier,
        'Review and approve new student registrations'
    ),
    student: theme(
        'bg-slate-500/20', 'text-slate-200', 'border-slate-400/30',
        'text-slate-300', 'text-slate-400',
        User, ROLE_DISPLAY_NAMES.student,
        'Your credentials and verification'
    ),
};

export function getRoleTheme(role: UserRole | string | undefined): RoleDashboardTheme {
    const r = (role || 'student') as UserRole;
    return ROLE_DASHBOARD_THEMES[r] ?? ROLE_DASHBOARD_THEMES.student;
}
