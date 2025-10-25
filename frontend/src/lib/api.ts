import { User, Credential, UserRole } from '@/types/auth';

const API_BASE_URL = 'http://localhost:8080/api';

export interface StudentProfile {
    id: number;
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
        const response = await fetch(`${API_BASE_URL}/credentials`, {
            headers: this.getAuthHeaders(),
        });

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
        // Since there's no specific student credentials endpoint, we'll use the existing endpoints
        // and create a mock response for now
        const [usersResponse, credentialsResponse] = await Promise.all([
            fetch(`${API_BASE_URL}/users`, {
                headers: this.getAuthHeaders(),
            }),
            fetch(`${API_BASE_URL}/credentials`, {
                headers: this.getAuthHeaders(),
            })
        ]);

        if (!usersResponse.ok || !credentialsResponse.ok) {
            throw new Error(`Failed to fetch student credentials: ${usersResponse.statusText || credentialsResponse.statusText}`);
        }

        const usersData = await usersResponse.json();
        const credentialsData = await credentialsResponse.json();

        if (!usersData.success || !credentialsData.success) {
            throw new Error('Failed to fetch data');
        }

        // Find the user with the matching student ID
        const users = Array.isArray(usersData.data) ? usersData.data : [];
        const user = users.find((u: any) => u.student_id === studentId);

        if (!user) {
            throw new Error('Student not found');
        }

        // Filter credentials for this student
        const credentials = Array.isArray(credentialsData.data) ? credentialsData.data : [];
        const studentCredentials = credentials.filter((cred: any) => cred.student_id === studentId);

        return {
            credentials: studentCredentials,
            profile: {
                id: user.id,
                name: user.name,
                student_id: user.student_id || '',
                email: user.email,
                department: user.department || '',
                semester: user.semester || '',
                graduation_year: user.graduation_year || '',
                is_verified: user.is_approved || false,
            },
        };
    }

    static async fetchStudentData(userId: number): Promise<any> {
        // Fetch both user data and credentials
        const [usersResponse, credentialsResponse] = await Promise.all([
            fetch(`${API_BASE_URL}/users`, {
                headers: this.getAuthHeaders(),
            }),
            fetch(`${API_BASE_URL}/credentials`, {
                headers: this.getAuthHeaders(),
            })
        ]);

        if (!usersResponse.ok || !credentialsResponse.ok) {
            if (usersResponse.status === 401 || credentialsResponse.status === 401) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                throw new Error('Unauthorized: Invalid or expired token');
            }
            throw new Error(`Failed to fetch student data: ${usersResponse.statusText || credentialsResponse.statusText}`);
        }

        const usersData = await usersResponse.json();
        const credentialsData = await credentialsResponse.json();

        if (!usersData.success || !credentialsData.success) {
            throw new Error('Failed to fetch data');
        }

        // Find the user with the matching ID
        const users = Array.isArray(usersData.data) ? usersData.data : [];
        const student = users.find((user: any) => user.id === userId);

        if (!student) {
            throw new Error('Student not found');
        }

        // Filter credentials for this student
        const credentials = Array.isArray(credentialsData.data) ? credentialsData.data : [];
        const studentCredentials = credentials.filter((cred: any) => cred.student_id === student.student_id);

        // Return student data with certificates
        return {
            ...student,
            certificates: studentCredentials
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
        const [users, credentials] = await Promise.all([
            this.fetchUsers(),
            this.fetchCredentials(),
        ]);

        const today = new Date().toISOString().split('T')[0];

        return {
            total_users: users.length,
            pending_users: users.filter(u => !u.is_approved).length,
            total_credentials: credentials.length,
            issued_today: credentials.filter(c => c.issued_date === today).length,
            verified_today: credentials.filter(c => c.status === 'verified' && c.verified_at?.startsWith(today)).length,
        };
    }
}
