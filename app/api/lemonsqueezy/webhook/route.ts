import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { WebhookEventType } from '@/lib/payment/types/payment-types';
import {
    paymentEmailService,
    extractCustomerInfo,
    formatAmount,
    formatPaymentMethod
} from '@/lib/payment/services/payment-email.service';

// Import server configuration utility
import { getEmailConfig } from '@/lib/config/server-config';
import { WebhookSubscriptionService } from '@/lib/services/webhook-subscription.service';
import { getOrCreateLemonsqueezyProvider } from '@/lib/auth';

const webhookSubscriptionService = new WebhookSubscriptionService();

// Utility function to create email data with secure configuration
function createEmailData(baseData: any, emailConfig: Awaited<ReturnType<typeof getEmailConfig>>) {
	return {
		...baseData,
		appName: emailConfig.companyName, // Use companyName as appName
		supportEmail: emailConfig.supportEmail,
		companyName: emailConfig.companyName,
		websiteUrl: emailConfig.companyUrl // Use companyUrl instead of websiteUrl
	};
}



export async function POST(request: NextRequest) {
	try {
		const body = await request.text();
		const headersList = await headers();
		const signature = headersList.get('x-signature');

		if (!signature) {
			return NextResponse.json({ error: 'No signature provided' }, { status: 400 });
		}

		// Get or create LemonSqueezy provider (singleton)
		const lemonSqueezyProvider = getOrCreateLemonsqueezyProvider();
		const webhookResult = await lemonSqueezyProvider.handleWebhook(body, signature);

		if (!webhookResult.received) {
			return NextResponse.json({ error: 'Webhook not processed' }, { status: 400 });
		}

		// Map LemonSqueezy event types to our generic types
		const eventType = mapLemonSqueezyEventType(webhookResult.type);

		switch (eventType) {
			case WebhookEventType.SUBSCRIPTION_CREATED:
				await handleSubscriptionCreated(webhookResult.data);
				break;
			case WebhookEventType.SUBSCRIPTION_UPDATED:
				console.log('Subscription updated:', webhookResult.data);
				await handleSubscriptionUpdated(webhookResult.data);
				break;
			case WebhookEventType.SUBSCRIPTION_CANCELLED:
				await handleSubscriptionCancelled(webhookResult.data);
				break;
			case WebhookEventType.PAYMENT_SUCCEEDED:
				await handlePaymentSucceeded(webhookResult.data);
				break;
			case WebhookEventType.SUBSCRIPTION_PAYMENT_SUCCEEDED:
				await handleSubscriptionPaymentSucceeded(webhookResult.data);
				break;
			case WebhookEventType.SUBSCRIPTION_PAYMENT_FAILED:
				await handleSubscriptionPaymentFailed(webhookResult.data);
				break;
			case WebhookEventType.PAYMENT_FAILED:
				await handlePaymentFailed(webhookResult.data);
				break;
			case WebhookEventType.SUBSCRIPTION_TRIAL_ENDING:
				await handleSubscriptionTrialEnding(webhookResult.data);
				break;
			default:
				console.log(`Unhandled webhook event: ${eventType}`);
		}

		return NextResponse.json({ received: true });
	} catch (error) {
		console.error('LemonSqueezy webhook error:', error);
		return NextResponse.json({ error: 'Webhook processing failed' }, { status: 400 });
	}
}

// Map LemonSqueezy event types to our generic webhook event types
function mapLemonSqueezyEventType(lemonsqueezyEventType: string): string {
	const eventMapping: Record<string, string> = {
		'subscription_created': WebhookEventType.SUBSCRIPTION_CREATED,
		'subscription_updated': WebhookEventType.SUBSCRIPTION_UPDATED,
		'subscription_cancelled': WebhookEventType.SUBSCRIPTION_CANCELLED,
		'subscription_payment_success': WebhookEventType.SUBSCRIPTION_PAYMENT_SUCCEEDED,
		'subscription_payment_failed': WebhookEventType.SUBSCRIPTION_PAYMENT_FAILED,
		'subscription_trial_will_end': WebhookEventType.SUBSCRIPTION_TRIAL_ENDING,
		'order_created': WebhookEventType.PAYMENT_SUCCEEDED,
		'order_refunded': WebhookEventType.REFUND_SUCCEEDED,
	};

	return eventMapping[lemonsqueezyEventType] || lemonsqueezyEventType;
}

