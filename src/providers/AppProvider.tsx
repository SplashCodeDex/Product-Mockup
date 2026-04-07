import React, { PropsWithChildren } from 'react';
import { AuthProvider } from './AuthProvider';
import { EconomyProvider } from './EconomyProvider';
import { DataProvider } from './DataProvider';
import { AlertProvider } from './AlertProvider';

export const AppProvider = ({ children }: PropsWithChildren<{}>) => {
  return (
    <AlertProvider>
      <AuthProvider>
        <EconomyProvider>
          <DataProvider>
            {children}
          </DataProvider>
        </EconomyProvider>
      </AuthProvider>
    </AlertProvider>
  );
};
