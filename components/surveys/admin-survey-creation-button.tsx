'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {  FileText } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface AdminSurveyCreationButtonProps {
  itemId?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'default' | 'lg';
  className?: string;
  showLabel?: boolean;
}

export function AdminSurveyCreationButton({
  itemId,
  variant = 'outline',
  size = 'sm',
  className = '',
  showLabel = false
}: AdminSurveyCreationButtonProps) {
  const t = useTranslations('survey');

  // Build URL with query parameters if itemId is provided
  const createSurveyUrl = itemId
    ? `/admin/surveys/create?itemId=${encodeURIComponent(itemId)}`
    : '/admin/surveys/create';

  return (
    <Link href={createSurveyUrl} title={t('CREATE_SURVEY')}>
      <Button
        variant={variant}
        size={size}
        className={`flex items-center justify-center ${showLabel ? 'gap-2' : ''} ${className}`}
      >
        <FileText className="w-4 h-4" />
        {showLabel && t('CREATE_SURVEY')}
      </Button>
    </Link>
  );
}
