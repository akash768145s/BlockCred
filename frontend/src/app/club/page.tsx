'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Award,
    FileText,
    Trophy,
    Plus,
    Search,
    Eye,
    Download,
    CheckCircle,
    Clock,
    Users,
    Calendar,
    TrendingUp,
    Star,
    XCircle
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useClub } from '@/hooks/useClub';
import { Student, IssueClubCertificateFormData } from '@/types/dashboard';
import { clubService } from '@/services/clubService';
import { DashboardHeader } from '@/components/DashboardHeader';
import { adminService } from '@/services/adminService';
import { CredentialTypesTab, IssuedTab } from '@/components/issuer';
import type { CredentialTypeConfig, CredentialFieldConfig } from '@/types/rbac';

const ClubDashboard: React.FC = () => {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('overview');
    const { user } = useAuth();
    const { students, credentials, loading, fetchCredentials } = useClub();
    const [showIssueCredential, setShowIssueCredential] = useState(false);
    const [initialCredentialType, setInitialCredentialType] = useState<CredentialTypeConfig | null>(null);

    const stats = {
        totalStudents: Array.isArray(students) ? students.length : 0,
        totalCertificates: Array.isArray(credentials) ? credentials.length : 0,
        issuedToday: Array.isArray(credentials) ? credentials.filter(c => {
            const today = new Date().toISOString().split('T')[0];
            const issuedDate = (c as any).issued_date || (c as any).issued_at;
            if (!issuedDate) return false;
            const dateStr = typeof issuedDate === 'string'
                ? issuedDate.split('T')[0]
                : new Date(issuedDate).toISOString().split('T')[0];
            return dateStr === today;
        }).length : 0,
        pendingVerification: Array.isArray(credentials) ? credentials.filter(c => c.status === 'pending').length : 0
    };

    const renderOverview = () => (
        <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-slate-800/50 backdrop-blur-sm border border-white/10 p-5 rounded-lg shadow-lg">
                    <div className="flex flex-col items-center text-center">
                        <Users className="h-7 w-7 text-blue-400 mb-3" />
                        <p className="text-xs font-medium text-slate-300 mb-2">Total Students</p>
                        <p className="text-2xl font-bold text-white">{stats.totalStudents}</p>
                    </div>
                </div>

                <div className="bg-slate-800/50 backdrop-blur-sm border border-white/10 p-5 rounded-lg shadow-lg">
                    <div className="flex flex-col items-center text-center">
                        <Award className="h-7 w-7 text-purple-400 mb-3" />
                        <p className="text-xs font-medium text-slate-300 mb-2">Total Certificates</p>
                        <p className="text-2xl font-bold text-white">{stats.totalCertificates}</p>
                    </div>
                </div>

                <div className="bg-slate-800/50 backdrop-blur-sm border border-white/10 p-5 rounded-lg shadow-lg">
                    <div className="flex flex-col items-center text-center">
                        <TrendingUp className="h-7 w-7 text-green-400 mb-3" />
                        <p className="text-xs font-medium text-slate-300 mb-2">Issued Today</p>
                        <p className="text-2xl font-bold text-white">{stats.issuedToday}</p>
                    </div>
                </div>

                <div className="bg-slate-800/50 backdrop-blur-sm border border-white/10 p-5 rounded-lg shadow-lg">
                    <div className="flex flex-col items-center text-center">
                        <Clock className="h-7 w-7 text-yellow-400 mb-3" />
                        <p className="text-xs font-medium text-slate-300 mb-2">Pending Verification</p>
                        <p className="text-2xl font-bold text-white">{stats.pendingVerification}</p>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-white/10 p-6 rounded-lg shadow-lg">
                <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button
                        onClick={() => setShowIssueCredential(true)}
                        className="p-4 border border-white/20 rounded-lg hover:bg-white/10 transition-colors text-left bg-white/5"
                    >
                        <div className="flex items-center mb-2">
                            <Trophy className="h-5 w-5 text-blue-400" />
                            <span className="ml-2 font-medium text-white">Issue Participation Certificate</span>
                        </div>
                        <p className="text-sm text-slate-300">Issue certificate for event participation</p>
                    </button>

                    <button
                        onClick={() => setShowIssueCredential(true)}
                        className="p-4 border border-white/20 rounded-lg hover:bg-white/10 transition-colors text-left bg-white/5"
                    >
                        <div className="flex items-center mb-2">
                            <Star className="h-5 w-5 text-green-400" />
                            <span className="ml-2 font-medium text-white">Issue Achievement Certificate</span>
                        </div>
                        <p className="text-sm text-slate-300">Issue certificate for achievements</p>
                    </button>

                    <button
                        onClick={() => setActiveTab('credentials')}
                        className="p-4 border border-white/20 rounded-lg hover:bg-white/10 transition-colors text-left bg-white/5"
                    >
                        <div className="flex items-center mb-2">
                            <Calendar className="h-5 w-5 text-purple-400" />
                            <span className="ml-2 font-medium text-white">View Credentials</span>
                        </div>
                        <p className="text-sm text-slate-300">Browse credential types you can issue</p>
                    </button>
                </div>
            </div>
        </div>
    );

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/login');
    };

    if (loading) {
        return (
            <main className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 flex items-center justify-center text-white">
                <div className="text-center">
                    <p className="text-xs uppercase tracking-[0.3em] text-indigo-300">BlockCred</p>
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-400 mx-auto mt-4 mb-4"></div>
                    <p className="text-sm text-slate-300">Loading dashboard...</p>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-white">
            <DashboardHeader user={user ?? null} onLogout={handleLogout} maxWidth="max-w-6xl" />

            <div className="border-b border-white/10 bg-white/5 backdrop-blur-sm">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <nav className="flex space-x-1">
                        <button
                            onClick={() => setActiveTab('overview')}
                            className={`px-6 py-3 text-sm font-semibold transition-all rounded-t-lg ${activeTab === 'overview' ? 'bg-white/10 text-white border-t border-x border-white/20' : 'text-indigo-200 hover:text-white'}`}
                        >
                            Overview
                        </button>
                        <button
                            onClick={() => setActiveTab('credentials')}
                            className={`px-6 py-3 text-sm font-semibold transition-all rounded-t-lg ${activeTab === 'credentials' ? 'bg-white/10 text-white border-t border-x border-white/20' : 'text-indigo-200 hover:text-white'}`}
                        >
                            Credentials
                        </button>
                        <button
                            onClick={() => setActiveTab('issued')}
                            className={`px-6 py-3 text-sm font-semibold transition-all rounded-t-lg ${activeTab === 'issued' ? 'bg-white/10 text-white border-t border-x border-white/20' : 'text-indigo-200 hover:text-white'}`}
                        >
                            Issued
                        </button>
                    </nav>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {activeTab === 'overview' && renderOverview()}
                {activeTab === 'credentials' && (
                    <CredentialTypesTab onIssue={(t) => { setInitialCredentialType(t); setShowIssueCredential(true); }} accent="purple" />
                )}
                {activeTab === 'issued' && (
                    <IssuedTab credentials={credentials as any} onRefresh={fetchCredentials} accent="purple" />
                )}
            </div>

            {/* Issue Certificate Modal */}
            {showIssueCredential && (
                <IssueCertificateModal
                    onClose={() => { setShowIssueCredential(false); setInitialCredentialType(null); }}
                    onCertificateIssued={() => {
                        setShowIssueCredential(false);
                        setInitialCredentialType(null);
                        fetchCredentials();
                    }}
                    students={students}
                    initialCredentialType={initialCredentialType}
                />
            )}
        </main>
    );
};

