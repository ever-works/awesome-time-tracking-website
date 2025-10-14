import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { WebhookEventType } from '@/lib/payment/types/payment-types';
import {
	paymentEmailService,
	extractCustomerInfo,
	formatAmount,
	formatPaymentMethod,
	formatBillingDate,
	getPlanName,
	getBillingPeriod
} from '@/lib/payment/services/payment-email.service';

// Import server configuration utility
import { getEmailConfig } from '@/lib/config/server-config';
import { WebhookSubscriptionService } from '@/lib/services/webhook-subscription.service';
import { getOrCreateStripeProvider } from '@/lib/auth';
const webhookSubscriptionService = new WebhookSubscriptionService();

// Utility function to create email data with secure configuration
function createEmailData(baseData: any, emailConfig: Awaited<ReturnType<typeof getEmailConfig>>) {
	return {
		...baseData,
		companyName: emailConfig.companyName,
		companyUrl: emailConfig.companyUrl,
		supportEmail: emailConfig.supportEmail
	};
}

/**
 * @swagger
 * /api/stripe/webhook:
 *   post:
 *     tags: ["Stripe - Webhooks"]
 *     summary: "Handle Stripe webhooks"
 *     description: "Processes incoming Stripe webhook events including subscription lifecycle, payment events, and billing portal updates. Automatically handles email notifications, subscription management, and database updates. Requires valid Stripe signature for security."
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: "Stripe webhook event payload"
 *             properties:
 *               id:
 *                 type: string
 *                 description: "Stripe event ID"
 *                 example: "evt_1234567890abcdef"
 *               type:
 *                 type: string
 *                 description: "Webhook event type"
 *                 enum: [
 *                   "customer.subscription.created",
 *                   "customer.subscription.updated",
 *                   "customer.subscription.deleted",
 *                   "invoice.payment_succeeded",
 *                   "invoice.payment_failed",
 *                   "payment_intent.succeeded",
 *                   "payment_intent.payment_failed",
 *                   "customer.subscription.trial_will_end",
 *                   "billing_portal.session.updated"
 *                 ]
 *                 example: "customer.subscription.created"
 *               data:
 *                 type: object
 *                 description: "Event data object"
 *                 properties:
 *                   object:
 *                     type: object
 *                     description: "The Stripe object (subscription, payment_intent, etc.)"
 *               created:
 *                 type: integer
 *                 description: "Unix timestamp of event creation"
 *                 example: 1640995200
 *               livemode:
 *                 type: boolean
 *                 description: "Whether event is from live mode"
 *                 example: false
 *             required: ["id", "type", "data", "created", "livemode"]
 *     parameters:
 *       - name: "stripe-signature"
 *         in: "header"
 *         required: true
 *         schema:
 *           type: string
 *         description: "Stripe webhook signature for verification"
 *         example: "t=1640995200,v1=abc123def456..."
 *     responses:
 *       200:
 *         description: "Webhook processed successfully"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 received:
 *                   type: boolean
 *                   example: true
 *               required: ["received"]
 *             example:
 *               received: true
 *       400:
 *         description: "Bad request - Invalid signature or webhook processing failed"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   examples:
 *                     no_signature: "No signature provided"
 *                     not_processed: "Webhook not processed"
 *                     processing_failed: "Webhook processing failed"
 *             examples:
 *               no_signature:
 *                 summary: "Missing signature"
 *                 value:
 *                   error: "No signature provided"
 *               not_processed:
 *                 summary: "Webhook not processed"
 *                 value:
 *                   error: "Webhook not processed"
 *               processing_failed:
 *                 summary: "Processing failed"
 *                 value:
 *                   error: "Webhook processing failed"
 *     x-webhook-events:
 *       description: "Supported webhook events and their actions"
 *       events:
 *         customer.subscription.created:
 *           description: "Creates subscription record and sends welcome email"
 *           actions: ["database_update", "email_notification"]
 *         customer.subscription.updated:
 *           description: "Updates subscription record and sends update email"
 *           actions: ["database_update", "email_notification"]
 *         customer.subscription.deleted:
 *           description: "Marks subscription as cancelled and sends cancellation email"
 *           actions: ["database_update", "email_notification"]
 *         invoice.payment_succeeded:
 *           description: "Records successful payment and sends receipt email"
 *           actions: ["database_update", "email_notification"]
 *         invoice.payment_failed:
 *           description: "Records failed payment and sends retry email"
 *           actions: ["database_update", "email_notification"]
 *         payment_intent.succeeded:
 *           description: "Records successful one-time payment and sends confirmation"
 *           actions: ["database_update", "email_notification"]
 *         payment_intent.payment_failed:
 *           description: "Records failed payment and sends failure notification"
 *           actions: ["database_update", "email_notification"]
 *         customer.subscription.trial_will_end:
 *           description: "Sends trial ending notification email"
 *           actions: ["email_notification"]
 *         billing_portal.session.updated:
 *           description: "Logs billing portal session updates"
 *           actions: ["logging"]
 *     x-email-notifications:
 *       description: "Email notifications sent for different events"
 *       templates:
 *         welcome: "Sent when subscription is created"
 *         update: "Sent when subscription is updated"
 *         cancellation: "Sent when subscription is cancelled"
 *         payment_success: "Sent when payment succeeds"
 *         payment_failed: "Sent when payment fails"
 *         trial_ending: "Sent when trial is about to end"
 */
