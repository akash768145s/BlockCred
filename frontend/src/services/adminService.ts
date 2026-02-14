import { User } from '@/types/auth';

const API_BASE_URL = 'http://localhost:8080/api';

const safeJson = async (response: Response): Promise<any> => {
    try {
        return await response.json();
    } catch {
        return {};
    }
};

const getAuthHeaders = (): HeadersInit => {
    const token = localStorage.getItem('token');
    return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
    };
};

export interface CreateUserData {
    name: string;
    email: string;
    phone: string;
    password: string;
    role?: string;
    role_id?: string;
    department?: string;
    institution?: string;
    club_name?: string;
}

export interface UpdateUserData {
    name?: string;
    email?: string;
    phone?: string;
    role?: string;
    role_id?: string;
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
}

export const adminService = {
    async createUser(data: CreateUserData): Promise<{ success: boolean; message: string }> {
        const response = await fetch(`${API_BASE_URL}/admin/onboard`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(data),
        });

        const result = await safeJson(response);
        if (!response.ok || result.success === false) {
            throw new Error(result.message || 'Failed to create user');
        }

        return { success: true, message: 'User created successfully!' };
    },

    async updateUser(userId: string | number, data: UpdateUserData): Promise<User> {
        const response = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(data),
        });

        const result = await safeJson(response);
        if (!response.ok || result.success === false) {
            throw new Error(result.message || 'Failed to update user');
        }
        return result.data as User;
    },

    async deleteUser(userId: string | number): Promise<void> {
        const response = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
            method: 'DELETE',
            headers: getAuthHeaders(),
        });

        const errorData = await safeJson(response);
        if (!response.ok || errorData.success === false) {
            throw new Error(errorData.message || 'Failed to delete user');
        }
    },

    async deleteCredential(credentialId: string | number): Promise<void> {
        const response = await fetch(`${API_BASE_URL}/certificates/${credentialId}`, {
            method: 'DELETE',
            headers: getAuthHeaders(),
        });

        const errorData = await safeJson(response);
        if (!response.ok || errorData.success === false) {
            throw new Error(errorData.message || 'Failed to delete credential');
        }
    },

    // === RBAC configuration ===

    async listRoles() {
        const response = await fetch(`${API_BASE_URL}/admin/roles`, {
            headers: getAuthHeaders(),
        });
        const result = await safeJson(response);
        if (!response.ok || !result.success) {
            throw new Error(result.message || 'Failed to fetch roles');
        }
        return result.data;
    },

    async createRole(data: {
        name: string;
        description?: string;
        department_id?: string;
        can_issue_credentials: boolean;
        permissions: string[];
        dashboard_route?: string;
    }) {
        const response = await fetch(`${API_BASE_URL}/admin/roles`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(data),
        });
        const result = await safeJson(response);
        if (!response.ok || !result.success) {
            throw new Error(result.message || 'Failed to create role');
        }
        return result.data;
    },

    async updateRole(id: string, data: {
        name: string;
        description?: string;
        department_id?: string;
        can_issue_credentials: boolean;
        permissions: string[];
        dashboard_route?: string;
    }) {
        const response = await fetch(`${API_BASE_URL}/admin/roles/${id}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(data),
        });
        const result = await safeJson(response);
        if (!response.ok || !result.success) {
            throw new Error(result.message || 'Failed to update role');
        }
        return result.data;
    },

    async deleteRole(id: string) {
        const response = await fetch(`${API_BASE_URL}/admin/roles/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders(),
        });
        const result = await safeJson(response);
        if (!response.ok || result.success === false) {
            throw new Error(result.message || 'Failed to delete role');
        }
    },

    async listDepartments() {
        const response = await fetch(`${API_BASE_URL}/admin/departments`, {
            headers: getAuthHeaders(),
        });
        const result = await safeJson(response);
        if (!response.ok || !result.success) {
            throw new Error(result.message || 'Failed to fetch departments');
        }
        return result.data;
    },

    /** Public: academic departments only, no auth (e.g. registration). */
    async listPublicDepartments() {
        const response = await fetch(`${API_BASE_URL}/public/departments`, {
            headers: { 'Content-Type': 'application/json' },
        });
        const result = await safeJson(response);
        if (!response.ok || !result.success) {
            throw new Error(result.message || 'Failed to fetch departments');
        }
        return result.data;
    },

    async createDepartment(data: { name: string; description?: string; academic_department?: boolean }) {
        const response = await fetch(`${API_BASE_URL}/admin/departments`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(data),
        });
        const result = await safeJson(response);
        if (!response.ok || !result.success) {
            throw new Error(result.message || 'Failed to create department');
        }
        return result.data;
    },

    async updateDepartment(id: string, data: { name: string; description?: string; academic_department: boolean }) {
        const response = await fetch(`${API_BASE_URL}/admin/departments/${id}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(data),
        });
        const result = await safeJson(response);
        if (!response.ok || !result.success) {
            throw new Error(result.message || 'Failed to update department');
        }
        return result.data;
    },

    async deleteDepartment(id: string) {
        const response = await fetch(`${API_BASE_URL}/admin/departments/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders(),
        });
        const result = await safeJson(response);
        if (!response.ok || result.success === false) {
            throw new Error(result.message || 'Failed to delete department');
        }
    },

    async listCredentialTypes() {
        const response = await fetch(`${API_BASE_URL}/admin/credential-types`, {
            headers: getAuthHeaders(),
        });
        const result = await safeJson(response);
        if (!response.ok || !result.success) {
            throw new Error(result.message || 'Failed to fetch credential types');
        }
        return result.data;
    },

    /** Public: credential types with id, name, fields for display (e.g. student dashboard). No auth. */
    async listPublicCredentialTypes() {
        const response = await fetch(`${API_BASE_URL}/public/credential-types`, {
            headers: { 'Content-Type': 'application/json' },
        });
        const result = await safeJson(response);
        if (!response.ok || !result.success) {
            throw new Error(result.message || 'Failed to fetch credential types');
        }
        return result.data;
    },

    /** Credential types current user (issuer) is allowed to issue. */
    async listIssuerCredentialTypes() {
        const response = await fetch(`${API_BASE_URL}/issuer/credential-types`, {
            headers: getAuthHeaders(),
        });
        const result = await safeJson(response);
        if (!response.ok || !result.success) {
            throw new Error(result.message || 'Failed to fetch issuer credential types');
        }
        return result.data;
    },

    async createCredentialType(data: {
        name: string;
        description?: string;
        role_ids: string[];
        fields?: import('@/types/rbac').CredentialFieldConfig[];
    }) {
        const response = await fetch(`${API_BASE_URL}/admin/credential-types`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(data),
        });
        const result = await safeJson(response);
        if (!response.ok || !result.success) {
            throw new Error(result.message || 'Failed to create credential type');
        }
        return result.data;
    },

    async updateCredentialType(id: string, data: {
        name: string;
        description?: string;
        role_ids: string[];
        fields?: import('@/types/rbac').CredentialFieldConfig[];
    }) {
        const response = await fetch(`${API_BASE_URL}/admin/credential-types/${id}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(data),
        });
        const result = await safeJson(response);
        if (!response.ok || !result.success) {
            throw new Error(result.message || 'Failed to update credential type');
        }
        return result.data;
    },

    async deleteCredentialType(id: string) {
        const response = await fetch(`${API_BASE_URL}/admin/credential-types/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders(),
        });
        const result = await safeJson(response);
        if (!response.ok || result.success === false) {
            throw new Error(result.message || 'Failed to delete credential type');
        }
    },
};

