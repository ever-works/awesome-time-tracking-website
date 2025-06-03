"use client";

import { useConfig } from "@/app/[locale]/config";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { ArrowUp } from "lucide-react";
import { ThemeToggler } from "../theme-toggler";
import { FiFacebook, FiLinkedin } from "react-icons/fi";
import { IconEverworksSimple, IconGithub, IconX } from "../icons/Icons";
import { Divider } from "@heroui/react";

/**
 * Footer component for the application
 * Provides navigation links, social media connections, and copyright information
 */
export function Footer() {
  const t = useTranslations();
  const config = useConfig();

  // Scroll to top handler
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Data structure for footer navigation links
  const footerNavigation = {
    product: [
      { label: t("footer.SEARCH"), href: "#" },
      { label: t("footer.COLLECTION"), href: "#" },
      { label: t("footer.TAG"), href: "#" },
    ],
    resources: [
      { label: t("footer.BLOG"), href: "#" },
      { label: t("footer.PRICING"), href: "#" },
      { label: t("footer.SUBMIT"), href: "#" },
      { label: t("footer.STUDIO"), href: "#" },
    ],
    pages: [
      { label: t("common.DISCOVER"), href: "/discover" },
      { label: t("common.CATEGORY"), href: "/categories" },
      { label: t("common.TAG"), href: "/tags" },
      { label: t("common.DIRECTORY"), href: "/directory" },
    ],
    company: [
      { label: t("footer.ABOUT_US"), href: "/about" },
      { label: t("footer.PRIVACY_POLICY"), href: "/privacy-policy" },
      { label: t("footer.TERMS_OF_SERVICE"), href: "/terms-of-service" },
      { label: t("footer.SITEMAP"), href: "/sitemap" },
    ],
  };

  // Social media links
  const socialLinks = [
    {
      icon: IconGithub,
      href: "https://github.com/ever-works",
      label: "GitHub",
    },
    {
      icon: IconX,
      href: "https://x.com/everplatform",
      label: "X",
    },
    {
      icon: FiLinkedin,
      href: "https://www.linkedin.com/company/everworks",
      label: "LinkedIn",
    },
    {
      icon: FiFacebook,
      href: "https://www.facebook.com/everworks",
      label: "Facebook",
    },
  ];

  // Category labels mapping
  const categoryLabels = {
    product: t("footer.PRODUCT"),
    resources: t("footer.RESOURCES"),
    pages: t("footer.PAGES"),
    company: t("footer.COMPANY"),
  };

  return (
    <footer className="relative w-full overflow-hidden">
      {/* Sophisticated Background with Advanced Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Gradient orbs */}
        <div className="absolute top-0 -left-4 w-72 h-72 bg-gradient-to-r from-blue-500/10 to-purple-500/10 dark:from-blue-600/20 dark:to-purple-600/20 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute top-0 -right-4 w-72 h-72 bg-gradient-to-r from-purple-500/10 to-pink-500/10 dark:from-purple-600/20 dark:to-pink-600/20 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 dark:from-blue-600/20 dark:to-cyan-600/20 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10">
        {/* Main footer content with glassmorphism */}
        <div className="backdrop-blur-xl bg-white/10 dark:bg-black/10 border-t border-white/20 dark:border-gray-700/30">
          <div className="container mx-auto px-6 lg:px-8 pt-20 pb-12">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 lg:gap-8">
              {/* Enhanced Brand and social section */}
              <div className="lg:col-span-2 space-y-8">
                <BrandLink t={t} />
                <SocialLinks t={t} socialLinks={socialLinks} />
                <Newsletter t={t} />
              </div>

              {/* Enhanced Navigation links section */}
              <div className="lg:col-span-3 grid grid-cols-2 md:grid-cols-4 gap-8">
                {Object.entries(footerNavigation).map(
                  ([category, links], categoryIndex) => (
                    <FooterLinkGroup
                      key={category}
                      links={links}
                      categoryLabel={
                        categoryLabels[category as keyof typeof categoryLabels]
                      }
                      animationDelay={(categoryIndex + 2) * 0.1}
                    />
                  )
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Footer bottom section */}
        <FooterBottom config={config} t={t} scrollToTop={scrollToTop} />
      </div>
    </footer>
  );
}

/**
 * Enhanced Brand link component
 */
function BrandLink({ t }: { t: any }) {
  return (
    <div
      className="space-y-6 animate-fade-in-up"
      style={{ animationDelay: "0.1s" }}
    >
      <Link
        href="https://ever.works"
        className="group inline-flex items-center gap-3 px-4 py-3 rounded-2xl bg-gradient-to-r from-white/60 to-white/40 dark:from-gray-800/60 dark:to-gray-900/40 backdrop-blur-lg border border-gray-200 dark:border-gray-700/40 hover:border-blue-300/50 dark:hover:border-blue-500/30 transition-all duration-500 hover:shadow-xl hover:shadow-blue-500/10 hover:scale-105 w-fit"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600 dark:text-gray-400 group-hover:text-gray-800 dark:group-hover:text-gray-200 transition-colors">
            {t("footer.BUILT_WITH")}
          </span>
          <div className="relative w-5 h-5">
            <IconEverworksSimple className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>
          <span className="text-sm text-gray-600 dark:text-gray-400 group-hover:text-gray-800 dark:group-hover:text-gray-200 transition-colors">
            Works
          </span>
        </div>
      </Link>
    </div>
  );
}

/**
 * Enhanced Social links component
 */
function SocialLinks({
  t,
  socialLinks,
}: {
  t: any;
  socialLinks: Array<{ icon: any; href: string; label: string }>;
}) {
  return (
    <div
      className="space-y-6 animate-fade-in-up"
      style={{ animationDelay: "0.2s" }}
    >
      <h4 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">
        {t("footer.CONNECT_WITH_US")}
      </h4>
      <div className="flex items-center gap-4">
        {socialLinks.map((social, index) => (
          <a
            key={index}
            href={social.href}
            className="group relative p-4 rounded-2xl bg-gradient-to-br from-white/50 to-white/30 dark:from-gray-800/50 dark:to-gray-900/30 backdrop-blur-lg border border-white/30 dark:border-gray-700/40 hover:border-blue-300/50 dark:hover:border-blue-500/30 transition-all duration-500 hover:shadow-xl hover:shadow-blue-500/10 hover:scale-110 hover:-translate-y-1"
            aria-label={social.label}
            style={{ animationDelay: `${0.3 + index * 0.1}s` }}
          >
            <social.icon className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-all duration-300 group-hover:scale-110" />

            {/* Hover effect overlay */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500/0 to-purple-500/0 group-hover:from-blue-500/10 group-hover:to-purple-500/10 transition-all duration-500" />

            {/* Ripple effect */}
            <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="absolute inset-0 rounded-2xl bg-blue-500/20 animate-ping" />
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}

/**
 * Newsletter subscription component
 */
function Newsletter({ t }: { t: any }) {
  return (
    <div
      className="space-y-4 animate-fade-in-up"
      style={{ animationDelay: "0.4s" }}
    >
      <h4 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">
        {t("footer.STAY_UPDATED")}
      </h4>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        {t("footer.NEWSLETTER_DESCRIPTION")}
      </p>
      <div className="flex gap-2">
        <input
          type="email"
          placeholder={t("footer.ENTER_EMAIL")}
          className="flex-1 px-4 py-3 rounded-xl bg-white/50 dark:bg-gray-800/50 backdrop-blur-lg border border-white/30 dark:border-gray-700/40 focus:border-blue-300/50 dark:focus:border-blue-500/30 focus:outline-none transition-all duration-300 text-sm placeholder-gray-500 dark:placeholder-gray-400"
        />
        <button className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-medium transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/25 hover:scale-105 text-sm">
          {t("footer.SUBSCRIBE")}
        </button>
      </div>
    </div>
  );
}

/**
 * Enhanced Footer link group component
 */
function FooterLinkGroup({
  links,
  categoryLabel,
  animationDelay,
}: {
  links: Array<{ label: string; href: string }>;
  categoryLabel: string;
  animationDelay: number;
}) {
  return (
    <div
      className="space-y-6 animate-fade-in-up"
      style={{ animationDelay: `${animationDelay}s` }}
    >
      <h4 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">
        {categoryLabel}
      </h4>
      <ul className="space-y-3">
        {links.map((link, index) => (
          <li key={index}>
            <Link
              href={link.href}
              className="group inline-flex items-center text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-300 hover:translate-x-2"
            >
              <span className="text-sm font-medium">{link.label}</span>
              <div className="w-0 h-px bg-gradient-to-r from-blue-500 to-purple-500 group-hover:w-4 ml-0 group-hover:ml-2 transition-all duration-300" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Enhanced Footer bottom component with copyright, legal links and utilities
 */
function FooterBottom({
  config,
  t,
  scrollToTop,
}: {
  config: any;
  t: any;
  scrollToTop: () => void;
}) {
  return (
    <div className="relative backdrop-blur-xl bg-white/5 dark:bg-black/5 border-t border-white/10 dark:border-gray-700/20">
      {/* Subtle animated background */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-500/5 to-transparent animate-shimmer-slow" />

      <div className="relative container mx-auto px-6 lg:px-8 py-8">
        {/* Enhanced Disclaimer and utilities */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pt-6">
          <div className="flex items-center gap-1 w-[165px]">
            <IconEverworksSimple className="text-gray-900 dark:text-white h-[92px] w-[165.22px]" />
            <span className="text-gray-900 dark:text-white text-2xl font-bold">
              Works
            </span>
          </div>
          <div className="flex flex-col gap-6">
            <nav className="flex items-center flex-wrap gap-2 text-gray-600 dark:text-gray-400 font-bold">
              <div className="text-gray-600 dark:text-gray-400">
                <span className="font-bold">
                  Copyright &copy;{" "}
                  {config.copyright_year || new Date().getFullYear()}{" "}
                  <span className="text-sm font-bold text-gray-600 dark:text-gray-400 group-hover:text-gray-800 dark:group-hover:text-gray-200 transition-colors">
                    {config.company_name}
                  </span>
                </span>
                <span className="hidden sm:inline ml-1">
                  {t("footer.ALL_RIGHTS_RESERVED")}.
                </span>
              </div>
              {[
                { label: t("footer.TERMS_OF_SERVICE"), href: "/terms" },
                { label: t("footer.PRIVACY_POLICY"), href: "/privacy" },
                { label: t("footer.COOKIES"), href: "/cookies" },
              ].map((item, index) => (
                <Link
                  key={index}
                  href={item.href}
                  className="font-bold text-[16px] flex items-center transition-all duration-300 hover:scale-105 relative group"
                >
                  <Divider
                    orientation="vertical"
                    className="mr-2 h-[16px] w-[2px] bg-gray-600"
                  />
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="text-[16px] font-medium text-gray-500 dark:text-gray-500 max-w-3xl">
              *{t("footer.DISCLAIMER")}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <ThemeToggler compact />

            {/* Enhanced scroll to top button */}
            <button
              onClick={scrollToTop}
              className="group relative p-3 rounded-2xl bg-gradient-to-br from-white/50 to-white/30 dark:from-gray-800/50 dark:to-gray-900/30 backdrop-blur-lg border border-white/30 dark:border-gray-700/40 hover:border-blue-300/50 dark:hover:border-blue-500/30 transition-all duration-500 hover:shadow-xl hover:shadow-blue-500/10 hover:scale-110 hover:-translate-y-1"
              aria-label="Scroll to top"
            >
              <ArrowUp className="w-4 h-4 text-gray-600 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-all duration-300 group-hover:scale-110" />

              {/* Hover effect overlay */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500/0 to-purple-500/0 group-hover:from-blue-500/10 group-hover:to-purple-500/10 transition-all duration-500" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
