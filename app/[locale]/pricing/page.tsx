'use client';

import { PricingSection } from '@/components/pricing/pricing-section';
import { Container } from '@/components/ui/container';
import { cn } from '@/lib/utils';

function PricingPage() {
	return (
		<div
			className={cn(
				'w-full min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-300'
			)}
		>
			<Container maxWidth="7xl" padding="default" className="py-12">
				<PricingSection />
			</Container>
		</div>
	);
}
export default PricingPage;
