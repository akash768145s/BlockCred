import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AuthService, LoginCredentials, RegisterData, CreateUserData } from '@/lib/auth';
import { User, UserRole } from '@/types/auth';

export const useAuth = () => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const storedUser = AuthService.getStoredUser();
        setUser(storedUser);
        setLoading(false);
    }, []);

    const login = async (credentials: LoginCredentials) => {
        try {
            const response = await AuthService.login(credentials);
            // Backend returns: { success, message, data: { user: User, token: string } }
            const responseData = response.data as any;

            // Handle different possible response structures
            let userFromResponse: any = null;
            let token: string = '';

            if (responseData) {
                // Check if data has user and token properties
                if (responseData.user && responseData.token) {
                    userFromResponse = responseData.user;
                    token = responseData.token;
                }
                // Check if data itself is the user object and token is separate
                else if (responseData.id && responseData.role) {
                    userFromResponse = responseData;
                    token = responseData.token || (response as any).token || '';
                }
                // Fallback: check if token is at root level
                else {
                    userFromResponse = responseData.user || responseData;
                    token = responseData.token || (response as any).token || '';
                }
            }

            if (!userFromResponse || !token) {
                console.error('Login response structure:', response);
                throw new Error('Invalid response from server: missing user or token');
            }

            // Build User object from backend response
            // Handle MongoDB ObjectID (hex string) or numeric ID
            // Keep the original ID format from backend (string for MongoDB, number for others)
            const userId: number | string = userFromResponse.id || (userFromResponse._id || '');

            const userData: User = {
                id: userId,
                name: userFromResponse.name || '',
                email: userFromResponse.email || '',
                phone: userFromResponse.phone || '',
                student_id: userFromResponse.student_id || '',
                role: userFromResponse.role,
                department: userFromResponse.department || '',
                institution: userFromResponse.institution || '',
                club_name: userFromResponse.club_name || '',
                dob: userFromResponse.dob || '',
                school_name: userFromResponse.school_name || '',
                father_name: userFromResponse.father_name || '',
                aadhar_number: userFromResponse.aadhar_number || '',
                tenth_school: userFromResponse.tenth_school || '',
                tenth_marks: userFromResponse.tenth_marks || 0,
                twelfth_school: userFromResponse.twelfth_school || '',
                twelfth_marks: userFromResponse.twelfth_marks || 0,
                cutoff: userFromResponse.cutoff || 0,
                is_active: userFromResponse.is_active ?? true,
                is_approved: userFromResponse.is_approved ?? true,
                node_assigned: userFromResponse.node_assigned ?? false,
                created_at: userFromResponse.created_at || '',
                updated_at: userFromResponse.updated_at || '',
                permissions: userFromResponse.permissions || {
                    can_onboard_sub_admins: false,
                    can_deploy_contracts: false,
                    can_authorize_validators: false,
                    can_issue_marksheet: false,
                    can_issue_bonafide: false,
                    can_issue_noc: false,
                    can_issue_participation: false,
                    can_verify_credentials: false,
                    can_read_only_access: false,
                    can_manage_users: false,
                    can_view_all_credentials: false,
                    can_approve_students: false,
                },
            };

            AuthService.storeUserSession(userData, token);
            setUser(userData);

            // Debug: log the role received from backend
            console.log('User role from backend:', userData.role);
            console.log('User permissions:', userData.permissions);

            const redirectPath = AuthService.getRoleRedirectPath(userData.role, userData.permissions);
            console.log('Redirect path:', redirectPath);
            router.push(redirectPath);

            return { success: true, message: 'Login successful!' };
        } catch (error) {
            return {
                success: false,
                message: error instanceof Error ? error.message : 'Login failed'
            };
        }
    };

    const register = async (data: RegisterData) => {
        try {
            const response = await AuthService.register(data);
            return {
                success: true,
                message: `Registration successful! Your Student ID: ${response.data.student_id}. Awaiting admin approval.`
            };
        } catch (error) {
            return {
                success: false,
                message: error instanceof Error ? error.message : 'Registration failed'
            };
        }
    };

    const createUser = async (data: CreateUserData) => {
        try {
            await AuthService.createUser(data);
            return { success: true, message: 'User created successfully!' };
        } catch (error) {
            return {
                success: false,
                message: error instanceof Error ? error.message : 'Failed to create user'
            };
        }
    };

    const logout = () => {
        AuthService.clearUserSession();
        setUser(null);
        router.push('/login');
    };

    const isAuthenticated = () => {
        return !!user && !!AuthService.getStoredToken();
    };

    const hasRole = (role: UserRole) => {
        return user?.role === role;
    };

    const hasPermission = (permission: string) => {
        return user?.permissions?.[permission as keyof typeof user.permissions] === true;
    };

    return {
        user,
        loading,
        login,
        register,
        createUser,
        logout,
        isAuthenticated,
        hasRole,
        hasPermission,
    };
};