export async function POST(request: NextRequest) {
	try {
		const body = await request.text();
		const headersList = await headers();
		const signature = headersList.get('stripe-signature');

		if (!signature) {
			return NextResponse.json({ error: 'No signature provided' }, { status: 400 });
		}

		// Get or create Stripe provider (singleton)
		const stripeProvider = getOrCreateStripeProvider();
		const webhookResult = await stripeProvider.handleWebhook(body, signature);

		if (!webhookResult.received) {
			return NextResponse.json({ error: 'Webhook not processed' }, { status: 400 });
		}
		switch (webhookResult.type) {
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
			case WebhookEventType.BILLING_PORTAL_SESSION_UPDATED:
				console.log('Billing portal session updated:', webhookResult.data);
				break;
			default:
				console.log(`Unhandled webhook event: ${webhookResult.type}`);
		}

		return NextResponse.json({ received: true });
	} catch (error) {
		console.error('Webhook error:', error);
		return NextResponse.json({ error: 'Webhook processing failed' }, { status: 400 });
	}
}

async function handlePaymentSucceeded(data: any) {

	try {
		const emailConfig = await getEmailConfig();
		const paymentMethod = formatPaymentMethod(data.payment_method);
		const baseEmailData = {
			customerName: data.customer_name,
			customerEmail: data.customer_email,
			amount: data.amount_due,
			currency: data.currency,
			paymentMethod: paymentMethod,
			transactionId: data.id,
			receiptUrl: data.receipt_url
		};

		const emailData = createEmailData(baseEmailData, emailConfig);

		// Send confirmation email
		const emailResult = await paymentEmailService.sendPaymentSuccessEmail(emailData);

		if (emailResult.success) {
			console.log('✅ Payment success email sent successfully');
		} else {
			console.error('❌ Failed to send payment success email:', emailResult.error);
		}
	} catch (error) {
		console.error('❌ Error handling payment succeeded:', error);
	}
}

