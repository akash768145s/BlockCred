import { User } from '@/types/auth';

const API_BASE_URL = 'http://localhost:8080/api';

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
    role: string;
    department?: string;
    institution?: string;
    club_name?: string;
}

export interface UpdateUserData {
    name?: string;
    email?: string;
    phone?: string;
    role?: string;
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

        const result = await response.json();

        if (!response.ok) {
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

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to update user');
        }

        const result = await response.json();
        return result.data;
    },

    async deleteUser(userId: string | number): Promise<void> {
        const response = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
            method: 'DELETE',
            headers: getAuthHeaders(),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to delete user');
        }
    },

    async deleteCredential(credentialId: string | number): Promise<void> {
        const response = await fetch(`${API_BASE_URL}/certificates/${credentialId}`, {
            method: 'DELETE',
            headers: getAuthHeaders(),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || 'Failed to delete credential');
        }
    },
};

