import { useState, useEffect } from 'react';
import { clubService } from '@/services/clubService';
import { Student, ClubCredential } from '@/types/dashboard';

export const useClub = () => {
    const [students, setStudents] = useState<Student[]>([]);
    const [credentials, setCredentials] = useState<ClubCredential[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchStudents = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await clubService.fetchStudents();
            setStudents(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch students');
            setStudents([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchCredentials = async () => {
        try {
            setError(null);
            const data = await clubService.fetchCredentials();
            setCredentials(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch credentials');
            setCredentials([]);
        }
    };

    useEffect(() => {
        fetchStudents();
        fetchCredentials();
    }, []);

    return {
        students,
        credentials,
        loading,
        error,
        fetchStudents,
        fetchCredentials,
    };
};

