export type UserRole =
    | 'ssn_main_admin'
    | 'coe'
    | 'department_faculty'
    | 'club_coordinator'
    | 'external_verifier'
    | 'student';

export interface RolePermissions {
    can_onboard_sub_admins: boolean;
    can_deploy_contracts: boolean;
    can_authorize_validators: boolean;
    can_issue_marksheet: boolean;
    can_issue_bonafide: boolean;
    can_issue_noc: boolean;
    can_issue_participation: boolean;
    can_verify_credentials: boolean;
    can_read_only_access: boolean;
    can_manage_users: boolean;
    can_view_all_credentials: boolean;
    can_approve_students: boolean;
}

export interface User {
    id: number;
    name: string;
    email: string;
    phone: string;
    student_id?: string;
    role: UserRole;
    department?: string;
    institution?: string;
    club_name?: string;
    dob?: string;
    school_name?: string;
    father_name?: string;
    aadhar_number?: string;
    tenth_school?: string;
    tenth_marks?: number;
    twelfth_school?: string;
    twelfth_marks?: number;
    cutoff?: number;
    is_active: boolean;
    is_approved: boolean;
    node_assigned: boolean;
    created_at: string;
    updated_at: string;
    permissions: RolePermissions;
}

export interface LoginResponse {
    success: boolean;
    message: string;
    data: {
        token: string;
        user_id: number;
        role: UserRole;
        role_name: string;
        permissions: RolePermissions;
    };
    user: {
        id: number;
        name: string;
        role: UserRole;
        role_name: string;
    };
}

export interface DashboardData {
    user_role: UserRole;
    total_users?: number;
    pending_users?: number;
    total_credentials?: number;
    issued_today?: number;
    verified_today?: number;
    recent_activity?: ActivityLog[];
    quick_actions: QuickAction[];
}

export interface ActivityLog {
    id: number;
    user_id: number;
    user_name: string;
    action: string;
    details: string;
    timestamp: string;
    ip_address?: string;
}

export interface QuickAction {
    id: string;
    title: string;
    description: string;
    icon: string;
    route: string;
    permission: string;
}

export interface Credential {
    id: number;
    type: string;
    title: string;
    institution: string;
    student_id?: string;
    student_name?: string;
    department?: string;
    semester?: string;
    subject?: string;
    marks?: string;
    grade?: string;
    event_name?: string;
    event_date?: string;
    position?: string;
    issued_date: string;
    valid_from?: string;
    valid_until?: string;
    status: string;
    description: string;
    issued_by: string;
    verified_by?: string;
    verified_at?: string;
    blockchain_tx?: string;
    qr_code?: string;
}

export interface CredentialRequest {
    student_id: string;
    type: string;
    title: string;
    institution: string;
    department?: string;
    semester?: string;
    subject?: string;
    marks?: string;
    grade?: string;
    event_name?: string;
    event_date?: string;
    position?: string;
    description: string;
    issued_by: string;
    valid_from: string;
    valid_until?: string;
}

export const ROLE_DISPLAY_NAMES: Record<UserRole, string> = {
    ssn_main_admin: 'SSN Main Administrator',
    coe: 'Controller of Examinations',
    department_faculty: 'Department Faculty',
    club_coordinator: 'Club Coordinator',
    external_verifier: 'External Verifier',
    student: 'Student',
};

export const ROLE_COLORS: Record<UserRole, string> = {
    ssn_main_admin: 'bg-red-100 text-red-800',
    coe: 'bg-blue-100 text-blue-800',
    department_faculty: 'bg-green-100 text-green-800',
    club_coordinator: 'bg-purple-100 text-purple-800',
    external_verifier: 'bg-yellow-100 text-yellow-800',
    student: 'bg-gray-100 text-gray-800',
};
