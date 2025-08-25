import { pgTable, unique, text, timestamp, boolean, foreignKey, integer, index, uniqueIndex, serial, varchar, primaryKey } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const passwordResetTokens = pgTable("passwordResetTokens", {
	id: text().primaryKey().notNull(),
	email: text().notNull(),
	token: text().notNull(),
	expires: timestamp({ mode: 'string' }).notNull(),
}, (table) => [
	unique("passwordResetTokens_token_unique").on(table.token),
]);

export const newsletterSubscriptions = pgTable("newsletterSubscriptions", {
	id: text().primaryKey().notNull(),
	email: text().notNull(),
	firstName: text("first_name"),
	lastName: text("last_name"),
	isSubscribed: boolean("is_subscribed").default(true).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("newsletterSubscriptions_email_unique").on(table.email),
]);

export const users = pgTable("users", {
	id: text().primaryKey().notNull(),
	name: text(),
	email: text(),
	emailVerified: timestamp({ mode: 'string' }),
	image: text(),
	passwordHash: text("password_hash"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { mode: 'string' }),
	username: text(),
	title: text(),
	avatar: text(),
	roleId: text("role_id"),
	status: text().default('active'),
	createdBy: text("created_by").default('system'),
}, (table) => [
	unique("users_email_unique").on(table.email),
	unique("users_username_unique").on(table.username),
]);

export const authenticators = pgTable("authenticators", {
	credentialId: text().notNull(),
	userId: text().notNull(),
	providerAccountId: text().notNull(),
	credentialPublicKey: text().notNull(),
	counter: integer().notNull(),
	credentialDeviceType: text().notNull(),
	credentialBackedUp: boolean().notNull(),
	transports: text(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "authenticators_userId_users_id_fk"
		}).onDelete("cascade"),
	unique("authenticators_credentialID_unique").on(table.credentialId),
]);

export const sessions = pgTable("sessions", {
	sessionToken: text().primaryKey().notNull(),
	userId: text().notNull(),
	expires: timestamp({ mode: 'string' }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "sessions_userId_users_id_fk"
		}).onDelete("cascade"),
]);

export const comments = pgTable("comments", {
	id: text().primaryKey().notNull(),
	content: text().notNull(),
	rating: integer().default(0).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { mode: 'string' }),
	userId: text().notNull(),
	itemId: text().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "comments_userId_users_id_fk"
		}).onDelete("cascade"),
]);

export const votes = pgTable("votes", {
	id: text().primaryKey().notNull(),
	itemId: text("item_id").notNull(),
	voteType: text("vote_type").default('upvote').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	userid: text().notNull(),
}, (table) => [
	index("item_votes_idx").using("btree", table.itemId.asc().nullsLast().op("text_ops")),
	uniqueIndex("unique_user_item_vote_idx").using("btree", table.userid.asc().nullsLast().op("text_ops"), table.itemId.asc().nullsLast().op("text_ops")),
	index("votes_created_at_idx").using("btree", table.createdAt.asc().nullsLast().op("timestamp_ops")),
	foreignKey({
			columns: [table.userid],
			foreignColumns: [users.id],
			name: "votes_userid_users_id_fk"
		}).onDelete("cascade"),
]);

export const roles = pgTable("roles", {
	id: text().primaryKey().notNull(),
	name: text().notNull(),
	description: text(),
	status: text().default('active'),
	permissions: text().notNull(),
	createdBy: text("created_by").default('system'),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("roles_created_at_idx").using("btree", table.createdAt.asc().nullsLast().op("timestamp_ops")),
	index("roles_status_idx").using("btree", table.status.asc().nullsLast().op("text_ops")),
]);

export const activityLogs = pgTable("activityLogs", {
	id: serial().primaryKey().notNull(),
	userId: text(),
	action: text().notNull(),
	timestamp: timestamp({ mode: 'string' }).defaultNow().notNull(),
	ipAddress: varchar("ip_address", { length: 45 }),
	clientId: text(),
}, (table) => [
	index("activity_logs_client_idx").using("btree", table.clientId.asc().nullsLast().op("text_ops")),
	index("activity_logs_user_idx").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "activityLogs_userId_users_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.clientId],
			foreignColumns: [clientProfiles.id],
			name: "activityLogs_clientId_client_profiles_id_fk"
		}).onDelete("cascade"),
]);

