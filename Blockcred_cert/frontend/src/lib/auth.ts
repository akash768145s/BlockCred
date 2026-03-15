import { UserRole, LoginResponse, User } from '@/types/auth';

const API_BASE_URL = 'http://localhost:8080/api';

export interface LoginCredentials {
    username: string;
    password: string;
}

export interface RegisterData {
    name: string;
    email: string;
    phone: string;
    password: string;
    dob: string;
    school_name: string;
    photo: File | null;
    father_name: string;
    aadhar_number: string;
    tenth_school: string;
    tenth_marks: number;
    twelfth_school: string;
    twelfth_marks: number;
    twelfth_marksheet: File | null;
    cutoff: number;
}

export interface CreateUserData {
    name: string;
    email: string;
    phone: string;
    password: string;
    role: UserRole;
    department?: string;
    institution?: string;
    club_name?: string;
}

export class AuthService {
    static async login(credentials: LoginCredentials): Promise<LoginResponse> {
        const response = await fetch(`${API_BASE_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(credentials),
        });

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.message || 'Login failed');
        }

        return data;
    }

    static async register(data: RegisterData): Promise<{ success: boolean; data: { student_id: string }; message: string }> {
        const formData = new FormData();

        // Add text fields
        formData.append('name', data.name);
        formData.append('email', data.email);
        formData.append('phone', data.phone);
        formData.append('password', data.password);
        formData.append('dob', data.dob);
        formData.append('school_name', data.school_name);
        formData.append('father_name', data.father_name);
        formData.append('aadhar_number', data.aadhar_number);
        formData.append('tenth_school', data.tenth_school);
        formData.append('tenth_marks', data.tenth_marks.toString());
        formData.append('twelfth_school', data.twelfth_school);
        formData.append('twelfth_marks', data.twelfth_marks.toString());
        formData.append('cutoff', data.cutoff.toString());

        // Add files if they exist
        if (data.photo) {
            formData.append('photo', data.photo);
        }
        if (data.twelfth_marksheet) {
            formData.append('twelfth_marksheet', data.twelfth_marksheet);
        }

        const response = await fetch(`${API_BASE_URL}/register`, {
            method: 'POST',
            body: formData,
        });

        const result = await response.json();

        if (!result.success) {
            throw new Error(result.message || 'Registration failed');
        }

        return result;
    }

    static async createUser(data: CreateUserData): Promise<{ success: boolean; message: string }> {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('No authentication token found');
        }

        const response = await fetch(`${API_BASE_URL}/admin/onboard`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Failed to create user');
        }

        return result;
    }

    static getRoleRedirectPath(role: UserRole): string {
        switch (role) {
            case 'ssn_main_admin':
                return '/admin-dashboard';
            case 'coe':
                return '/coe-dashboard';
            case 'department_faculty':
                return '/faculty-dashboard';
            case 'club_coordinator':
                return '/club-dashboard';
            case 'student':
                return '/student-dashboard';
            default:
                return '/dashboard';
        }
    }

    static storeUserSession(user: User, token: string): void {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify({
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            student_id: user.student_id,
            role: user.role,
            role_name: user.role,
            department: user.department,
            institution: user.institution,
            club_name: user.club_name,
            dob: user.dob,
            school_name: user.school_name,
            father_name: user.father_name,
            aadhar_number: user.aadhar_number,
            tenth_school: user.tenth_school,
            tenth_marks: user.tenth_marks,
            twelfth_school: user.twelfth_school,
            twelfth_marks: user.twelfth_marks,
            cutoff: user.cutoff,
            is_active: user.is_active,
            is_approved: user.is_approved,
            node_assigned: user.node_assigned,
            created_at: user.created_at,
            permissions: user.permissions || [],
        }));
    }

    static clearUserSession(): void {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    }

    static getStoredUser(): User | null {
        const userStr = localStorage.getItem('user');
        if (!userStr) return null;

        try {
            return JSON.parse(userStr);
        } catch {
            return null;
        }
    }

    static getStoredToken(): string | null {
        return localStorage.getItem('token');
    }
}