async function handlePaymentFailed(data: any) {
	console.log('Payment failed:', data.id);

	try {
		// Get secure email configuration
		const emailConfig = await getEmailConfig();

		// Extract customer information
		const customerInfo = extractCustomerInfo(data);

		// Extract payment information
		const amount = formatAmount(data.amount, data.currency);
		const paymentMethod = formatPaymentMethod(data.payment_method);

		// Prepare email data
		const baseEmailData = {
			customerName: customerInfo.customerName,
			customerEmail: customerInfo.customerEmail,
			amount: amount,
			currency: data.currency,
			paymentMethod: paymentMethod,
			transactionId: data.id,
			errorMessage: data.last_payment_error?.message || 'Payment declined',
			retryUrl: `${emailConfig.companyUrl}/payment/retry?payment_intent=${data.id}`,
			updatePaymentUrl: `${emailConfig.companyUrl}/settings/payment-methods`
		};

		const emailData = createEmailData(baseEmailData, emailConfig);

		// Send failure email
		const emailResult = await paymentEmailService.sendPaymentFailedEmail(emailData);

		if (emailResult.success) {
			console.log('✅ Payment failed email sent successfully');
		} else {
			console.error('❌ Failed to send payment failed email:', emailResult.error);
		}
	} catch (error) {
		console.error('❌ Error handling payment failed:', error);
	}
}

async function handleSubscriptionCreated(data: any) {
	console.log('Subscription created:', data.id);

	try {
		await webhookSubscriptionService.handleSubscriptionCreated(data);

		const customerInfo = extractCustomerInfo(data);

		// Extract subscription information
		const priceId = data.items?.data?.[0]?.price?.id;
		const planName = getPlanName(priceId);
		const amount = formatAmount(data.items?.data?.[0]?.price?.unit_amount || 0, data.currency);
		const billingPeriod = getBillingPeriod(data.items?.data?.[0]?.price?.recurring?.interval);
		const emailConfig = await getEmailConfig();

		// Prepare email data
		const emailData = {
			customerName: customerInfo.customerName,
			customerEmail: customerInfo.customerEmail,
			planName: planName,
			amount: amount,
			currency: data.currency,
			billingPeriod: billingPeriod,
			nextBillingDate: data.current_period_end ? formatBillingDate(data.current_period_end) : undefined,
			subscriptionId: data.id,
			manageSubscriptionUrl: `${process.env.NEXT_PUBLIC_APP_URL}/settings/subscription`,
			companyName: emailConfig?.companyName,
			companyUrl: emailConfig?.companyUrl,
			supportEmail: process.env.SUPPORT_EMAI,
			features: getSubscriptionFeatures(planName)
		};

		// Send welcome email
		const emailResult = await paymentEmailService.sendNewSubscriptionEmail(emailData);

		if (emailResult.success) {
			console.log('✅ New subscription email sent successfully');
		} else {
			console.error('❌ Failed to send new subscription email:', emailResult.error);
		}
	} catch (error) {
		console.error('❌ Error handling subscription created:', error);
	}
}

async function handleSubscriptionUpdated(data: any) {
	console.log('Subscription updated:', data.id);

	try {
		await webhookSubscriptionService.handleSubscriptionUpdated(data);

		// Extract customer information
		const customerInfo = extractCustomerInfo(data);

		// Extract subscription information
		const priceId = data.items?.data?.[0]?.price?.id;
		const planName = getPlanName(priceId);
		const amount = formatAmount(data.items?.data?.[0]?.price?.unit_amount || 0, data.currency);
		const billingPeriod = getBillingPeriod(data.items?.data?.[0]?.price?.recurring?.interval);

		// Prepare email data
		const emailData = {
			customerName: customerInfo.customerName,
			customerEmail: customerInfo.customerEmail,
			planName: planName,
			amount: amount,
			currency: data.currency,
			billingPeriod: billingPeriod,
			nextBillingDate: data.current_period_end ? formatBillingDate(data.current_period_end) : undefined,
			subscriptionId: data.id,
			manageSubscriptionUrl: `${process.env.NEXT_PUBLIC_APP_URL}/settings/subscription`,
			companyName: 'Ever Works',
			companyUrl: process.env.NEXT_PUBLIC_APP_URL,
			supportEmail: process.env.SUPPORT_EMAIL,
			features: getSubscriptionFeatures(planName)
		};

		// Send update email
		const emailResult = await paymentEmailService.sendUpdatedSubscriptionEmail(emailData);

		if (emailResult.success) {
			console.log('✅ Updated subscription email sent successfully');
		} else {
			console.error('❌ Failed to send updated subscription email:', emailResult.error);
		}
	} catch (error) {
		console.error('❌ Error handling subscription updated:', error);
	}
}