// Issue Certificate Modal Component
const IssueCertificateModal: React.FC<{
    onClose: () => void;
    onCertificateIssued: () => void;
    students: Student[];
    initialCredentialType?: CredentialTypeConfig | null;
}> = ({ onClose, onCertificateIssued, students, initialCredentialType }) => {
    const [formData, setFormData] = useState<IssueClubCertificateFormData>({
        student_id: '',
        type: initialCredentialType?.name ?? '',
        title: '',
        event_name: '',
        position: '',
        description: '',
        event_date: '',
        extra: {},
    });
    const [loading, setLoading] = useState(false);
    const [studentSearch, setStudentSearch] = useState('');
    const [showStudentDropdown, setShowStudentDropdown] = useState(false);
    const dropdownRef = React.useRef<HTMLDivElement>(null);
    const [credentialTypes, setCredentialTypes] = useState<CredentialTypeConfig[]>([]);
    const [selectedType, setSelectedType] = useState<CredentialTypeConfig | null>(initialCredentialType ?? null);
    const [typesError, setTypesError] = useState<string | null>(null);

    useEffect(() => {
        const loadTypes = async () => {
            try {
                const types = await adminService.listIssuerCredentialTypes();
                const listArr = types || [];
                setCredentialTypes(listArr);
                setTypesError(null);
                if (initialCredentialType) {
                    const found = listArr.find((t) => t.id === initialCredentialType.id || t.name === initialCredentialType.name);
                    setSelectedType(found ?? initialCredentialType);
                    setFormData((prev) => ({ ...prev, type: (found ?? initialCredentialType).name, extra: {} }));
                }
            } catch (err) {
                console.error(err);
                setTypesError('Unable to load credential types for this role. Ask admin to configure them.');
                setCredentialTypes([]);
            }
        };
        loadTypes();
    }, [initialCredentialType?.id]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowStudentDropdown(false);
            }
        };

        if (showStudentDropdown) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showStudentDropdown]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const result = await clubService.issueCertificate(formData);
            alert(`Certificate issued successfully!\nCertificate ID: ${result.data.cert_id}\nIPFS URL: ${result.data.ipfs_url}`);
            onCertificateIssued();
        } catch (error) {
            alert(error instanceof Error ? error.message : 'Failed to issue certificate');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-slate-800/95 backdrop-blur-md border border-white/10 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
                <div className="p-8">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h3 className="text-2xl font-bold text-white">Issue Participation Certificate</h3>
                            <p className="text-sm text-slate-300 mt-1">Fill in the details to issue a new certificate</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
                        >
                            <XCircle className="h-6 w-6" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="relative" ref={dropdownRef}>
                                <label className="block text-sm font-semibold text-white mb-2">
                                    Student <span className="text-red-400">*</span>
                                </label>
                                <div className="relative">
                                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 z-10">
                                        <Search className="h-4 w-4 text-slate-400" />
                                    </div>
                                    <input
                                        type="text"
                                        required
                                        value={studentSearch || students.find(s => s.student_id === formData.student_id)?.name || ''}
                                        onChange={(e) => {
                                            setStudentSearch(e.target.value);
                                            setShowStudentDropdown(true);
                                            if (!e.target.value) {
                                                setFormData({ ...formData, student_id: '' });
                                            }
                                        }}
                                        onFocus={() => setShowStudentDropdown(true)}
                                        placeholder="Search student by name or ID..."
                                        className="w-full pl-10 pr-4 py-3 bg-white/10 border-2 border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400 focus:bg-white/20 transition-all"
                                    />
                                    {showStudentDropdown && (
                                        <div className="absolute z-50 w-full mt-1 bg-slate-800/95 backdrop-blur-md border border-white/20 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                                            {students
                                                .filter(student =>
                                                    !studentSearch ||
                                                    student.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
                                                    student.student_id.toLowerCase().includes(studentSearch.toLowerCase()) ||
                                                    student.email.toLowerCase().includes(studentSearch.toLowerCase())
                                                )
                                                .map(student => (
                                                    <button
                                                        key={student.id}
                                                        type="button"
                                                        onClick={() => {
                                                            setFormData({ ...formData, student_id: student.student_id });
                                                            setStudentSearch(student.name);
                                                            setShowStudentDropdown(false);
                                                        }}
                                                        className="w-full px-4 py-3 text-left hover:bg-white/10 transition-colors border-b border-white/10 last:border-b-0"
                                                    >
                                                        <div className="text-white font-medium">{student.name}</div>
                                                        <div className="text-sm text-slate-400">{student.student_id} • {student.email}</div>
                                                    </button>
                                                ))
                                            }
                                            {students.filter(student =>
                                                !studentSearch ||
                                                student.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
                                                student.student_id.toLowerCase().includes(studentSearch.toLowerCase()) ||
                                                student.email.toLowerCase().includes(studentSearch.toLowerCase())
                                            ).length === 0 && (
                                                    <div className="px-4 py-3 text-slate-400 text-sm">No students found</div>
                                                )}
                                        </div>
                                    )}
                                </div>
                                {formData.student_id && (
                                    <input type="hidden" name="student_id" value={formData.student_id} required />
                                )}
                            </div>
                        </div>

                        {/* Dynamic extra fields driven by CredentialTypesTab fields */}
                        {typesError && (
                            <div className="rounded-lg border border-amber-400/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
                                {typesError}
                            </div>
                        )}

                        {!typesError && credentialTypes.length > 0 && (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-white mb-2">
                                        Credential Template (Admin configured)
                                    </label>
                                    <select
                                        value={selectedType?.id || ''}
                                        onChange={e => {
                                            const ct = credentialTypes.find(t => t.id === e.target.value) || null;
                                            setSelectedType(ct);
                                            setFormData(prev => ({
                                                ...prev,
                                                type: ct?.name || prev.type,
                                                extra: {},
                                            }));
                                        }}
                                        className="w-full px-4 py-3 bg-white/10 border-2 border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400 focus:bg-white/20 transition-all"
                                    >
                                        <option value="" className="text-slate-400 bg-slate-800">
                                            Select credential template
                                        </option>
                                        {credentialTypes.map(ct => (
                                            <option key={ct.id} value={ct.id} className="text-white bg-slate-800">
                                                {ct.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {selectedType && (!selectedType.fields || selectedType.fields.length === 0) && (
                                    <div className="rounded-lg border border-amber-400/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
                                        No fields are configured for <span className="font-semibold">{selectedType.name}</span>.
                                        Ask an administrator to open <span className="font-semibold">Admin → Credential Types</span> and
                                        add form fields for this credential type.
                                    </div>
                                )}

                                {selectedType?.fields && selectedType.fields.length > 0 && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {selectedType.fields.map((field: CredentialFieldConfig) => {
                                            const value = (formData.extra || {})[field.key] ?? '';
                                            const setValue = (v: any) =>
                                                setFormData(prev => ({
                                                    ...prev,
                                                    extra: { ...(prev.extra || {}), [field.key]: v },
                                                }));

                                            switch (field.type) {
                                                case 'number':
                                                    return (
                                                        <div key={field.key}>
                                                            <label className="block text-sm font-semibold text-white mb-2">
                                                                {field.label} {field.required && <span className="text-red-400">*</span>}
                                                            </label>
                                                            <input
                                                                type="number"
                                                                required={field.required}
                                                                value={value}
                                                                onChange={e => setValue(e.target.value)}
                                                                className="w-full px-4 py-3 bg-white/10 border-2 border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400 focus:bg-white/20 transition-all"
                                                            />
                                                        </div>
                                                    );
                                                case 'date':
                                                    return (
                                                        <div key={field.key}>
                                                            <label className="block text-sm font-semibold text-white mb-2">
                                                                {field.label} {field.required && <span className="text-red-400">*</span>}
                                                            </label>
                                                            <input
                                                                type="date"
                                                                required={field.required}
                                                                value={value}
                                                                onChange={e => setValue(e.target.value)}
                                                                className="w-full px-4 py-3 bg-white/10 border-2 border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400 focus:bg-white/20 transition-all"
                                                            />
                                                        </div>
                                                    );
                                                case 'select':
                                                    return (
                                                        <div key={field.key}>
                                                            <label className="block text-sm font-semibold text-white mb-2">
                                                                {field.label} {field.required && <span className="text-red-400">*</span>}
                                                            </label>
                                                            <select
                                                                required={field.required}
                                                                value={value}
                                                                onChange={e => setValue(e.target.value)}
                                                                className="w-full px-4 py-3 bg-white/10 border-2 border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400 focus:bg-white/20 transition-all"
                                                            >
                                                                <option value="" className="text-slate-400 bg-slate-800">
                                                                    Select {field.label}
                                                                </option>
                                                                {(field.options || []).map(opt => (
                                                                    <option key={opt} value={opt} className="text-white bg-slate-800">
                                                                        {opt}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                    );
                                                case 'bool':
                                                    return (
                                                        <div key={field.key} className="flex items-center gap-2">
                                                            <input
                                                                type="checkbox"
                                                                checked={!!value}
                                                                onChange={e => setValue(e.target.checked)}
                                                                className="h-4 w-4 rounded border-white/30 bg-slate-900"
                                                            />
                                                            <span className="text-sm text-white">{field.label}</span>
                                                        </div>
                                                    );
                                                case 'text':
                                                default:
                                                    return (
                                                        <div key={field.key}>
                                                            <label className="block text-sm font-semibold text-white mb-2">
                                                                {field.label} {field.required && <span className="text-red-400">*</span>}
                                                            </label>
                                                            <input
                                                                type="text"
                                                                required={field.required}
                                                                value={value}
                                                                onChange={e => setValue(e.target.value)}
                                                                className="w-full px-4 py-3 bg-white/10 border-2 border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400 focus:bg-white/20 transition-all"
                                                            />
                                                        </div>
                                                    );
                                            }
                                        })}
                                    </div>
                                )}
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-semibold text-white mb-2">
                                Description
                            </label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                rows={3}
                                className="w-full px-4 py-3 bg-white/10 border-2 border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400 focus:bg-white/20 transition-all resize-none"
                                placeholder="Enter event details and achievements"
                            />
                        </div>

                        <div className="flex justify-end space-x-4 pt-4 border-t border-white/10">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-6 py-3 border-2 border-white/20 rounded-lg text-white hover:bg-white/10 transition-colors font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium shadow-md"
                            >
                                {loading ? 'Issuing...' : 'Issue Certificate'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ClubDashboard;
