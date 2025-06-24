import { getCachedConfig } from "../content";
import { EmailProviderFactory } from "./factory";

export interface EmailMessage {
  from: string;
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

export interface EmailProvider {
  sendEmail(message: EmailMessage): Promise<any>;
  getName(): string;
}

export interface EmailNovuConfig {
  templateId?: string;
  backendUrl?: string;
}

export interface EmailServiceConfig {
  provider: "resend" | "novu" | string;
  defaultFrom: string;
  apiKeys: Record<string, string>;
  domain: string;
  novu?: EmailNovuConfig;
}

export class EmailService {
  private provider: EmailProvider;
  private domain: string;
  private defaultFrom: string;

  constructor(config: EmailServiceConfig) {
    this.provider = EmailProviderFactory.createProvider(config);
    this.domain = config.domain;
    this.defaultFrom = config.defaultFrom;
  }

  async sendVerificationEmail(email: string, token: string): Promise<any> {
    const confirmLink = `${this.domain}/auth/new-verification?token=${token}`;
    return this.provider.sendEmail({
      from: this.defaultFrom,
      to: email,
      subject: "Confirm your email",
      html: `<p>Click <a href="${confirmLink}">here</a> to confirm email.</p>`,
    });
  }

  async sendNewsletterSubscriptionEmail(email: string): Promise<any> {
    return this.provider.sendEmail({
      from: this.defaultFrom,
      to: email,
      subject: "Welcome to the newsletter",
      html: `<p>Welcome to the newsletter.</p>`,
    });
  }

  async sendNewsletterUnsubscriptionEmail(email: string): Promise<any> {
    return this.provider.sendEmail({
      from: this.defaultFrom,
      to: email,
      subject: "Unsubscribe from the newsletter",
      html: `<p>You have been unsubscribed from the newsletter.</p>`,
    });
  }

  async sendPasswordResetEmail(email: string, token: string): Promise<any> {
    const resetLink = `${this.domain}/auth/new-password?token=${token}`;
    return this.provider.sendEmail({
      from: this.defaultFrom,
      to: email,
      subject: "Reset your password",
      html: `<p>Click <a href="${resetLink}">here</a> to reset password.</p>`,
    });
  }

  async sendTwoFactorTokenEmail(email: string, token: string): Promise<any> {
    return this.provider.sendEmail({
      from: this.defaultFrom,
      to: email,
      subject: "2FA Code",
      html: `<p>Your 2FA code: ${token}</p>`,
    });
  }

  async sendCustomEmail(message: EmailMessage): Promise<any> {
    return this.provider.sendEmail(message);
  }

  getProviderName(): string {
    return this.provider.getName();
  }
}

const emailConfig: EmailServiceConfig = {
  provider: process.env.EMAIL_PROVIDER || "resend", // Default to resend
  defaultFrom: process.env.EMAIL_FROM || "onboarding@resend.dev",
  domain: process.env.NEXT_PUBLIC_APP_URL || "",
  apiKeys: {
    resend: process.env.RESEND_API_KEY || "",
    novu: process.env.NOVU_API_KEY || "",
  },
};

async function mailService() {
  const config = await getCachedConfig();

  return new EmailService({
    ...emailConfig,
    provider: config.mail?.provider || emailConfig.provider,
    defaultFrom: config.mail?.default_from || emailConfig.defaultFrom,
    domain: config.app_url || emailConfig.domain,
    novu:
      config.mail?.provider === "novu"
        ? {
            templateId: config.mail?.template_id,
            backendUrl: config.mail?.backend_url,
          }
        : undefined,
  });
}

export const sendVerificationEmail = async (email: string, token: string) => {
  const service = await mailService();
  return service.sendVerificationEmail(email, token);
};

export const sendPasswordResetEmail = async (email: string, token: string) => {
  const service = await mailService();
  return service.sendPasswordResetEmail(email, token);
};

export const sendNewsletterSubscriptionEmail = async (email: string) => {
  const service = await mailService();
  return service.sendNewsletterSubscriptionEmail(email);
};

export const sendNewsletterUnsubscriptionEmail = async (email: string) => {
  const service = await mailService();
  return service.sendNewsletterUnsubscriptionEmail(email);
};

export const sendTwoFactorTokenEmail = async (email: string, token: string) => {
  const service = await mailService();
  return service.sendTwoFactorTokenEmail(email, token);
};