async function handleSubscriptionCancelled(data: any) {
	console.log('Subscription cancelled:', data.id);

	try {
		await webhookSubscriptionService.handleSubscriptionCancelled(data);
		const customerInfo = extractCustomerInfo(data);
		const priceId = data.items?.data?.[0]?.price?.id;
		const planName = getPlanName(priceId);
		const amount = formatAmount(data.items?.data?.[0]?.price?.unit_amount || 0, data.currency);
		const billingPeriod = getBillingPeriod(data.items?.data?.[0]?.price?.recurring?.interval);

		// Prepare email data
		const emailData = {
			customerName: customerInfo.customerName,
			customerEmail: customerInfo.customerEmail,
			planName: planName,
			amount: amount,
			currency: data.currency,
			billingPeriod: billingPeriod,
			subscriptionId: data.id,
			cancellationDate: data.canceled_at ? formatBillingDate(data.canceled_at) : undefined,
			cancellationReason: data.cancellation_details?.reason || 'Cancellation requested by user',
			reactivateUrl: `${process.env.NEXT_PUBLIC_APP_URL}/subscription/reactivate?subscription=${data.id}`,
			companyName: 'Ever Works',
			companyUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://ever.works',
			supportEmail: process.env.SUPPORT_EMAIL || 'support@ever.works'
		};

		// Send cancellation email
		const emailResult = await paymentEmailService.sendCancelledSubscriptionEmail(emailData);

		if (emailResult.success) {
			console.log('✅ Cancelled subscription email sent successfully');
		} else {
			console.error('❌ Failed to send cancelled subscription email:', emailResult.error);
		}
	} catch (error) {
		console.error('❌ Error handling subscription cancelled:', error);
	}
}

async function handleSubscriptionPaymentSucceeded(data: any) {
	console.log('Subscription payment succeeded:', data.id);

	try {
		await webhookSubscriptionService.handleSubscriptionPaymentSucceeded(data);
		// Extract customer information
		const customerInfo = extractCustomerInfo(data);

		// Extract payment information
		const amount = formatAmount(data.amount_paid, data.currency);
		const subscription = data.subscription;
		const planName = subscription ? getPlanName(subscription.items?.data?.[0]?.price?.id) : 'Premium Plan';
		const billingPeriod = subscription
			? getBillingPeriod(subscription.items?.data?.[0]?.price?.recurring?.interval)
			: 'month';

		// Prepare email data
		const emailData = {
			customerName: customerInfo.customerName,
			customerEmail: customerInfo.customerEmail,
			amount: amount,
			currency: data.currency,
			paymentMethod: 'Credit Card',
			transactionId: data.id,
			planName: planName,
			billingPeriod: billingPeriod,
			nextBillingDate: subscription?.current_period_end
				? formatBillingDate(subscription.current_period_end)
				: undefined,
			receiptUrl: data.receipt_url,
			companyName: 'Ever Works',
			companyUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://ever.works',
			supportEmail: process.env.SUPPORT_EMAIL || 'support@ever.works'
		};

		// Send confirmation email
		const emailResult = await paymentEmailService.sendSubscriptionPaymentSuccessEmail(emailData);

		if (emailResult.success) {
			console.log('✅ Subscription payment success email sent successfully');
		} else {
			console.error('❌ Failed to send subscription payment success email:', emailResult.error);
		}
	} catch (error) {
		console.error('❌ Error handling subscription payment succeeded:', error);
	}
}

