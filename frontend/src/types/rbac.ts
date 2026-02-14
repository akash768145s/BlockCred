export interface Role {
    id: string;
    name: string;
    description?: string;
    department_id?: string | null;
    can_issue_credentials: boolean;
    permissions: string[];
    dashboard_route?: string;
    created_at: string;
}

export interface Department {
    id: string;
    name: string;
    description?: string;
    academic_department?: boolean;
    created_at: string;
}

export type CredentialFieldType = 'text' | 'number' | 'date' | 'select' | 'bool';

export interface CredentialFieldConfig {
    key: string;
    label: string;
    type: CredentialFieldType;
    required: boolean;
    help_text?: string;
    options?: string[];      // for select
    visible_for?: string[];  // optional: role names
}

export interface CredentialTypeConfig {
    id: string;
    name: string;
    description?: string;
    issuer_role_ids: string[];
    fields?: CredentialFieldConfig[];
    created_at: string;
}

