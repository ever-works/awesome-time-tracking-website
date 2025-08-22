import { useState, useCallback } from 'react';
import { useLemonSqueezyCheckoutWithRedirect, useLemonSqueezyEmbeddedCheckout } from '@/hooks/use-lemonsqueezy-queries';

export interface CheckoutButtonParams {
  defaultEmail?: string;
  defaultPrice?: number;
  variantId?: number;
  metadata?: Record<string, any>;
  embedded?: boolean;
}

export interface CheckoutButtonState {
  customPrice: number | undefined;
  showForm: boolean;
  isLoading: boolean;
  error: Error | null;
  isError: boolean;
  checkoutUrl: string | null;
  isEmbedReady: boolean;
}

export interface CheckoutButtonActions {
  setCustomPrice: (price: number | undefined) => void;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  handleClick: () => Promise<void>;
  handlePriceChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  clearCheckout: () => void;
}

export interface UseCheckoutButtonReturn extends CheckoutButtonState, CheckoutButtonActions {}

/**
 * Custom hook that encapsulates all CheckoutButton logic
 */
export function useCheckoutButton(params: CheckoutButtonParams): UseCheckoutButtonReturn {
  const { defaultEmail = '', defaultPrice, variantId, metadata = {}, embedded = false } = params;

  // Local state
  const [customPrice, setCustomPrice] = useState<number | undefined>(defaultPrice);
  const [showForm] = useState(!defaultEmail);

  // Hooks based on embedded mode
  const redirectHook = useLemonSqueezyCheckoutWithRedirect();
  const embeddedHook = useLemonSqueezyEmbeddedCheckout();
  
  const currentHook = embedded ? embeddedHook : redirectHook;
  const { isLoading, error, isError } = currentHook;

  // Extract embedded-specific state
  const checkoutUrl = embedded ? embeddedHook.checkoutUrl : null;
  const isEmbedReady = embedded ? embeddedHook.isEmbedReady : true;

  /**
   * Create checkout parameters with metadata
   */
  const createCheckoutParams = useCallback(() => ({
    customPrice,
    variantId,
    metadata: {
      ...metadata,
      source: 'checkout-button',
      timestamp: new Date().toISOString(),
    },
  }), [customPrice, variantId, metadata]);

  /**
   * Execute checkout based on mode
   */
  const executeCheckout = useCallback(async () => {
    const checkoutParams = createCheckoutParams();
    try {
      if (embedded) {
        await embeddedHook.createEmbeddedCheckout(checkoutParams);
      } else {
        await redirectHook.createCheckoutAndRedirect(checkoutParams);
      }
    } catch (err) {
      console.error('Checkout failed:', err);
      throw err;
    }
  }, [embedded, embeddedHook, redirectHook, createCheckoutParams]);

  /**
   * Handle form submission
   */
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    await executeCheckout();
  }, [executeCheckout]);

  /**
   * Handle simple button click
   */
  const handleClick = useCallback(async () => {
    await executeCheckout();
  }, [executeCheckout]);

  /**
   * Handle price input change
   */
  const handlePriceChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '') {
      setCustomPrice(undefined);
    } else {
      const price = parseInt(value, 10);
      if (!isNaN(price) && price >= 0) {
        setCustomPrice(price);
      }
    }
  }, []);

  /**
   * Clear checkout (for embedded mode)
   */
  const clearCheckout = useCallback(() => {
    if (embedded && embeddedHook.clearCheckout) {
      embeddedHook.clearCheckout();
    }
  }, [embedded, embeddedHook]);

  return {
    // State
    customPrice,
    showForm,
    isLoading,
    error,
    isError,
    checkoutUrl,
    isEmbedReady,
    
    // Actions
    setCustomPrice,
    handleSubmit,
    handleClick,
    handlePriceChange,
    clearCheckout,
  };
}
