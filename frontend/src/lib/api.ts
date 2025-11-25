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
        // Check if token exists before making requests
        const token = localStorage.getItem('token');
        if (!token) {
            console.warn('No token found, returning default stats');
            return {
                total_users: 0,
                pending_users: 0,
                total_credentials: 0,
                issued_today: 0,
                verified_today: 0,
            };
        }

        try {
            // Fetch users and credentials separately to handle errors gracefully
            let users: User[] = [];
            let credentials: Credential[] = [];

            try {
                users = await this.fetchUsers();
            } catch (err: any) {
                console.error('Error fetching users for stats:', err);
                // If it's an auth error, clear storage and return defaults
                if (err.message?.includes('Unauthorized')) {
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    // Redirect will be handled by the component
                    return {
                        total_users: 0,
                        pending_users: 0,
                        total_credentials: 0,
                        issued_today: 0,
                        verified_today: 0,
                    };
                }
            }

            try {
                credentials = await this.fetchCredentials();
            } catch (err: any) {
                console.error('Error fetching credentials for stats:', err);
                // If it's an auth error, clear storage and return defaults
                if (err.message?.includes('Unauthorized')) {
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    // Use users we already fetched, but return defaults for credentials
                    return {
                        total_users: users.length || 0,
                        pending_users: users.filter((u: any) => !u.is_approved && !u.is_active).length || 0,
                        total_credentials: 0,
                        issued_today: 0,
                        verified_today: 0,
                    };
                }
            }

            const today = new Date().toISOString().split('T')[0];

            // Handle different date field names (issued_date vs issued_at)
            const issuedToday = credentials.filter((c: any) => {
                const issuedDate = c.issued_date || c.issued_at;
                if (!issuedDate) return false;
                // Handle both date string and ISO date formats
                const dateStr = typeof issuedDate === 'string' 
                    ? issuedDate.split('T')[0] 
                    : new Date(issuedDate).toISOString().split('T')[0];
                return dateStr === today;
            }).length;

            const verifiedToday = credentials.filter((c: any) => {
                const verifiedAt = c.verified_at;
                if (!verifiedAt) return false;
                const dateStr = typeof verifiedAt === 'string' 
                    ? verifiedAt.split('T')[0] 
                    : new Date(verifiedAt).toISOString().split('T')[0];
                return c.status === 'verified' && dateStr === today;
            }).length;

            return {
                total_users: users.length || 0,
                pending_users: users.filter((u: any) => !u.is_approved && !u.is_active).length || 0,
                total_credentials: credentials.length || 0,
                issued_today: issuedToday,
                verified_today: verifiedToday,
            };
        } catch (error) {
            console.error('Unexpected error fetching dashboard stats:', error);
            // Return default stats on error
            return {
                total_users: 0,
                pending_users: 0,
                total_credentials: 0,
                issued_today: 0,
                verified_today: 0,
            };
        }
    }
}
