"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Save, X } from "lucide-react";
import type {
  CreateClientRequest,
  UpdateClientRequest
} from "@/lib/types/client";
import type { ClientProfileWithAuth } from "@/lib/db/queries";
import { CLIENT_VALIDATION } from "@/lib/types/client";
import { useTranslations } from 'next-intl';

interface ClientFormProps {
  client?: ClientProfileWithAuth;
  onSubmit: (data: CreateClientRequest | UpdateClientRequest) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  mode: 'create' | 'edit';
}

export function ClientForm({ client, onSubmit, onCancel, isLoading = false, mode }: ClientFormProps) {
  const t = useTranslations('admin.CLIENT_FORM');
  
  // Extract long className strings into constants for better maintainability
  const containerClasses = "w-full";
  const headerClasses = "px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-900";
  const formClasses = "p-6 space-y-6";
  const actionsClasses = "flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 -mx-6 -mb-6 px-6 pb-6";

  // Helper function to construct form defaults based on client data and mode
  const defaultsFor = (m: 'create' | 'edit', c?: ClientProfileWithAuth) => ({
    email: m === 'edit' ? (c?.email ?? '') : '',
    displayName: c?.displayName ?? '',
    username: c?.username ?? '',
    bio: c?.bio ?? '',
    jobTitle: c?.jobTitle ?? '',
    company: c?.company ?? '',
    industry: c?.industry ?? '',
    phone: c?.phone ?? '',
    website: c?.website ?? '',
    location: c?.location ?? '',
    accountType: (c?.accountType ?? 'individual') as 'individual' | 'business' | 'enterprise',
    timezone: c?.timezone ?? 'UTC',
    language: c?.language ?? 'en',
  });

  const [formData, setFormData] = useState(() => defaultsFor(mode, client));

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Update form data when client prop changes
  useEffect(() => {
    setFormData(defaultsFor(mode, client));
    setErrors({});
  }, [client, mode]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Required fields for create mode
    if (mode === 'create') {
      if (!formData.email.trim()) {
        newErrors.email = t('ERRORS.EMAIL_REQUIRED');
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = t('ERRORS.EMAIL_INVALID');
      }
    }

    // Display name validation
    if (formData.displayName && formData.displayName.trim().length < CLIENT_VALIDATION.DISPLAY_NAME_MIN_LENGTH) {
      newErrors.displayName = t('ERRORS.DISPLAY_NAME_MIN_LENGTH', { min: CLIENT_VALIDATION.DISPLAY_NAME_MIN_LENGTH });
    } else if (formData.displayName && formData.displayName.trim().length > CLIENT_VALIDATION.DISPLAY_NAME_MAX_LENGTH) {
      newErrors.displayName = t('ERRORS.DISPLAY_NAME_MAX_LENGTH', { max: CLIENT_VALIDATION.DISPLAY_NAME_MAX_LENGTH });
    }

    // Username validation
    if (formData.username && formData.username.trim().length < CLIENT_VALIDATION.USERNAME_MIN_LENGTH) {
      newErrors.username = t('ERRORS.USERNAME_MIN_LENGTH', { min: CLIENT_VALIDATION.USERNAME_MIN_LENGTH });
    } else if (formData.username && formData.username.trim().length > CLIENT_VALIDATION.USERNAME_MAX_LENGTH) {
      newErrors.username = t('ERRORS.USERNAME_MAX_LENGTH', { max: CLIENT_VALIDATION.USERNAME_MAX_LENGTH });
    }

    // Bio validation
    if (formData.bio && formData.bio.trim().length > CLIENT_VALIDATION.BIO_MAX_LENGTH) {
      newErrors.bio = t('ERRORS.BIO_MAX_LENGTH', { max: CLIENT_VALIDATION.BIO_MAX_LENGTH });
    }

    // Job title validation
    if (formData.jobTitle && formData.jobTitle.trim().length > CLIENT_VALIDATION.JOB_TITLE_MAX_LENGTH) {
      newErrors.jobTitle = t('ERRORS.JOB_TITLE_MAX_LENGTH', { max: CLIENT_VALIDATION.JOB_TITLE_MAX_LENGTH });
    }

    // Company validation
    if (formData.company && formData.company.trim().length > CLIENT_VALIDATION.COMPANY_MAX_LENGTH) {
      newErrors.company = t('ERRORS.COMPANY_MAX_LENGTH', { max: CLIENT_VALIDATION.COMPANY_MAX_LENGTH });
    }

    // Industry validation
    if (formData.industry && formData.industry.trim().length > CLIENT_VALIDATION.INDUSTRY_MAX_LENGTH) {
      newErrors.industry = t('ERRORS.INDUSTRY_MAX_LENGTH', { max: CLIENT_VALIDATION.INDUSTRY_MAX_LENGTH });
    }

    // Phone validation
    if (formData.phone && formData.phone.trim().length > CLIENT_VALIDATION.PHONE_MAX_LENGTH) {
      newErrors.phone = t('ERRORS.PHONE_MAX_LENGTH', { max: CLIENT_VALIDATION.PHONE_MAX_LENGTH });
    }

    // Website validation
    if (formData.website && formData.website.trim().length > CLIENT_VALIDATION.WEBSITE_MAX_LENGTH) {
      newErrors.website = t('ERRORS.WEBSITE_MAX_LENGTH', { max: CLIENT_VALIDATION.WEBSITE_MAX_LENGTH });
    }

    // Location validation
    if (formData.location && formData.location.trim().length > CLIENT_VALIDATION.LOCATION_MAX_LENGTH) {
      newErrors.location = t('ERRORS.LOCATION_MAX_LENGTH', { max: CLIENT_VALIDATION.LOCATION_MAX_LENGTH });
    }



    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      if (mode === 'create') {
        const createData: CreateClientRequest = {
          email: formData.email,
          displayName: formData.displayName,
          username: formData.username,
          bio: formData.bio,
          jobTitle: formData.jobTitle,
          company: formData.company,
          industry: formData.industry,
          phone: formData.phone,
          website: formData.website,
          location: formData.location,
          accountType: formData.accountType,
          timezone: formData.timezone,
          language: formData.language,
        };
        await onSubmit(createData);
      } else {
        const updateData: UpdateClientRequest = {
          id: client?.id || '',
          displayName: formData.displayName,
          username: formData.username,
          bio: formData.bio,
          jobTitle: formData.jobTitle,
          company: formData.company,
          industry: formData.industry,
          phone: formData.phone,
          website: formData.website,
          location: formData.location,
          accountType: formData.accountType,
          timezone: formData.timezone,
          language: formData.language,
        };
        await onSubmit(updateData);
      }
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value as any }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className={containerClasses}>
      <div className={headerClasses}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {mode === 'create' ? t('TITLE_CREATE') : t('TITLE_EDIT')}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {mode === 'create' ? t('SUBTITLE_CREATE') : t('SUBTITLE_EDIT')}
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className={formClasses}>
        {/* Email Field (only for create mode) */}
        {mode === 'create' && (
          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('EMAIL')} <span className="text-red-500">*</span>
            </label>
            <input
              id="email"
              type="email"
              placeholder={t('EMAIL_PLACEHOLDER')}
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.email
                  ? 'border-red-300 bg-red-50 dark:bg-red-900/20 dark:border-red-700'
                  : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
              }`}
            />
            {errors.email && (
              <p className="text-sm text-red-600 dark:text-red-400">{errors.email}</p>
            )}
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {t('EMAIL_HELP')}
            </p>
          </div>
        )}

        {/* Display Name Field */}
        <div className="space-y-2">
          <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {t('DISPLAY_NAME')}
          </label>
          <input
            id="displayName"
            type="text"
            placeholder={t('DISPLAY_NAME_PLACEHOLDER')}
            value={formData.displayName}
            onChange={(e) => handleInputChange('displayName', e.target.value)}
            maxLength={CLIENT_VALIDATION.DISPLAY_NAME_MAX_LENGTH}
            className={`w-full px-3 py-2 border rounded-md text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.displayName 
                ? 'border-red-300 bg-red-50 dark:bg-red-900/20 dark:border-red-700' 
                : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
            }`}
          />
          {errors.displayName && (
            <p className="text-sm text-red-600 dark:text-red-400">{errors.displayName}</p>
          )}
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {t('CHARACTERS_COUNT', { current: formData.displayName.length, max: CLIENT_VALIDATION.DISPLAY_NAME_MAX_LENGTH })}
          </div>
        </div>

        {/* Username Field */}
        <div className="space-y-2">
          <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {t('USERNAME')}
          </label>
          <input
            id="username"
            type="text"
            placeholder={t('USERNAME_PLACEHOLDER')}
            value={formData.username}
            onChange={(e) => handleInputChange('username', e.target.value)}
            maxLength={CLIENT_VALIDATION.USERNAME_MAX_LENGTH}
            className={`w-full px-3 py-2 border rounded-md text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.username 
                ? 'border-red-300 bg-red-50 dark:bg-red-900/20 dark:border-red-700' 
                : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
            }`}
          />
          {errors.username && (
            <p className="text-sm text-red-600 dark:text-red-400">{errors.username}</p>
          )}
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {t('CHARACTERS_COUNT', { current: formData.username.length, max: CLIENT_VALIDATION.USERNAME_MAX_LENGTH })}
          </div>
        </div>

        {/* Bio Field */}
        <div className="space-y-2">
          <label htmlFor="bio" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {t('BIO')}
          </label>
          <textarea
            id="bio"
            placeholder={t('BIO_PLACEHOLDER')}
            value={formData.bio}
            onChange={(e) => handleInputChange('bio', e.target.value)}
            maxLength={CLIENT_VALIDATION.BIO_MAX_LENGTH}
            rows={4}
            className={`w-full px-3 py-2 border rounded-md text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.bio 
                ? 'border-red-300 bg-red-50 dark:bg-red-900/20 dark:border-red-700' 
                : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
            }`}
          />
          {errors.bio && (
            <p className="text-sm text-red-600 dark:text-red-400">{errors.bio}</p>
          )}
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {t('CHARACTERS_COUNT', { current: formData.bio.length, max: CLIENT_VALIDATION.BIO_MAX_LENGTH })}
          </div>
        </div>

        {/* Job Title Field */}
        <div className="space-y-2">
          <label htmlFor="jobTitle" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {t('JOB_TITLE')}
          </label>
          <input
            id="jobTitle"
            type="text"
            placeholder={t('JOB_TITLE_PLACEHOLDER')}
            value={formData.jobTitle}
            onChange={(e) => handleInputChange('jobTitle', e.target.value)}
            maxLength={CLIENT_VALIDATION.JOB_TITLE_MAX_LENGTH}
            className={`w-full px-3 py-2 border rounded-md text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.jobTitle 
                ? 'border-red-300 bg-red-50 dark:bg-red-900/20 dark:border-red-700' 
                : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
            }`}
          />
          {errors.jobTitle && (
            <p className="text-sm text-red-600 dark:text-red-400">{errors.jobTitle}</p>
          )}
        </div>

        {/* Company Field */}
        <div className="space-y-2">
          <label htmlFor="company" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {t('COMPANY')}
          </label>
          <input
            id="company"
            type="text"
            placeholder={t('COMPANY_PLACEHOLDER')}
            value={formData.company}
            onChange={(e) => handleInputChange('company', e.target.value)}
            maxLength={CLIENT_VALIDATION.COMPANY_MAX_LENGTH}
            className={`w-full px-3 py-2 border rounded-md text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.company 
                ? 'border-red-300 bg-red-50 dark:bg-red-900/20 dark:border-red-700' 
                : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
            }`}
          />
          {errors.company && (
            <p className="text-sm text-red-600 dark:text-red-400">{errors.company}</p>
          )}
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {t('CHARACTERS_COUNT', { current: formData.company.length, max: CLIENT_VALIDATION.COMPANY_MAX_LENGTH })}
          </div>
        </div>

        {/* Industry Field */}
        <div className="space-y-2">
          <label htmlFor="industry" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {t('INDUSTRY')}
          </label>
          <input
            id="industry"
            type="text"
            placeholder={t('INDUSTRY_PLACEHOLDER')}
            value={formData.industry}
            onChange={(e) => handleInputChange('industry', e.target.value)}
            maxLength={CLIENT_VALIDATION.INDUSTRY_MAX_LENGTH}
            className={`w-full px-3 py-2 border rounded-md text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.industry 
                ? 'border-red-300 bg-red-50 dark:bg-red-900/20 dark:border-red-700' 
                : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
            }`}
          />
          {errors.industry && (
            <p className="text-sm text-red-600 dark:text-red-400">{errors.industry}</p>
          )}
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {t('CHARACTERS_COUNT', { current: formData.industry.length, max: CLIENT_VALIDATION.INDUSTRY_MAX_LENGTH })}
          </div>
        </div>

        {/* Contact Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('PHONE')}
            </label>
            <input
              id="phone"
              type="tel"
              placeholder={t('PHONE_PLACEHOLDER')}
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              maxLength={CLIENT_VALIDATION.PHONE_MAX_LENGTH}
              className={`w-full px-3 py-2 border rounded-md text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.phone 
                  ? 'border-red-300 bg-red-50 dark:bg-red-900/20 dark:border-red-700' 
                  : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
              }`}
            />
            {errors.phone && (
              <p className="text-sm text-red-600 dark:text-red-400">{errors.phone}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <label htmlFor="website" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('WEBSITE')}
            </label>
            <input
              id="website"
              type="url"
              placeholder={t('WEBSITE_PLACEHOLDER')}
              value={formData.website}
              onChange={(e) => handleInputChange('website', e.target.value)}
              maxLength={CLIENT_VALIDATION.WEBSITE_MAX_LENGTH}
              className={`w-full px-3 py-2 border rounded-md text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.website 
                  ? 'border-red-300 bg-red-50 dark:bg-red-900/20 dark:border-red-700' 
                  : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
              }`}
            />
            {errors.website && (
              <p className="text-sm text-red-600 dark:text-red-400">{errors.website}</p>
            )}
          </div>
        </div>

        {/* Location Field */}
        <div className="space-y-2">
          <label htmlFor="location" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {t('LOCATION')}
          </label>
          <input
            id="location"
            type="text"
            placeholder={t('LOCATION_PLACEHOLDER')}
            value={formData.location}
            onChange={(e) => handleInputChange('location', e.target.value)}
            maxLength={CLIENT_VALIDATION.LOCATION_MAX_LENGTH}
            className={`w-full px-3 py-2 border rounded-md text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.location 
                ? 'border-red-300 bg-red-50 dark:bg-red-900/20 dark:border-red-700' 
                : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
            }`}
          />
          {errors.location && (
            <p className="text-sm text-red-600 dark:text-red-400">{errors.location}</p>
          )}
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {t('CHARACTERS_COUNT', { current: formData.location.length, max: CLIENT_VALIDATION.LOCATION_MAX_LENGTH })}
          </div>
        </div>

        {/* Account Type Field */}
        <div className="space-y-2">
          <label htmlFor="accountType" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {t('ACCOUNT_TYPE')}
          </label>
          <select
            id="accountType"
            value={formData.accountType}
            onChange={(e) => handleInputChange('accountType', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="individual">{t('ACCOUNT_TYPE_OPTIONS.INDIVIDUAL')}</option>
            <option value="business">{t('ACCOUNT_TYPE_OPTIONS.BUSINESS')}</option>
            <option value="enterprise">{t('ACCOUNT_TYPE_OPTIONS.ENTERPRISE')}</option>
          </select>
        </div>

        {/* Timezone Field */}
        <div className="space-y-2">
          <label htmlFor="timezone" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {t('TIMEZONE')}
          </label>
          <select
            id="timezone"
            value={formData.timezone}
            onChange={(e) => handleInputChange('timezone', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="UTC">{t('TIMEZONE_OPTIONS.UTC')}</option>
            <option value="America/New_York">{t('TIMEZONE_OPTIONS.AMERICA_NEW_YORK')}</option>
            <option value="Europe/London">{t('TIMEZONE_OPTIONS.EUROPE_LONDON')}</option>
            <option value="Asia/Tokyo">{t('TIMEZONE_OPTIONS.ASIA_TOKYO')}</option>
          </select>
        </div>

        {/* Language Field */}
        <div className="space-y-2">
          <label htmlFor="language" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {t('LANGUAGE')}
          </label>
          <select
            id="language"
            value={formData.language}
            onChange={(e) => handleInputChange('language', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="en">{t('LANGUAGE_OPTIONS.EN')}</option>
            <option value="es">{t('LANGUAGE_OPTIONS.ES')}</option>
            <option value="fr">{t('LANGUAGE_OPTIONS.FR')}</option>
            <option value="de">{t('LANGUAGE_OPTIONS.DE')}</option>
          </select>
        </div>



        {/* Form Actions */}
        <div className={actionsClasses}>
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <X className="w-4 h-4" />
            {t('CANCEL')}
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {mode === 'create' ? t('CREATE_CLIENT') : t('UPDATE_CLIENT')}
          </Button>
        </div>
      </form>
    </div>
  );
} 