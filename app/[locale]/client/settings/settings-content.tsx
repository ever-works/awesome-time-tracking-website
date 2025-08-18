"use client";

import { Container } from "@/components/ui/container";
import { Card, CardContent } from "@/components/ui/card";
import { FiUser, FiDroplet, FiBriefcase, FiFileText, FiArrowRight, FiCreditCard } from "react-icons/fi";
import { useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";

interface SettingsCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
}

function SettingsCard({ title, description, icon, href }: SettingsCardProps) {
  return (
    <Link href={href} className="block group">
      <Card className="h-full hover:shadow-lg hover:shadow-theme-primary-500/10 border border-gray-200 dark:border-gray-800 transition-all duration-300 hover:scale-[1.02] cursor-pointer group-hover:border-theme-primary-300 dark:group-hover:border-theme-primary-600 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4 flex-1">
              <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-theme-primary-100 to-theme-primary-200 dark:from-theme-primary-900/40 dark:to-theme-primary-800/40 rounded-xl flex items-center justify-center group-hover:from-theme-primary-200 group-hover:to-theme-primary-300 dark:group-hover:from-theme-primary-800/60 dark:group-hover:to-theme-primary-700/60 transition-all duration-300 shadow-sm">
                {icon}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-lg group-hover:text-theme-primary-700 dark:group-hover:text-theme-primary-400 transition-colors mb-1">
                  {title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                  {description}
                </p>
              </div>
            </div>
            <FiArrowRight className="w-5 h-5 text-gray-400 group-hover:text-theme-primary-500 group-hover:translate-x-1 transition-all duration-300" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export function SettingsContent() {
  const locale = useLocale();

  const settingsCards = [
    {
      id: "basic-info",
      title: "Basic Information",
      description: "Update your name, bio, location, and contact details to personalize your profile",
      icon: <FiUser className="w-5 h-5 text-theme-primary-600 dark:text-theme-primary-400" />,
      href: `/client/settings/profile/basic-info`
    },
    {
      id: "security",
      title: "Security & Password",
      description: "Change your password, enable two-factor authentication, and manage account security",
      icon: <svg className="w-5 h-5 text-theme-primary-600 dark:text-theme-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>,
      href: `/client/settings/security`
    },
    {
      id: "theme-colors",
      title: "Theme & Appearance",
      description: "Customize your profile colors and visual style to match your brand",
      icon: <FiDroplet className="w-5 h-5 text-theme-primary-600 dark:text-theme-primary-400" />,
      href: `/client/settings/profile/theme-colors`
    },
    {
      id: "portfolio",
      title: "Portfolio Management",
      description: "Add, edit, and organize your portfolio projects to showcase your work",
      icon: <FiBriefcase className="w-5 h-5 text-theme-primary-600 dark:text-theme-primary-400" />,
      href: `/client/settings/profile/portfolio`
    },
    {
      id: "submissions",
      title: "Submissions",
      description: "Manage your directory submissions and track their approval status",
      icon: <FiFileText className="w-5 h-5 text-theme-primary-600 dark:text-theme-primary-400" />,
      href: `/client/settings/profile/submissions`
    },
    {
      id: "billing",
      title: "Billing",
      description: "Manage your billing information and subscription details",
      icon: <FiCreditCard className="w-5 h-5 text-theme-primary-600 dark:text-theme-primary-400" />,
      href: `/${locale}/settings/billing`
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <Container maxWidth="7xl" padding="default">
        <div className="space-y-12 py-8">
          {/* Section Header */}
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-theme-primary-100 to-theme-primary-200 dark:from-theme-primary-900/40 dark:to-theme-primary-800/40 rounded-2xl mb-4">
              <FiUser className="w-8 h-8 text-theme-primary-600 dark:text-theme-primary-400" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-3">
              Profile Settings
            </h1>
          </div>

          {/* Settings Grid Panel */}
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {settingsCards.map((card) => (
                <SettingsCard
                  key={card.id}
                  title={card.title}
                  description={card.description}
                  icon={card.icon}
                  href={card.href}
                />
              ))}
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
