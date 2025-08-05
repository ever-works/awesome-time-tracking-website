"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Lock, Shield, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useChangePassword } from "@/hooks/use-change-password";

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type PasswordFormData = z.infer<typeof passwordSchema>;

interface PasswordStrengthProps {
  password: string;
}

function PasswordStrength({ password }: PasswordStrengthProps) {
  const requirements = [
    { label: "At least 8 characters", test: (p: string) => p.length >= 8 },
    { label: "One uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
    { label: "One lowercase letter", test: (p: string) => /[a-z]/.test(p) },
    { label: "One number", test: (p: string) => /[0-9]/.test(p) },
    { label: "One special character", test: (p: string) => /[^A-Za-z0-9]/.test(p) },
  ];

  const score = requirements.filter(req => req.test(password)).length;
  const strength = score === 0 ? 0 : score <= 2 ? 1 : score <= 4 ? 2 : 3;
  const strengthLabels = ["", "Weak", "Fair", "Strong"];
  const strengthColors = ["", "text-red-500", "text-yellow-500", "text-green-500"];
  const barColors = ["", "bg-red-500", "bg-yellow-500", "bg-green-500"];

  return (
    <div className="space-y-3">
      {password && (
        <>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className={cn("h-2 rounded-full transition-all duration-300", barColors[strength])}
                style={{ width: `${(strength / 3) * 100}%` }}
              />
            </div>
            <span className={cn("text-sm font-medium", strengthColors[strength])}>
              {strengthLabels[strength]}
            </span>
          </div>
          <div className="space-y-1">
            {requirements.map((req, index) => (
              <div key={index} className="flex items-center gap-2 text-sm">
                {req.test(password) ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <div className="w-4 h-4 rounded-full border-2 border-gray-300 dark:border-gray-600" />
                )}
                <span className={cn(
                  req.test(password) ? "text-green-600 dark:text-green-400" : "text-gray-500 dark:text-gray-400"
                )}>
                  {req.label}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

interface PasswordInputProps {
  id: string;
  label: string;
  placeholder: string;
  error?: string;
  register: any;
  showStrength?: boolean;
  value?: string;
}

function PasswordInput({ id, label, placeholder, error, register, showStrength, value }: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
      </label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Lock className="h-5 w-5 text-gray-400" />
        </div>
        <input
          {...register(id)}
          type={showPassword ? "text" : "password"}
          id={id}
          placeholder={placeholder}
          aria-describedby={error ? `${id}-error` : showStrength ? `${id}-strength` : undefined}
          aria-invalid={error ? "true" : "false"}
          className={cn(
            "block w-full pl-10 pr-10 py-3 border rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-theme-primary-500 focus:border-theme-primary-500 transition-colors",
            error
              ? "border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/20"
              : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
          )}
        />
        <button
          type="button"
          className="absolute inset-y-0 right-0 pr-3 flex items-center"
          onClick={() => setShowPassword(!showPassword)}
          aria-label={showPassword ? "Hide password" : "Show password"}
        >
          {showPassword ? (
            <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
          ) : (
            <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
          )}
        </button>
      </div>
      {error && (
        <div id={`${id}-error`} className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400" role="alert">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}
      {showStrength && value && (
        <div id={`${id}-strength`} className="mt-3" aria-label="Password strength indicator">
          <PasswordStrength password={value} />
        </div>
      )}
    </div>
  );
}

export function ChangePasswordForm() {
  const [showSuccess, setShowSuccess] = useState(false);
  const {
    changePassword,
    isLoading,
    isSuccess,
    reset: resetMutation
  } = useChangePassword();

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isValid },
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    mode: "onChange",
  });

  const newPassword = watch("newPassword");

  // Handle success state from React Query
  React.useEffect(() => {
    if (isSuccess) {
      setShowSuccess(true);
      reset();

      // Hide success message after 5 seconds
      const timer = setTimeout(() => {
        setShowSuccess(false);
        resetMutation(); // Reset mutation state
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [isSuccess, reset, resetMutation]);

  const onSubmit = async (data: PasswordFormData) => {
    await changePassword(data);
  };

  if (showSuccess) {
    return (
      <Card className="border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 text-green-700 dark:text-green-300">
            <CheckCircle className="w-6 h-6" />
            <div>
              <h3 className="font-semibold">Password Changed Successfully!</h3>
              <p className="text-sm mt-1">
                Your password has been updated. A confirmation email has been sent to your registered email address.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-gray-200 dark:border-gray-800 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm shadow-lg">
      <CardHeader className="pb-4 border-b border-gray-100 dark:border-gray-800">
        <CardTitle className="text-xl font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <Shield className="w-5 h-5 text-theme-primary-500" />
          Change Password
        </CardTitle>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
          Update your password to keep your account secure
        </p>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <PasswordInput
            id="currentPassword"
            label="Current Password"
            placeholder="Enter your current password"
            error={errors.currentPassword?.message}
            register={register}
          />

          <PasswordInput
            id="newPassword"
            label="New Password"
            placeholder="Enter your new password"
            error={errors.newPassword?.message}
            register={register}
            showStrength={true}
            value={newPassword}
          />

          <PasswordInput
            id="confirmPassword"
            label="Confirm New Password"
            placeholder="Confirm your new password"
            error={errors.confirmPassword?.message}
            register={register}
          />

          <div className="flex gap-4 pt-4">
            <Button
              type="submit"
              disabled={!isValid || isLoading}
              className="flex-1 bg-theme-primary-600 hover:bg-theme-primary-700 text-white font-medium py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Updating Password...
                </div>
              ) : (
                "Update Password"
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => reset()}
              className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
