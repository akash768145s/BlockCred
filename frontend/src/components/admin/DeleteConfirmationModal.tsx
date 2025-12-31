'use client';

import React from 'react';
import { Trash2 } from 'lucide-react';

interface DeleteConfirmationModalProps {
    userName: string;
    onConfirm: () => void;
    onCancel: () => void;
}

export const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({ userName, onConfirm, onCancel }) => {
    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
                <div className="p-8">
                    <div className="flex items-center justify-center mb-6">
                        <div className="p-4 bg-red-100 rounded-full">
                            <Trash2 className="h-8 w-8 text-red-600" />
                        </div>
                    </div>

                    <h3 className="text-2xl font-bold text-[#1E293B] text-center mb-3">
                        Delete User?
                    </h3>

                    <p className="text-center text-[#64748B] mb-6">
                        Are you sure you want to delete <span className="font-semibold text-[#1E293B]">{userName}</span>?
                        <br />
                        <span className="text-red-600 font-medium">This action cannot be undone.</span>
                    </p>

                    <div className="flex space-x-4">
                        <button
                            onClick={onCancel}
                            className="flex-1 px-6 py-3 border-2 border-gray-300 rounded-lg text-[#1E293B] hover:bg-[#F8FAFC] transition-colors font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onConfirm}
                            className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium shadow-md"
                        >
                            Delete
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

