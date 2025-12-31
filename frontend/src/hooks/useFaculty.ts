import { useState, useEffect } from 'react';
import { facultyService } from '@/services/facultyService';
import { Student, FacultyCredential } from '@/types/dashboard';

export const useFaculty = () => {
    const [students, setStudents] = useState<Student[]>([]);
    const [credentials, setCredentials] = useState<FacultyCredential[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchStudents = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await facultyService.fetchStudents();
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
            const data = await facultyService.fetchCredentials();
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

