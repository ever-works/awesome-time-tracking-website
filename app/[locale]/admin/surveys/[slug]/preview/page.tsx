import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { SurveyPreviewClient } from '@/components/surveys/preview/preview-client';
import { surveyService } from '@/lib/services/survey.service';
import { cache } from 'react';

interface AdminSurveyPreviewPageProps {
	params: Promise<{
		locale: string;
		slug: string;
	}>;
}

const getSurvey = cache(async (slug: string) => {
	return surveyService.getBySlug(slug);
});


export async function generateMetadata({ params }: AdminSurveyPreviewPageProps): Promise<Metadata> {
	const { slug } = await params;
	const survey = await getSurvey(slug);

	if (!survey) {
		return {
			title: 'Survey Not Found'
		};
	}

	return {
		title: `${survey.title} - Preview | Admin`,
		description: `Preview ${survey.title}`
	};
}

export default async function AdminSurveyPreviewPage({ params }: AdminSurveyPreviewPageProps) {
	const { slug } = await params;
	const survey = await getSurvey(slug);

	if (!survey) {
		notFound();
	}

	return <SurveyPreviewClient survey={survey} backLink="/admin/surveys" />;
}

