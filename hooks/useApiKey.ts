/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { createContext, useContext, useState, useCallback, PropsWithChildren } from 'react';
import ApiKeyDialog from '../components/ApiKeyDialog';

interface ApiKeyContextType {
  validateApiKey: () => Promise<boolean>;
  showApiKeyDialog: boolean;
  setShowApiKeyDialog: (show: boolean) => void;
}

const ApiKeyContext = createContext<ApiKeyContextType | null>(null);

export const ApiKeyProvider = ({ children }: PropsWithChildren<{}>) => {
  const [showApiKeyDialog, setShowApiKeyDialog] = useState(false);

  const handleApiKeyDialogContinue = useCallback(async () => {
    // @ts-ignore
    if (typeof window !== 'undefined' && window.aistudio && window.aistudio.openSelectKey) {
        try {
            // @ts-ignore
            await window.aistudio.openSelectKey();
            // Assume success if promise resolves (mitigate race condition)
            setShowApiKeyDialog(false);
        } catch (e) {
            console.error("Failed to open key selector", e);
            // If strictly needed, we could keep the dialog open here, 
            // but standard behavior is to let them try again.
        }
    } else {
        // Fallback or dev environment
        setShowApiKeyDialog(false);
    }
  }, []);

  const validateApiKey = useCallback(async (): Promise<boolean> => {
    // Check for the AI Studio specific API key selection method
    // @ts-ignore
    if (typeof window !== 'undefined' && window.aistudio && window.aistudio.hasSelectedApiKey) {
      // @ts-ignore
      const hasKey = await window.aistudio.hasSelectedApiKey();
      if (!hasKey) {
        setShowApiKeyDialog(true);
        return false;
      }
    }
    // If window.aistudio doesn't exist, we assume the environment (process.env.API_KEY) is set 
    // or handled externally, so we return true to allow the app to function.
    return true; 
  }, []);

  return React.createElement(
    ApiKeyContext.Provider,
    { value: { validateApiKey, showApiKeyDialog, setShowApiKeyDialog } },
    children,
    showApiKeyDialog ? React.createElement(ApiKeyDialog, { onContinue: handleApiKeyDialogContinue }) : null
  );
};

export const useApiKey = () => {
  const context = useContext(ApiKeyContext);
  if (!context) {
    throw new Error('useApiKey must be used within an ApiKeyProvider');
  }
  return context;
};