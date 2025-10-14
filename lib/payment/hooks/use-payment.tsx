'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { PaymentService } from '../lib/payment-service';
import { PaymentServiceManager } from '../lib/payment-service-manager';
import type { SupportedProvider, PaymentProviderConfig } from '../types/payment-types';

type PaymentContextType = {
  service: PaymentService | null;
  switchProvider: (provider: SupportedProvider) => Promise<void>;
  currentProvider: SupportedProvider;
  availableProviders: SupportedProvider[];
};

const PaymentContext = createContext<PaymentContextType | undefined>(undefined);

export function usePayment() {
  const context = useContext(PaymentContext);
  if (context === undefined) {
    throw new Error('usePayment must be used within a PaymentProvider');
  }
  return context;
}

interface PaymentProviderProps {
  children: ReactNode;
  providerConfigs: Record<SupportedProvider, PaymentProviderConfig>;
}

export function PaymentProvider({ children, providerConfigs }: PaymentProviderProps) {
  const [service, setService] = useState<PaymentService | null>(null);
  const [currentProvider, setCurrentProvider] = useState<SupportedProvider>('stripe');
  const [availableProviders, setAvailableProviders] = useState<SupportedProvider[]>([]);
  const serviceManager = PaymentServiceManager.getInstance(providerConfigs);

  useEffect(() => {
    setService(serviceManager.getPaymentService());
    setCurrentProvider(serviceManager.getCurrentProvider());
    setAvailableProviders(serviceManager.getAvailableProviders());
  }, [serviceManager]);

  const switchProvider = async (newProvider: SupportedProvider) => {
    await serviceManager.switchProvider(newProvider);
    setService(serviceManager.getPaymentService());
    setCurrentProvider(serviceManager.getCurrentProvider());
  };

  const value: PaymentContextType = {
    service,
    switchProvider,
    currentProvider,
    availableProviders,
  };

  return (
    <PaymentContext.Provider value={value}>
      {children}
    </PaymentContext.Provider>
  );
} 