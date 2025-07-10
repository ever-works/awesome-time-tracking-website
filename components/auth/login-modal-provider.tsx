"use client";

import { LoginModal } from "./login-modal";
import { useLoginModal } from "@/hooks/use-login-modal";

export function LoginModalProvider() {
  const { isOpen, onClose, message } = useLoginModal();
  return <LoginModal isOpen={isOpen} onClose={onClose} message={message} />;
} 