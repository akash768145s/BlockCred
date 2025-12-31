'use client';

import React from 'react';
import { Search, Plus, Users, CheckCircle, Clock, Eye, FileText } from 'lucide-react';
import { Student } from '@/types/dashboard';

interface StudentsTabProps {
    students: Student[];
    searchTerm: string;
    filterSemester: string;
    onSearchChange: (value: string) => void;
    onFilterSemesterChange: (value: string) => void;
    onIssueCredential: () => void;
}

export const StudentsTab: React.FC<StudentsTabProps> = ({
    students,
    searchTerm,
    filterSemester,
    onSearchChange,
    onFilterSemesterChange,
    onIssueCredential,
}) => {
    const filteredStudents = (Array.isArray(students) ? students : []).filter(student => {
        const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            student.student_id.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesSemester = filterSemester === 'all' || student.semester === filterSemester;
        return matchesSearch && matchesSemester;
    });

    return (
        <div className="space-y-6">
            {/* Search and Filter */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-white/10 p-6 rounded-lg shadow-lg">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search students..."
                                value={searchTerm}
                                onChange={(e) => onSearchChange(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-white/20 rounded-lg text-white placeholder-slate-400 bg-white/10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white/20"
                            />
                        </div>
                    </div>
                    <div className="md:w-48">
                        <select
                            value={filterSemester}
                            onChange={(e) => onFilterSemesterChange(e.target.value)}
                            className="w-full px-3 py-2 border border-white/20 rounded-lg text-white bg-white/10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="all">All Semesters</option>
                            <option value="1">Semester 1</option>
                            <option value="2">Semester 2</option>
                            <option value="3">Semester 3</option>
                            <option value="4">Semester 4</option>
                            <option value="5">Semester 5</option>
                            <option value="6">Semester 6</option>
                            <option value="7">Semester 7</option>
                            <option value="8">Semester 8</option>
                        </select>
                    </div>
                    <button
                        onClick={onIssueCredential}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Issue Credential
                    </button>
                </div>
            </div>

            {/* Students Table */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-lg shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-white/10">
                        <thead className="bg-slate-900/50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                                    Student
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                                    Student ID
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                                    Department
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                                    Semester
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-slate-800/30 divide-y divide-white/10">
                            {filteredStudents.map((student) => (
                                <tr key={student.id} className="hover:bg-white/5">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0 h-10 w-10">
                                                <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
                                                    <Users className="h-5 w-5 text-blue-400" />
                                                </div>
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-white">{student.name}</div>
                                                <div className="text-sm text-slate-400">{student.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                                        {student.student_id}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                                        {student.department}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                                        Semester {student.semester}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center space-x-2">
                                            {student.is_active ? (
                                                <CheckCircle className="h-4 w-4 text-green-400" />
                                            ) : (
                                                <Clock className="h-4 w-4 text-yellow-400" />
                                            )}
                                            <span className={`text-sm ${student.is_active ? 'text-green-400' : 'text-yellow-400'}`}>
                                                {student.is_active ? 'Active' : 'Pending'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <div className="flex items-center space-x-2">
                                            <button className="text-blue-400 hover:text-blue-300">
                                                <Eye className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={onIssueCredential}
                                                className="text-green-400 hover:text-green-300"
                                            >
                                                <FileText className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