async function handleSubscriptionPaymentFailed(data: any) {
	console.log('Subscription payment failed:', data.id);

	try {
		await webhookSubscriptionService.handleSubscriptionPaymentFailed(data);
		const customerInfo = extractCustomerInfo(data);

		// Extract payment information
		const amount = formatAmount(data.amount_due, data.currency);
		const subscription = data.subscription;
		const planName = subscription ? getPlanName(subscription.items?.data?.[0]?.price?.id) : 'Premium Plan';
		const billingPeriod = subscription
			? getBillingPeriod(subscription.items?.data?.[0]?.price?.recurring?.interval)
			: 'month';

		// Prepare email data
		const emailData = {
			customerName: customerInfo.customerName,
			customerEmail: customerInfo.customerEmail,
			amount: amount,
			currency: data.currency,
			paymentMethod: 'Credit Card',
			transactionId: data.id,
			planName: planName,
			billingPeriod: billingPeriod,
			errorMessage: data.last_payment_error?.message || 'Payment declined',
			retryUrl: `${process.env.NEXT_PUBLIC_APP_URL}/subscription/retry?invoice=${data.id}`,
			updatePaymentUrl: `${process.env.NEXT_PUBLIC_APP_URL}/settings/payment-methods`,
			companyName: 'Ever Works',
			companyUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://ever.works',
			supportEmail: process.env.SUPPORT_EMAIL || 'support@ever.works'
		};

		// Send failure email
		const emailResult = await paymentEmailService.sendSubscriptionPaymentFailedEmail(emailData);

		if (emailResult.success) {
			console.log('✅ Subscription payment failed email sent successfully');
		} else {
			console.error('❌ Failed to send subscription payment failed email:', emailResult.error);
		}
	} catch (error) {
		console.error('❌ Error handling subscription payment failed:', error);
	}
}

async function handleSubscriptionTrialEnding(data: any) {
	console.log('Subscription trial ending:', data.id);

	try {
		await webhookSubscriptionService.handleSubscriptionTrialEnding(data);

		// Extract customer information
		const customerInfo = extractCustomerInfo(data);

		// Extract subscription information
		const priceId = data.items?.data?.[0]?.price?.id;
		const planName = getPlanName(priceId);
		const amount = formatAmount(data.items?.data?.[0]?.price?.unit_amount || 0, data.currency);
		const billingPeriod = getBillingPeriod(data.items?.data?.[0]?.price?.recurring?.interval);

		// Prepare email data (uses updated subscription template)
		const emailData = {
			customerName: customerInfo.customerName,
			customerEmail: customerInfo.customerEmail,
			planName: planName,
			amount: amount,
			currency: data.currency,
			billingPeriod: billingPeriod,
			nextBillingDate: data.current_period_end ? formatBillingDate(data.current_period_end) : undefined,
			subscriptionId: data.id,
			manageSubscriptionUrl: `${process.env.NEXT_PUBLIC_APP_URL}/settings/subscription`,
			companyName: 'Ever Works',
			companyUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://ever.works',
			supportEmail: process.env.SUPPORT_EMAIL || 'support@ever.works'
		};

		// Send trial ending notification email
		const emailResult = await paymentEmailService.sendUpdatedSubscriptionEmail(emailData);

		if (emailResult.success) {
			console.log('✅ Trial ending email sent successfully');
		} else {
			console.error('❌ Failed to send trial ending email:', emailResult.error);
		}
	} catch (error) {
		console.error('❌ Error handling subscription trial ending:', error);
	}
}

/**
 * Get subscription features for a plan
 */
function getSubscriptionFeatures(planName: string): string[] {
	const features: Record<string, string[]> = {
		'Free Plan': ['Access to basic features', 'Email support', 'Limited storage'],
		'Standard Plan': [
			'All advanced features',
			'Priority support',
			'Unlimited storage',
			'Third-party integrations',
			'Advanced analytics'
		],
		'Premium Plan': [
			'All Pro features',
			'Dedicated support',
			'Custom features',
			'Full API integration',
			'Custom training'
		]
	};

	return features[planName] || features['Standard Plan'];
}