export const subscriptionHistory = pgTable("subscription_history", {
	id: text().primaryKey().notNull(),
	subscriptionId: text("subscription_id").notNull(),
	action: text().notNull(),
	previousStatus: text("previous_status"),
	newStatus: text("new_status"),
	previousPlan: text("previous_plan"),
	newPlan: text("new_plan"),
	reason: text(),
	metadata: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("subscription_action_idx").using("btree", table.action.asc().nullsLast().op("text_ops")),
	index("subscription_history_created_at_idx").using("btree", table.createdAt.asc().nullsLast().op("timestamp_ops")),
	index("subscription_history_idx").using("btree", table.subscriptionId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.subscriptionId],
			foreignColumns: [subscriptions.id],
			name: "subscription_history_subscription_id_subscriptions_id_fk"
		}).onDelete("cascade"),
]);

export const accounts = pgTable("accounts", {
	userId: text().notNull(),
	type: text().notNull(),
	provider: text().notNull(),
	providerAccountId: text().notNull(),
	refreshToken: text("refresh_token"),
	accessToken: text("access_token"),
	expiresAt: integer("expires_at"),
	tokenType: text("token_type"),
	scope: text(),
	idToken: text("id_token"),
	sessionState: text("session_state"),
	trialStartDate: timestamp("trial_start_date", { mode: 'string' }),
	trialEndDate: timestamp("trial_end_date", { mode: 'string' }),
	subscriptionStartDate: timestamp("subscription_start_date", { mode: 'string' }),
	subscriptionEndDate: timestamp("subscription_end_date", { mode: 'string' }),
	lastLoginAt: timestamp("last_login_at", { mode: 'string' }),
	lastActivityAt: timestamp("last_activity_at", { mode: 'string' }),
	emailNotifications: boolean("email_notifications").default(true),
	marketingEmails: boolean("marketing_emails").default(false),
	notes: text(),
	tags: text(),
	email: text(),
	passwordHash: text("password_hash"),
	userType: text("user_type").default('client').notNull(),
}, (table) => [
	uniqueIndex("accounts_credentials_email_unique").using("btree", table.email.asc().nullsLast().op("text_ops")).where(sql`((provider = 'credentials'::text) AND (email IS NOT NULL))`),
	index("accounts_email_idx").using("btree", table.email.asc().nullsLast().op("text_ops")),
	index("accounts_userId_userType_idx").using("btree", table.userId.asc().nullsLast().op("text_ops"), table.userType.asc().nullsLast().op("text_ops")),
]);

export const subscriptions = pgTable("subscriptions", {
	id: text().primaryKey().notNull(),
	userId: text("userId").notNull(),
	planId: text("plan_id").notNull(),
	status: text().notNull(),
	startDate: timestamp("start_date", { mode: 'string' }).notNull(),
	endDate: timestamp("end_date", { mode: 'string' }),
	paymentProvider: text("payment_provider").notNull(),
	subscriptionId: text("subscription_id"),
	invoiceId: text("invoice_id"),
	amountDue: integer("amount_due").default(0),
	amountPaid: integer("amount_paid").default(0),
	priceId: text("price_id"),
	customerId: text("customer_id"),
	currency: text("currency").default('usd'),
	amount: integer().default(0),
	interval: text("interval").default('month'),
	intervalCount: integer("interval_count").default(1),
	trialStart: timestamp("trial_start", { mode: 'string' }),
	trialEnd: timestamp("trial_end", { mode: 'string' }),
	cancelledAt: timestamp("cancelled_at", { mode: 'string' }),
	cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false),
	cancelReason: text("cancel_reason"),
	hostedInvoiceUrl: text("hosted_invoice_url"),
	invoicePdf: text("invoice_pdf"),
	metadata: text("metadata"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("user_subscription_idx").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	index("subscription_status_idx").using("btree", table.status.asc().nullsLast().op("text_ops")),
	uniqueIndex("provider_subscription_idx").using("btree", table.paymentProvider.asc().nullsLast().op("text_ops"), table.subscriptionId.asc().nullsLast().op("text_ops")),
	index("subscription_plan_idx").using("btree", table.planId.asc().nullsLast().op("text_ops")),
	index("subscription_created_at_idx").using("btree", table.createdAt.asc().nullsLast().op("timestamp_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "subscriptions_userId_users_id_fk"
		}).onDelete("cascade"),
]);

