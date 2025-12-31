'use client';

import React from 'react';
import { Shield, FileText, GraduationCap, Award, Users } from 'lucide-react';
import { getRoleIcon } from '@/lib/utils';

interface RoleIconProps {
    role: string;
}

export const RoleIcon: React.FC<RoleIconProps> = ({ role }) => {
    const iconName = getRoleIcon(role as any);
    switch (iconName) {
        case 'Shield':
            return <Shield className="h-5 w-5 text-[#06B6D4]" />;
        case 'FileText':
            return <FileText className="h-5 w-5 text-[#06B6D4]" />;
        case 'GraduationCap':
            return <GraduationCap className="h-5 w-5 text-[#06B6D4]" />;
        case 'Award':
            return <Award className="h-5 w-5 text-[#06B6D4]" />;
        case 'Users':
            return <Users className="h-5 w-5 text-[#06B6D4]" />;
        default:
            return <Users className="h-5 w-5 text-[#06B6D4]" />;
    }
};

