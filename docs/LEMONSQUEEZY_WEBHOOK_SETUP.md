# LemonSqueezy Webhook Setup Guide

## Overview
This guide explains how to configure and use the LemonSqueezy webhook for handling payment events in your application.

## Environment Variables Required

Add these environment variables to your `.env.local` file:

```env
# LemonSqueezy Configuration
LEMONSQUEEZY_API_KEY=your_api_key_here
LEMONSQUEEZY_WEBHOOK_SECRET=your_webhook_secret_here
LEMONSQUEEZY_STORE_ID=your_store_id_here
```

## Webhook Endpoint

The webhook is available at: `/api/lemonsqueezy/webhook`

## Supported Events

The webhook handles the following LemonSqueezy events:

| LemonSqueezy Event | Mapped to | Description |
|-------------------|-----------|-------------|
| `subscription_created` | `SUBSCRIPTION_CREATED` | New subscription created |
| `subscription_updated` | `SUBSCRIPTION_UPDATED` | Subscription updated |
| `subscription_cancelled` | `SUBSCRIPTION_CANCELLED` | Subscription cancelled |
| `subscription_payment_success` | `SUBSCRIPTION_PAYMENT_SUCCEEDED` | Subscription payment succeeded |
| `subscription_payment_failed` | `SUBSCRIPTION_PAYMENT_FAILED` | Subscription payment failed |
| `subscription_trial_will_end` | `SUBSCRIPTION_TRIAL_ENDING` | Trial period ending soon |
| `order_created` | `PAYMENT_SUCCEEDED` | One-time payment succeeded |
| `order_refunded` | `REFUND_SUCCEEDED` | Payment refunded |

## Webhook Configuration in LemonSqueezy

1. Log into your LemonSqueezy dashboard
2. Go to Settings → Webhooks
3. Create a new webhook with:
   - **URL**: `https://yourdomain.com/api/lemonsqueezy/webhook`
   - **Events**: Select the events you want to receive
   - **Secret**: Generate a secret key and add it to your environment variables

## Features

### Security
- ✅ HMAC signature verification using SHA-256
- ✅ Webhook secret validation
- ✅ Error handling and logging

### Functionality
- ✅ Subscription lifecycle management
- ✅ Payment processing
- ✅ Email notifications
- ✅ Database updates
- ✅ Error logging and monitoring

### Email Notifications
The webhook automatically sends email notifications for:
- Payment success confirmations
- Subscription updates
- Payment failures (logged for monitoring)

## Testing

You can test the webhook using LemonSqueezy's webhook testing feature or by sending test events to your endpoint.

## Monitoring

All webhook events are logged with the following information:
- ✅ Successful processing: `✅ LemonSqueezy [event] handled successfully`
- ❌ Errors: `❌ Failed to handle [event]: [error details]`

## Error Handling

The webhook includes comprehensive error handling:
- Invalid signatures return 400 status
- Processing errors are logged and return 400 status
- Individual event handler errors are caught and logged

## Integration with Existing Services

The webhook integrates with:
- `WebhookSubscriptionService` for subscription management
- `PaymentEmailService` for email notifications
- Database queries for data persistence
- Configuration management for secure settings

## Troubleshooting

### Common Issues

1. **"No signature provided" error**
   - Ensure LemonSqueezy is sending the `x-signature` header
   - Check your webhook configuration in LemonSqueezy

2. **"Invalid signature" error**
   - Verify your `LEMONSQUEEZY_WEBHOOK_SECRET` matches the secret in LemonSqueezy
   - Ensure the webhook URL is correctly configured

3. **"Missing required LemonSqueezy configuration" error**
   - Check that all required environment variables are set
   - Verify the variable names match exactly

### Debug Mode

Set `NODE_ENV=development` to enable test mode for LemonSqueezy operations.

## Security Best Practices

1. Always use HTTPS for your webhook endpoint
2. Keep your webhook secret secure and rotate it regularly
3. Monitor webhook logs for suspicious activity
4. Use environment variables for all sensitive configuration
5. Implement rate limiting if needed for production use

## Support

For issues related to:
- **LemonSqueezy API**: Check [LemonSqueezy Documentation](https://docs.lemonsqueezy.com/)
- **Webhook Implementation**: Check the logs and error messages
- **Configuration**: Verify environment variables and webhook settings
