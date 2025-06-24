"use client";

import { useState, useEffect } from "react";
import { useActionState } from "react";
import { subscribeToNewsletter } from "@/app/[locale]/newsletter/actions";
import { ActionState } from "@/lib/auth/middleware";
import { toast } from "sonner";

export function Newsletter({ t }: { t: any }) {
  const [isSuccess, setIsSuccess] = useState(false);
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    subscribeToNewsletter,
    {}
  );

  useEffect(() => {
    if (state.success) {
      setIsSuccess(true);
    }
  }, [state]);

  const handleFormAction = async (formData: FormData) => {
    return formAction(formData);
  };

  if (isSuccess) {
    toast.success(t("footer.SUBSCRIPTION_SUCCESS"),);
    setIsSuccess(false);
  }

  return (
    <div
      className="space-y-3 sm:space-y-4 animate-fade-in-up"
      style={{ animationDelay: "0.4s" }}
    >
      <h4 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white tracking-tight">
        {t("footer.STAY_UPDATED")}
      </h4>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        {t("footer.NEWSLETTER_DESCRIPTION")}
      </p>
      <form action={handleFormAction} className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="email"
            name="email"
            placeholder={t("footer.ENTER_EMAIL")}
            disabled={pending}
            className="flex-1 px-4 py-3 rounded-xl bg-white/50 dark:bg-gray-800/50 backdrop-blur-lg border border-white/30 dark:border-gray-700/40 focus:border-theme-primary dark:focus:border-theme-primary/30 focus:outline-none transition-all duration-300 text-sm placeholder-gray-500 dark:placeholder-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
            required
          />
          <button
            type="submit"
            disabled={pending}
            className="mt-2 sm:mt-0 w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 rounded-xl bg-gradient-to-r from-theme-primary via-purple-500 to-purple-500 hover:from-theme-primary hover:to-purple-600 text-white font-medium transition-all duration-300 hover:shadow-lg hover:shadow-theme-primary/25 hover:scale-105 text-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {pending
              ? t("footer.SUBMITTING") || "Submitting..."
              : t("footer.SUBSCRIBE")}
          </button>
        </div>
        {state?.error && (
          <p className="text-sm text-red-600 dark:text-red-400">
            {state.error}
          </p>
        )}
      </form>
    </div>
  );
}
