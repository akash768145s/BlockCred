import { useState, useEffect } from 'react';
import { ApiService } from '@/lib/api';
import { User, Credential } from '@/types/auth';
import { StudentCredentials, DashboardStats } from '@/lib/api';

export const useUsers = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await ApiService.fetchUsers();
            setUsers(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch users');
            setUsers([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const approveUser = async (userId: number) => {
        try {
            await ApiService.approveUser(userId);
            await fetchUsers(); // Refresh the list
            return { success: true, message: 'User approved successfully' };
        } catch (err) {
            return {
                success: false,
                message: err instanceof Error ? err.message : 'Failed to approve user'
            };
        }
    };

    return {
        users,
        loading,
        error,
        fetchUsers,
        approveUser,
    };
};

export const useCredentials = () => {
    const [credentials, setCredentials] = useState<Credential[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchCredentials = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await ApiService.fetchCredentials();
            setCredentials(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch credentials');
            setCredentials([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCredentials();
    }, []);

    return {
        credentials,
        loading,
        error,
        fetchCredentials,
    };
};

export const useStudentCredentials = (studentId: string | null) => {
    const [data, setData] = useState<StudentCredentials | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchStudentCredentials = async (id: string) => {
        try {
            setLoading(true);
            setError(null);
            const result = await ApiService.fetchStudentCredentials(id);
            setData(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch student credentials');
            setData(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (studentId) {
            fetchStudentCredentials(studentId);
        }
    }, [studentId]);

    return {
        data,
        loading,
        error,
        fetchStudentCredentials,
    };
};

export const useStudentData = (userId: number | null) => {
    const [student, setStudent] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchStudentData = async (id: number) => {
        try {
            setLoading(true);
            setError(null);
            const data = await ApiService.fetchStudentData(id);
            setStudent(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch student data');
            setStudent(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (userId) {
            fetchStudentData(userId);
        }
    }, [userId]);

    return {
        student,
        loading,
        error,
        fetchStudentData,
    };
};

export const useDashboardStats = () => {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchStats = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await ApiService.getDashboardStats();
            setStats(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch dashboard stats');
            setStats(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    return {
        stats,
        loading,
        error,
        fetchStats,
    };
};
