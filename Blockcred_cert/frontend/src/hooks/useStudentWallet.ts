import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { generateShareUrl, copyToClipboard } from '@/lib/utils';
import { useStudentCredentials } from './useApi';

export const useStudentWallet = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [shareUrl, setShareUrl] = useState('');
    const [showQR, setShowQR] = useState(false);
    const [copied, setCopied] = useState(false);

    const studentId = searchParams.get('id') || localStorage.getItem('student_id');

    const { data, loading, error, fetchStudentCredentials } = useStudentCredentials(studentId);

    useEffect(() => {
        if (studentId) {
            generateShareUrl(studentId);
        } else {
            router.push('/login');
        }
    }, [studentId, router]);

    const generateShareUrl = (id: string) => {
        const url = generateShareUrl(id);
        setShareUrl(url);
    };

    const handleCopyToClipboard = async () => {
        const success = await copyToClipboard(shareUrl);
        if (success) {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const toggleQR = () => {
        setShowQR(!showQR);
    };

    const goBackToDashboard = () => {
        router.push('/student-dashboard');
    };

    return {
        studentId,
        data,
        loading,
        error,
        shareUrl,
        showQR,
        copied,
        generateShareUrl,
        handleCopyToClipboard,
        toggleQR,
        goBackToDashboard,
        fetchStudentCredentials,
    };
};
