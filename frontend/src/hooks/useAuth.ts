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
            const { user: userData, token } = response.data;

            AuthService.storeUserSession(userData, token);
            setUser(userData);

            const redirectPath = AuthService.getRoleRedirectPath(userData.role);
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