// Webhook event handlers
async function handleSubscriptionCreated(data: any) {
	try {
		const result = await webhookSubscriptionService.handleSubscriptionCreated(data);
		if (result.success) {
			console.log('✅ LemonSqueezy subscription created successfully');
		} else {
			console.error('❌ Failed to handle subscription created:', result.error);
		}
	} catch (error) {
		console.error('❌ Error handling subscription created:', error);
	}
}

async function handleSubscriptionUpdated(data: any) {
	try {
		const result = await webhookSubscriptionService.handleSubscriptionUpdated(data);
		if (result.success) {
			console.log('✅ LemonSqueezy subscription updated successfully');
		} else {
			console.error('❌ Failed to handle subscription updated:', result.error);
		}
	} catch (error) {
		console.error('❌ Error handling subscription updated:', error);
	}
}

async function handleSubscriptionCancelled(data: any) {
	try {
		const result = await webhookSubscriptionService.handleSubscriptionCancelled(data);
		if (result.success) {
			console.log('✅ LemonSqueezy subscription cancelled successfully');
		} else {
			console.error('❌ Failed to handle subscription cancelled:', result.error);
		}
	} catch (error) {
		console.error('❌ Error handling subscription cancelled:', error);
	}
}

async function handlePaymentSucceeded(data: any) {
	try {
		const emailConfig = await getEmailConfig();
		
		// Extract customer info from LemonSqueezy data
		const customerInfo = extractCustomerInfo(data);
		const paymentMethod = formatPaymentMethod('card'); // LemonSqueezy typically uses card payments
		
		const baseEmailData = {
			customerName: customerInfo.customerName,
			customerEmail: customerInfo.customerEmail,
			amount: formatAmount(data.total / 100), // Convert cents to dollars
			currency: data.currency?.toUpperCase() || 'USD',
			paymentMethod: paymentMethod,
			transactionId: data.id,
			receiptUrl: data.urls?.receipt
		};

		const emailData = createEmailData(baseEmailData, emailConfig);

		// Send confirmation email
		const emailResult = await paymentEmailService.sendPaymentSuccessEmail(emailData);

		if (emailResult.success) {
			console.log('✅ LemonSqueezy payment success email sent successfully');
		} else {
			console.error('❌ Failed to send payment success email:', emailResult.error);
		}
	} catch (error) {
		console.error('❌ Error handling payment succeeded:', error);
	}
}

async function handlePaymentFailed(data: any) {
	console.log('LemonSqueezy payment failed:', data.id);
	// Add specific handling for failed payments if needed
}

async function handleSubscriptionPaymentSucceeded(data: any) {
	try {
		const result = await webhookSubscriptionService.handleSubscriptionPaymentSucceeded(data);
		if (result.success) {
			console.log('✅ LemonSqueezy subscription payment processed successfully');
		} else {
			console.error('❌ Failed to handle subscription payment succeeded:', result.error);
		}
	} catch (error) {
		console.error('❌ Error handling subscription payment succeeded:', error);
	}
}

async function handleSubscriptionPaymentFailed(data: any) {
	try {
		const result = await webhookSubscriptionService.handleSubscriptionPaymentFailed(data);
		if (result.success) {
			console.log('✅ LemonSqueezy subscription payment failure handled successfully');
		} else {
			console.error('❌ Failed to handle subscription payment failed:', result.error);
		}
	} catch (error) {
		console.error('❌ Error handling subscription payment failed:', error);
	}
}

async function handleSubscriptionTrialEnding(data: any) {
	try {
		const result = await webhookSubscriptionService.handleSubscriptionTrialEnding(data);
		if (result.success) {
			console.log('✅ LemonSqueezy subscription trial ending handled successfully');
		} else {
			console.error('❌ Failed to handle subscription trial ending:', result.error);
		}
	} catch (error) {
		console.error('❌ Error handling subscription trial ending:', error);
	}
}
