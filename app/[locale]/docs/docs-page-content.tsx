'use client';

import { useTranslations } from 'next-intl';

export function DocsPageContent() {
  const t = useTranslations();

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            {t('help.DOCS_PAGE_TITLE')}
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            {t('page.documentation.DOCS_PAGE_DESCRIPTION')}
          </p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
          <iframe
            src="/api/reference"
            className="w-full h-screen border-0"
            title="API Reference"
            style={{ minHeight: '800px' }}
          />
        </div>
        
        <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>
            {t('page.documentation.DOCS_PAGE_FOOTER_LINE_1')}
            <br />
            {t('page.documentation.DOCS_PAGE_FOOTER_LINE_2')}
          </p>
        </div>
      </div>
    </div>
  );
}
