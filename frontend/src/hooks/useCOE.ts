import { useState, useEffect } from 'react';
import { coeService } from '@/services/coeService';
import { Student, COECredential } from '@/types/dashboard';

export const useCOE = () => {
    const [students, setStudents] = useState<Student[]>([]);
    const [credentials, setCredentials] = useState<COECredential[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchStudents = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await coeService.fetchStudents();
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
            const data = await coeService.fetchCredentials();
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

