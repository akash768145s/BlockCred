'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, XCircle } from 'lucide-react';
import { Student, Subject } from '@/types/dashboard';
import { coeService } from '@/services/coeService';

interface IssueCredentialModalProps {
    onClose: () => void;
    onCredentialIssued: () => void;
    students: Student[];
}

export const IssueCredentialModal: React.FC<IssueCredentialModalProps> = ({ onClose, onCredentialIssued, students }) => {
    const [formData, setFormData] = useState({
        student_id: '',
        type: 'marksheet',
        semester: '',
        cgpa: ''
    });
    const [subjects, setSubjects] = useState<Subject[]>([
        { id: '1', subject_code: '', subject_name: '', marks: '', grade: '', credits: '' }
    ]);
    const [loading, setLoading] = useState(false);
    const [studentSearch, setStudentSearch] = useState('');
    const [showStudentDropdown, setShowStudentDropdown] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

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
            const result = await coeService.issueCredential(formData, subjects);
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
                                <select
                                    required
                                    value={formData.type}
                                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                    className="w-full px-4 py-3 bg-white/10 border-2 border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 focus:bg-white/20 transition-all"
                                >
                                    <option value="marksheet" className="text-white bg-slate-800">Semester Marksheet</option>
                                    <option value="degree" className="text-white bg-slate-800">Degree Certificate</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-semibold text-white mb-2">
                                    Semester <span className="text-red-400">*</span>
                                </label>
                                <select
                                    required
                                    value={formData.semester}
                                    onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                                    className="w-full px-4 py-3 bg-white/10 border-2 border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 focus:bg-white/20 transition-all"
                                >
                                    <option value="" className="text-slate-400 bg-slate-800">Select Semester</option>
                                    <option value="1" className="text-white bg-slate-800">Semester 1</option>
                                    <option value="2" className="text-white bg-slate-800">Semester 2</option>
                                    <option value="3" className="text-white bg-slate-800">Semester 3</option>
                                    <option value="4" className="text-white bg-slate-800">Semester 4</option>
                                    <option value="5" className="text-white bg-slate-800">Semester 5</option>
                                    <option value="6" className="text-white bg-slate-800">Semester 6</option>
                                    <option value="7" className="text-white bg-slate-800">Semester 7</option>
                                    <option value="8" className="text-white bg-slate-800">Semester 8</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-white mb-2">
                                    CGPA <span className="text-red-400">*</span>
                                </label>
                                <input
                                    type="number"
                                    required
                                    min="0"
                                    max="10"
                                    step="0.01"
                                    value={formData.cgpa}
                                    onChange={(e) => setFormData({ ...formData, cgpa: e.target.value })}
                                    className="w-full px-4 py-3 bg-white/10 border-2 border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 focus:bg-white/20 transition-all"
                                    placeholder="Enter CGPA (0-10)"
                                />
                                <p className="text-xs text-slate-400 mt-1">Range: 0.00 - 10.00</p>
                            </div>
                        </div>

                        {/* Subjects Section */}
                        <div>
                            <div className="flex justify-between items-center mb-4">
                                <label className="block text-sm font-semibold text-white">
                                    Subjects <span className="text-red-400">*</span>
                                </label>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSubjects([...subjects, {
                                            id: Date.now().toString(),
                                            subject_code: '',
                                            subject_name: '',
                                            marks: '',
                                            grade: '',
                                            credits: ''
                                        }]);
                                    }}
                                    className="flex items-center gap-2 px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors text-sm font-medium"
                                >
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                                    </svg>
                                    Add Subject
                                </button>
                            </div>

                            {/* Subjects Table */}
                            <div className="border-2 border-cyan-500/30 rounded-lg overflow-hidden shadow-sm bg-slate-800/50">
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-gradient-to-r from-cyan-600 to-cyan-700">
                                            <tr>
                                                <th className="px-6 py-3.5 text-left text-xs font-bold text-white uppercase tracking-wider w-[15%]">Subject Code</th>
                                                <th className="px-6 py-3.5 text-left text-xs font-bold text-white uppercase tracking-wider w-[30%]">Subject Name</th>
                                                <th className="px-6 py-3.5 text-left text-xs font-bold text-white uppercase tracking-wider w-[12%]">Marks</th>
                                                <th className="px-6 py-3.5 text-left text-xs font-bold text-white uppercase tracking-wider w-[15%]">Grade</th>
                                                <th className="px-6 py-3.5 text-left text-xs font-bold text-white uppercase tracking-wider w-[12%]">Credits</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-slate-800/30 divide-y divide-white/10">
                                            {subjects.map((subject, index) => (
                                                <tr key={subject.id} className="hover:bg-white/5 transition-colors">
                                                    <td className="px-6 py-3">
                                                        <input
                                                            type="text"
                                                            required
                                                            value={subject.subject_code}
                                                            onChange={(e) => {
                                                                const updated = [...subjects];
                                                                updated[index].subject_code = e.target.value;
                                                                setSubjects(updated);
                                                            }}
                                                            className="w-full min-w-[140px] px-4 py-2.5 bg-white/10 border-2 border-white/20 rounded-md text-sm text-white font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 focus:bg-white/20 transition-all"
                                                            placeholder="e.g., CS101"
                                                        />
                                                    </td>
                                                    <td className="px-6 py-3">
                                                        <input
                                                            type="text"
                                                            required
                                                            value={subject.subject_name}
                                                            onChange={(e) => {
                                                                const updated = [...subjects];
                                                                updated[index].subject_name = e.target.value;
                                                                setSubjects(updated);
                                                            }}
                                                            className="w-full min-w-[280px] px-4 py-2.5 bg-white/10 border-2 border-white/20 rounded-md text-sm text-white font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 focus:bg-white/20 transition-all"
                                                            placeholder="e.g., Data Structures"
                                                        />
                                                    </td>
                                                    <td className="px-6 py-3">
                                                        <input
                                                            type="number"
                                                            required
                                                            min="0"
                                                            max="100"
                                                            value={subject.marks}
                                                            onChange={(e) => {
                                                                const updated = [...subjects];
                                                                updated[index].marks = e.target.value;
                                                                setSubjects(updated);
                                                            }}
                                                            className="w-full min-w-[120px] px-4 py-2.5 bg-white/10 border-2 border-white/20 rounded-md text-sm text-white font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 focus:bg-white/20 transition-all"
                                                            placeholder="0-100"
                                                        />
                                                    </td>
                                                    <td className="px-6 py-3">
                                                        <select
                                                            value={subject.grade}
                                                            onChange={(e) => {
                                                                const updated = [...subjects];
                                                                updated[index].grade = e.target.value;
                                                                setSubjects(updated);
                                                            }}
                                                            className="w-full min-w-[140px] px-4 py-2.5 bg-white/10 border-2 border-white/20 rounded-md text-sm text-white font-medium focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 focus:bg-white/20 transition-all"
                                                        >
                                                            <option value="" className="text-slate-400 bg-slate-800">Select</option>
                                                            <option value="S" className="text-white bg-slate-800">S (10)</option>
                                                            <option value="A+" className="text-white bg-slate-800">A+ (9)</option>
                                                            <option value="A" className="text-white bg-slate-800">A (8)</option>
                                                            <option value="B+" className="text-white bg-slate-800">B+ (7)</option>
                                                            <option value="B" className="text-white bg-slate-800">B (6)</option>
                                                            <option value="C+" className="text-white bg-slate-800">C+ (5)</option>
                                                            <option value="C" className="text-white bg-slate-800">C (4)</option>
                                                            <option value="D" className="text-white bg-slate-800">D (3)</option>
                                                            <option value="F" className="text-white bg-slate-800">F (0)</option>
                                                        </select>
                                                    </td>
                                                    <td className="px-6 py-3">
                                                        <input
                                                            type="number"
                                                            required
                                                            min="0"
                                                            max="10"
                                                            step="0.5"
                                                            value={subject.credits}
                                                            onChange={(e) => {
                                                                const updated = [...subjects];
                                                                updated[index].credits = e.target.value;
                                                                setSubjects(updated);
                                                            }}
                                                            className="w-full min-w-[120px] px-4 py-2.5 bg-white/10 border-2 border-white/20 rounded-md text-sm text-white font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 focus:bg-white/20 transition-all"
                                                            placeholder="e.g., 3"
                                                        />
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            <p className="text-xs text-slate-400 mt-2">Add multiple subjects using the "+" button above</p>
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

