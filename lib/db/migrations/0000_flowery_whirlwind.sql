CREATE TABLE "accounts" (
	"userId" text NOT NULL,
	"type" text NOT NULL,
	"provider" text NOT NULL,
	"providerAccountId" text NOT NULL,
	"email" text,
	"password_hash" text,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" text,
	"scope" text,
	"id_token" text,
	"session_state" text
);
--> statement-breakpoint
CREATE TABLE "activityLogs" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" text,
	"clientId" text,
	"action" text NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"ip_address" varchar(45)
);
--> statement-breakpoint
CREATE TABLE "authenticators" (
	"credentialID" text NOT NULL,
	"userId" text NOT NULL,
	"providerAccountId" text NOT NULL,
	"credentialPublicKey" text NOT NULL,
	"counter" integer NOT NULL,
	"credentialDeviceType" text NOT NULL,
	"credentialBackedUp" boolean NOT NULL,
	"transports" text,
	CONSTRAINT "authenticators_credentialID_unique" UNIQUE("credentialID")
);
--> statement-breakpoint
CREATE TABLE "client_profiles" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"display_name" text,
	"username" text,
	"bio" text,
	"job_title" text,
	"company" text,
	"industry" text,
	"phone" text,
	"website" text,
	"location" text,
	"account_type" text DEFAULT 'individual',
	"status" text DEFAULT 'active',
	"plan" text DEFAULT 'free',
	"timezone" text DEFAULT 'UTC',
	"language" text DEFAULT 'en',
	"two_factor_enabled" boolean DEFAULT false,
	"email_verified" boolean DEFAULT false,
	"total_submissions" integer DEFAULT 0,
	"notes" text,
	"tags" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "client_profiles_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "comments" (
	"id" text PRIMARY KEY NOT NULL,
	"content" text NOT NULL,
	"userId" text NOT NULL,
	"itemId" text NOT NULL,
	"rating" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "favorites" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"item_slug" text NOT NULL,
	"item_name" text NOT NULL,
	"item_icon_url" text,
	"item_category" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "newsletterSubscriptions" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"subscribed_at" timestamp DEFAULT now() NOT NULL,
	"unsubscribed_at" timestamp,
	"last_email_sent" timestamp,
	"source" text DEFAULT 'footer',
	CONSTRAINT "newsletterSubscriptions_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "passwordResetTokens" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp NOT NULL,
	CONSTRAINT "passwordResetTokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "paymentAccounts" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"providerId" text NOT NULL,
	"customerId" text NOT NULL,
	"accountId" text,
	"lastUsed" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "paymentProviders" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text DEFAULT 'stripe' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "paymentProviders_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "roles" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"status" text DEFAULT 'active',
	"permissions" text NOT NULL,
	"created_by" text DEFAULT 'system',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"sessionToken" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"expires" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscriptionHistory" (
	"id" text PRIMARY KEY NOT NULL,
	"subscription_id" text NOT NULL,
	"action" text NOT NULL,
	"previous_status" text,
	"new_status" text,
	"previous_plan" text,
	"new_plan" text,
	"reason" text,
	"metadata" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"plan_id" text DEFAULT 'free' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"start_date" timestamp,
	"end_date" timestamp,
	"payment_provider" text DEFAULT 'stripe' NOT NULL,
	"subscription_id" text,
	"invoice_id" text,
	"amount_due" integer DEFAULT 0,
	"amount_paid" integer DEFAULT 0,
	"price_id" text,
	"customer_id" text,
	"currency" text DEFAULT 'usd',
	"amount" integer DEFAULT 0,
	"interval" text DEFAULT 'month',
	"interval_count" integer DEFAULT 1,
	"trial_start" timestamp,
	"trial_end" timestamp,
	"cancelled_at" timestamp,
	"cancel_at_period_end" boolean DEFAULT false,
	"cancel_reason" text,
	"hosted_invoice_url" text,
	"invoice_pdf" text,
	"metadata" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"username" text,
	"name" text,
	"email" text,
	"emailVerified" timestamp,
	"image" text,
	"password_hash" text,
	"title" text,
	"avatar" text,
	"role_id" text,
	"status" text DEFAULT 'active',
	"created_by" text DEFAULT 'system',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verificationTokens" (
	"identifier" text NOT NULL,
	"email" text NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "votes" (
	"id" text PRIMARY KEY NOT NULL,
	"userid" text NOT NULL,
	"item_id" text NOT NULL,
	"vote_type" text DEFAULT 'upvote' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_userId_client_profiles_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."client_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activityLogs" ADD CONSTRAINT "activityLogs_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activityLogs" ADD CONSTRAINT "activityLogs_clientId_client_profiles_id_fk" FOREIGN KEY ("clientId") REFERENCES "public"."client_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "authenticators" ADD CONSTRAINT "authenticators_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "paymentAccounts" ADD CONSTRAINT "paymentAccounts_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "paymentAccounts" ADD CONSTRAINT "paymentAccounts_providerId_paymentProviders_id_fk" FOREIGN KEY ("providerId") REFERENCES "public"."paymentProviders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptionHistory" ADD CONSTRAINT "subscriptionHistory_subscription_id_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."subscriptions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "votes" ADD CONSTRAINT "votes_userid_users_id_fk" FOREIGN KEY ("userid") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "accounts_email_idx" ON "accounts" USING btree ("email");--> statement-breakpoint
CREATE INDEX "activity_logs_user_idx" ON "activityLogs" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "activity_logs_client_idx" ON "activityLogs" USING btree ("clientId");--> statement-breakpoint
CREATE INDEX "client_profile_email_idx" ON "client_profiles" USING btree ("email");--> statement-breakpoint
CREATE INDEX "client_profile_status_idx" ON "client_profiles" USING btree ("status");--> statement-breakpoint
CREATE INDEX "client_profile_plan_idx" ON "client_profiles" USING btree ("plan");--> statement-breakpoint
CREATE INDEX "client_profile_account_type_idx" ON "client_profiles" USING btree ("account_type");--> statement-breakpoint
CREATE INDEX "client_profile_username_idx" ON "client_profiles" USING btree ("username");--> statement-breakpoint
CREATE INDEX "client_profile_created_at_idx" ON "client_profiles" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "user_item_favorite_unique_idx" ON "favorites" USING btree ("userId","item_slug");--> statement-breakpoint
CREATE INDEX "favorites_user_id_idx" ON "favorites" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "favorites_item_slug_idx" ON "favorites" USING btree ("item_slug");--> statement-breakpoint
CREATE INDEX "favorites_created_at_idx" ON "favorites" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "user_provider_unique_idx" ON "paymentAccounts" USING btree ("userId","providerId");--> statement-breakpoint
CREATE UNIQUE INDEX "customer_provider_unique_idx" ON "paymentAccounts" USING btree ("customerId","providerId");--> statement-breakpoint
CREATE INDEX "payment_account_customer_id_idx" ON "paymentAccounts" USING btree ("customerId");--> statement-breakpoint
CREATE INDEX "payment_account_provider_idx" ON "paymentAccounts" USING btree ("providerId");--> statement-breakpoint
CREATE INDEX "payment_account_created_at_idx" ON "paymentAccounts" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "payment_provider_active_idx" ON "paymentProviders" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "payment_provider_created_at_idx" ON "paymentProviders" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "roles_status_idx" ON "roles" USING btree ("status");--> statement-breakpoint
CREATE INDEX "roles_created_at_idx" ON "roles" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "subscription_history_idx" ON "subscriptionHistory" USING btree ("subscription_id");--> statement-breakpoint
CREATE INDEX "subscription_action_idx" ON "subscriptionHistory" USING btree ("action");--> statement-breakpoint
CREATE INDEX "subscription_history_created_at_idx" ON "subscriptionHistory" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "user_subscription_idx" ON "subscriptions" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "subscription_status_idx" ON "subscriptions" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "provider_subscription_idx" ON "subscriptions" USING btree ("payment_provider","subscription_id");--> statement-breakpoint
CREATE INDEX "subscription_plan_idx" ON "subscriptions" USING btree ("plan_id");--> statement-breakpoint
CREATE INDEX "subscription_created_at_idx" ON "subscriptions" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_user_item_vote_idx" ON "votes" USING btree ("userid","item_id");--> statement-breakpoint
CREATE INDEX "item_votes_idx" ON "votes" USING btree ("item_id");--> statement-breakpoint
CREATE INDEX "votes_created_at_idx" ON "votes" USING btree ("created_at");