export const clientProfiles = pgTable("client_profiles", {
	id: text().primaryKey().notNull(),
	displayName: text("display_name"),
	username: text(),
	bio: text(),
	jobTitle: text("job_title"),
	company: text(),
	industry: text(),
	phone: text(),
	website: text(),
	location: text(),
	accountType: text("account_type").default('individual'),
	status: text().default('active'),
	plan: text().default('free'),
	timezone: text().default('UTC'),
	language: text().default('en'),
	twoFactorEnabled: boolean("two_factor_enabled").default(false),
	emailVerified: boolean("email_verified").default(false),
	totalSubmissions: integer("total_submissions").default(0),
	notes: text(),
	tags: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	email: text(),
	name: text(),
	userId: text().notNull(),
}, (table) => [
	index("client_profile_account_type_idx").using("btree", table.accountType.asc().nullsLast().op("text_ops")),
	index("client_profile_created_at_idx").using("btree", table.createdAt.asc().nullsLast().op("timestamp_ops")),
	index("client_profile_email_idx").using("btree", table.email.asc().nullsLast().op("text_ops")),
	index("client_profile_plan_idx").using("btree", table.plan.asc().nullsLast().op("text_ops")),
	index("client_profile_status_idx").using("btree", table.status.asc().nullsLast().op("text_ops")),
	index("client_profile_user_id_idx").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	index("client_profile_username_idx").using("btree", table.username.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "client_profiles_userId_users_id_fk"
		}).onDelete("cascade"),
	unique("client_profiles_username_unique").on(table.username),
	unique("client_profiles_email_unique").on(table.email),
]);

export const paymentProviders = pgTable("paymentProviders", {
	id: text().primaryKey().notNull(),
	name: text().notNull(),
	isActive: boolean("is_active").default(true).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("payment_provider_active_idx").using("btree", table.isActive.asc().nullsLast().op("bool_ops")),
	index("payment_provider_created_at_idx").using("btree", table.createdAt.asc().nullsLast().op("timestamp_ops")),
	unique("paymentProviders_name_unique").on(table.name),
]);

export const paymentAccounts = pgTable("paymentAccounts", {
	id: text().primaryKey().notNull(),
	userId: text().notNull(),
	providerId: text().notNull(),
	customerId: text().notNull(),
	accountId: text(),
	lastUsed: timestamp({ mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	uniqueIndex("customer_provider_unique_idx").using("btree", table.customerId.asc().nullsLast().op("text_ops"), table.providerId.asc().nullsLast().op("text_ops")),
	index("payment_account_created_at_idx").using("btree", table.createdAt.asc().nullsLast().op("timestamp_ops")),
	index("payment_account_customer_id_idx").using("btree", table.customerId.asc().nullsLast().op("text_ops")),
	index("payment_account_provider_idx").using("btree", table.providerId.asc().nullsLast().op("text_ops")),
	uniqueIndex("user_provider_unique_idx").using("btree", table.userId.asc().nullsLast().op("text_ops"), table.providerId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "paymentAccounts_userId_users_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.providerId],
			foreignColumns: [paymentProviders.id],
			name: "paymentAccounts_providerId_paymentProviders_id_fk"
		}).onDelete("cascade"),
]);

export const verificationTokens = pgTable("verificationTokens", {
	identifier: text().notNull(),
	email: text().notNull(),
	token: text().notNull(),
	expires: timestamp({ mode: 'string' }).notNull(),
}, (table) => [
	index("verificationTokens_expires_idx").using("btree", table.expires.asc().nullsLast().op("timestamp_ops")),
	primaryKey({ columns: [table.identifier, table.token], name: "verificationTokens_identifier_token_pkey"}),
]);
