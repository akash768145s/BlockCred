'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, XCircle } from 'lucide-react';
import { Student, IssueCredentialFormData } from '@/types/dashboard';
import type { CredentialTypeConfig, CredentialFieldConfig } from '@/types/rbac';
import { coeService } from '@/services/coeService';
import { adminService } from '@/services/adminService';

interface IssueCredentialModalProps {
    onClose: () => void;
    onCredentialIssued: () => void;
    students: Student[];
    /** When opening from Credentials tab, preselect this type */
    initialCredentialType?: CredentialTypeConfig | null;
}

export const IssueCredentialModal: React.FC<IssueCredentialModalProps> = ({ onClose, onCredentialIssued, students, initialCredentialType }) => {
    const [formData, setFormData] = useState<IssueCredentialFormData>({
        student_id: '',
        type: initialCredentialType?.name ?? '',
        semester: '',
        cgpa: '',
        extra: {},
    });
    const [credentialTypes, setCredentialTypes] = useState<CredentialTypeConfig[]>([]);
    const [selectedType, setSelectedType] = useState<CredentialTypeConfig | null>(initialCredentialType ?? null);
    const [loading, setLoading] = useState(false);
    const [studentSearch, setStudentSearch] = useState('');
    const [showStudentDropdown, setShowStudentDropdown] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Load credential types that this issuer (COE) is allowed to issue
    useEffect(() => {
        adminService
            .listIssuerCredentialTypes()
            .then((list: CredentialTypeConfig[]) => {
                const listArr = Array.isArray(list) ? list : [];
                setCredentialTypes(listArr);
                if (initialCredentialType) {
                    const found = listArr.find((t) => t.id === initialCredentialType.id || t.name === initialCredentialType.name);
                    setSelectedType(found ?? initialCredentialType);
                    setFormData((prev) => ({ ...prev, type: (found ?? initialCredentialType).name, extra: {} }));
                }
            })
            .catch(() => setCredentialTypes([]));
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
            const result = await coeService.issueCredential(formData, []);
            alert(`Certificate issued successfully!\nCertificate ID: ${result.data.cert_id}\nIPFS URL: ${result.data.ipfs_url}`);
            onCredentialIssued();
        } catch (error) {
            alert(error instanceof Error ? error.message : 'Failed to issue certificate');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-slate-800/95 backdrop-blur-md border border-white/10 rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
                <div className="p-8">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h3 className="text-2xl font-bold text-white">Issue Academic Credential</h3>
                            <p className="text-sm text-slate-300 mt-1">Fill in the details to issue a new credential</p>
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
                                        className="w-full pl-10 pr-4 py-3 bg-white/10 border-2 border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 focus:bg-white/20 transition-all"
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
                            <div>
                                <label className="block text-sm font-semibold text-white mb-2">
                                    Credential Type <span className="text-red-400">*</span>
                                </label>
                                {credentialTypes.length === 0 ? (
                                    // Fallback: no dynamic types (likely no permission to read /admin/credential-types) – use legacy static options
                                    <select
                                        required
                                        value={formData.type}
                                        onChange={(e) =>
                                            setFormData(prev => ({
                                                ...prev,
                                                type: e.target.value,
                                                extra: {}, // clear dynamic extra for legacy types
                                            }))
                                        }
                                        className="w-full px-4 py-3 bg-white/10 border-2 border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 focus:bg-white/20 transition-all"
                                    >
                                        <option value="" className="text-slate-400 bg-slate-800">
                                            Select credential type
                                        </option>
                                        <option value="marksheet" className="text-white bg-slate-800">
                                            Semester Marksheet
                                        </option>
                                        <option value="degree" className="text-white bg-slate-800">
                                            Degree Certificate
                                        </option>
                                    </select>
                                ) : (
                                    <select
                                        required
                                        value={selectedType?.id || ''}
                                        onChange={(e) => {
                                            const ct = credentialTypes.find(t => t.id === e.target.value) || null;
                                            setSelectedType(ct);
                                            setFormData(prev => ({
                                                ...prev,
                                                type: ct?.name || '',
                                                extra: {},
                                            }));
                                        }}
                                        className="w-full px-4 py-3 bg-white/10 border-2 border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 focus:bg-white/20 transition-all"
                                    >
                                        <option value="" className="text-slate-400 bg-slate-800">
                                            Select credential type
                                        </option>
                                        {credentialTypes.map(ct => (
                                            <option key={ct.id} value={ct.id} className="text-white bg-slate-800">
                                                {ct.name}
                                            </option>
                                        ))}
                                    </select>
                                )}
                            </div>
                        </div>

                        {/* If no dynamic schema is defined for this type, guide admin instead of showing legacy fields */}
                        {selectedType && (!selectedType.fields || selectedType.fields.length === 0) && (
                            <div className="rounded-lg border border-amber-400/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
                                No fields are configured for <span className="font-semibold">{selectedType.name}</span>.
                                Ask an administrator to open <span className="font-semibold">Admin → Credential Types</span> and
                                add form fields for this credential type.
                            </div>
                        )}

                        {/* Dynamic extra fields driven by CredentialTypesTab fields */}
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
                                                        className="w-full px-4 py-3 bg-white/10 border-2 border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 focus:bg-white/20 transition-all"
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
                                                        className="w-full px-4 py-3 bg-white/10 border-2 border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 focus:bg-white/20 transition-all"
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
                                                        className="w-full px-4 py-3 bg-white/10 border-2 border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 focus:bg-white/20 transition-all"
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
                                                        className="w-full px-4 py-3 bg-white/10 border-2 border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 focus:bg-white/20 transition-all"
                                                    />
                                                </div>
                                            );
                                    }
                                })}
                            </div>
                        )}

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
                                className="px-6 py-3 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium shadow-md"
                            >
                                {loading ? 'Issuing...' : 'Issue Credential'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

