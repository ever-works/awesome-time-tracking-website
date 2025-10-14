import { memo, useMemo } from "react";
import { useTranslations } from "next-intl";
import {
  User,
  Settings,
  FolderTree,
  Tag,
  Package,
  Shield,
  Users,
  Zap,
  Star,
  Activity,
  MessageSquare,
  type LucideIcon
} from "lucide-react";
import type { ExtendedUser } from "@/types/profile-button.types";

interface MenuItemsComponentProps {
  user: ExtendedUser;
  profilePath: string;
  onItemClick: () => void;
  onNavigationStart?: () => void;
  onNavigationEnd?: () => void;
  isNavigating?: boolean;
}

function MenuItems({ user, profilePath, onItemClick, onNavigationStart, isNavigating }: MenuItemsComponentProps) {
  // Derive isAdmin from user prop
  const isAdmin = user.isAdmin === true;
  const t = useTranslations();

  // Simplified navigation handler
  const handleNavigation = (href: string) => {
    onNavigationStart?.();
    onItemClick(); // Close menu immediately

    // Use window.location for immediate page transition with loading
    window.location.href = href;
  };

  // Memoize translations to prevent unnecessary re-renders
  const translations = useMemo(() => ({
    analyticsDashboard: t("common.ANALYTICS_DASHBOARD"),
    category: t("common.CATEGORY"),
    tag: t("common.TAG"),
    items: t("common.ITEMS"),
    comments: t("common.COMMENTS"),
    userManagement: t("common.USER_MANAGEMENT"),
    settings: t("settings.SETTINGS"),
    yourProfile: t("common.YOUR_PROFILE"),
    yourProfileDesc: t("common.YOUR_PROFILE_DESC"),
    accountSettingsDesc: t("settings.ACCOUNT_SETTINGS_DESC"),
  }), [t]);

  // Simplified menu item component
  const MenuItem = ({
    href,
    icon: Icon,
    title,
    description,
    gradientFrom,
    gradientTo,
    iconColor,
    endIcon: EndIcon = Zap
  }: {
    href: string;
    icon: LucideIcon;
    title: string;
    description: string;
    gradientFrom: string;
    gradientTo: string;
    iconColor: string;
    endIcon?: LucideIcon;
  }) => {
    return (
      <button
        type="button"
        onClick={() => handleNavigation(href)}
        disabled={isNavigating}
        className="group flex items-center px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-50 dark:hover:from-gray-700/50 dark:hover:to-gray-700/50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 w-full text-left disabled:opacity-50 disabled:cursor-not-allowed"
        role="menuitem"
      >
        <div className={`flex items-center justify-center w-10 h-10 mr-3 rounded-xl bg-gradient-to-br ${gradientFrom} ${gradientTo} group-hover:from-opacity-80 group-hover:to-opacity-80 transition-all duration-200`}>
          <Icon aria-hidden="true" className={`h-5 w-5 ${iconColor}`} />
        </div>
        <div className="flex-1">
          <span className="font-semibold">{title}</span>
          <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>
        </div>
        <EndIcon aria-hidden="true" className="h-4 w-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
      </button>
    );
  };

  if (isAdmin) {
    return (
      <div className="py-1 max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
        <MenuItem
          href="/admin"
          icon={Settings}
          title={translations.analyticsDashboard}
          description={t("common.ANALYTICS_DASHBOARD_DESC")}
          gradientFrom="from-blue-100"
          gradientTo="to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30"
          iconColor="text-theme-primary-600 dark:text-theme-primary-400"
        />

        <MenuItem
          href="/admin/clients"
          icon={Users}
          title={t("common.MANAGE_CLIENTS")}
          description={t("common.MANAGE_CLIENTS_DESC")}
          gradientFrom="from-green-100"
          gradientTo="to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30"
          iconColor="text-green-600 dark:text-green-400"
          endIcon={Activity}
        />

        <MenuItem
          href="/admin/categories"
          icon={FolderTree}
          title={translations.category}
          description={t("common.MANAGE_CATEGORIES_DESC")}
          gradientFrom="from-purple-100"
          gradientTo="to-violet-100 dark:from-purple-900/30 dark:to-violet-900/30"
          iconColor="text-purple-600 dark:text-purple-400"
          endIcon={Star}
        />

        <MenuItem
          href="/admin/tags"
          icon={Tag}
          title={translations.tag}
          description={t("common.MANAGE_TAGS_DESC")}
          gradientFrom="from-indigo-100"
          gradientTo="to-blue-100 dark:from-indigo-900/30 dark:to-blue-900/30"
          iconColor="text-indigo-600 dark:text-indigo-400"
        />

        <MenuItem
          href="/admin/items"
          icon={Package}
          title={translations.items}
          description={t("common.MANAGE_ITEMS_DESC")}
          gradientFrom="from-orange-100"
          gradientTo="to-amber-100 dark:from-orange-900/30 dark:to-amber-900/30"
          iconColor="text-orange-600 dark:text-orange-400"
          endIcon={Activity}
        />

        <MenuItem
          href="/admin/comments"
          icon={MessageSquare}
          title={translations.comments}
          description={t("common.MANAGE_COMMENTS_DESC")}
          gradientFrom="from-blue-100"
          gradientTo="to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30"
          iconColor="text-blue-600 dark:text-blue-400"
        />

        <MenuItem
          href="/admin/roles"
          icon={Shield}
          title={t("common.ROLES")}
          description={t("common.MANAGE_USER_ROLES_DESC")}
          gradientFrom="from-red-100"
          gradientTo="to-pink-100 dark:from-red-900/30 dark:to-pink-900/30"
          iconColor="text-red-600 dark:text-red-400"
          endIcon={Star}
        />

        <MenuItem
          href="/admin/users"
          icon={Users}
          title={translations.userManagement}
          description={t("common.USER_MANAGEMENT_DESC")}
          gradientFrom="from-teal-100"
          gradientTo="to-cyan-100 dark:from-teal-900/30 dark:to-cyan-900/30"
          iconColor="text-teal-600 dark:text-teal-400"
        />
      </div>
    );
  }

  return (
    <div className="py-1 max-h-48 overflow-y-auto overscroll-contain scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
      <MenuItem
        href={profilePath}
        icon={User}
        title={translations.yourProfile}
        description={translations.yourProfileDesc}
        gradientFrom="from-blue-100"
        gradientTo="to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30"
        iconColor="text-theme-primary-600 dark:text-theme-primary-400"
      />

      <MenuItem
        href="/client/settings"
        icon={Settings}
        title={translations.settings}
        description={translations.accountSettingsDesc}
        gradientFrom="from-gray-100"
        gradientTo="to-slate-100 dark:from-gray-700 dark:to-slate-700"
        iconColor="text-gray-600 dark:text-gray-400"
        endIcon={Activity}
      />
    </div>
  );
}

// Export memoized component for better performance
export default memo(MenuItems);
