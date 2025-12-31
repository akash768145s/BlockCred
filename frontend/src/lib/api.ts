import { User, Credential, UserRole } from '@/types/auth';

const API_BASE_URL = 'http://localhost:8080/api';

export interface StudentProfile {
    id: string;
    name: string;
    student_id: string;
    email: string;
    department: string;
    semester: string;
    graduation_year: string;
    is_verified: boolean;
}

export interface StudentCredentials {
    credentials: Credential[];
    profile: StudentProfile;
}

export interface DashboardStats {
    total_users: number;
    pending_users: number;
    total_credentials: number;
    issued_today: number;
    verified_today: number;
    total_issuers?: number;
    total_students?: number;
}

export class ApiService {
    private static getAuthHeaders(): HeadersInit {
        const token = localStorage.getItem('token');
        return {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        };
    }

    static async fetchUsers(): Promise<User[]> {
        const response = await fetch(`${API_BASE_URL}/users`, {
            headers: this.getAuthHeaders(),
        });

        if (!response.ok) {
            if (response.status === 401) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                throw new Error('Unauthorized: Invalid or expired token');
            }
            throw new Error(`Failed to fetch users: ${response.statusText}`);
        }

        const data = await response.json();
        return Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : [];
    }

    static async fetchCredentials(): Promise<Credential[]> {
        // Try /api/certificates first (new endpoint), fallback to /api/credentials
        let response = await fetch(`${API_BASE_URL}/certificates`, {
            headers: this.getAuthHeaders(),
        });

        // If certificates endpoint fails, try credentials endpoint
        if (!response.ok && response.status !== 401) {
            response = await fetch(`${API_BASE_URL}/credentials`, {
                headers: this.getAuthHeaders(),
            });
        }

        if (!response.ok) {
            if (response.status === 401) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                throw new Error('Unauthorized: Invalid or expired token');
            }
            throw new Error(`Failed to fetch credentials: ${response.statusText}`);
        }

        const data = await response.json();
        return Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : [];
    }

    static async fetchStudentCredentials(studentId: string): Promise<StudentCredentials> {
        const response = await fetch(`${API_BASE_URL}/dashboard/students/${studentId}/credentials`, {
            headers: this.getAuthHeaders(),
        });

        if (!response.ok) {
            if (response.status === 401) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                throw new Error('Unauthorized: Invalid or expired token');
            }
            throw new Error(`Failed to fetch student credentials: ${response.statusText}`);
        }

        const data = await response.json();
        return data.data;
    }

    static async fetchStudentData(userId: number | string): Promise<any> {
        const response = await fetch(`${API_BASE_URL}/dashboard/students/${userId}`, {
            headers: this.getAuthHeaders(),
        });

        if (!response.ok) {
            if (response.status === 401) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                throw new Error('Unauthorized: Invalid or expired token');
            }
            throw new Error(`Failed to fetch student data: ${response.statusText}`);
        }

        const data = await response.json();
        // Return student data with certificates
        return {
            ...data.data.user,
            certificates: data.data.certificates
        };
    }

    static async approveUser(userId: number): Promise<void> {
        const response = await fetch(`${API_BASE_URL}/users/${userId}/approve`, {
            method: 'POST',
            headers: this.getAuthHeaders(),
        });

        if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            throw new Error(data.message || `Failed to approve user: ${response.statusText}`);
        }
    }

    static async getDashboardStats(): Promise<DashboardStats> {
        const response = await fetch(`${API_BASE_URL}/dashboard/stats`, {
            headers: this.getAuthHeaders(),
        });

        if (!response.ok) {
            if (response.status === 401) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                throw new Error('Unauthorized: Invalid or expired token');
            }
            throw new Error(`Failed to fetch dashboard stats: ${response.statusText}`);
        }

        const data = await response.json();
        return data.data;
    }
}
