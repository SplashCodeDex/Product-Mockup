import React, { createContext, useContext, useState, ReactNode } from 'react';
import { View, Text, TouchableOpacity, Modal } from '../components/ReactNative';

interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'cancel' | 'destructive' | 'default';
}

interface AlertOptions {
  title: string;
  message?: string;
  buttons?: AlertButton[];
}

interface AlertContextType {
  alert: (title: string, message?: string, buttons?: AlertButton[]) => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export const useAlert = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
};

export const AlertProvider = ({ children }: { children: ReactNode }) => {
  const [alertState, setAlertState] = useState<AlertOptions | null>(null);

  const alert = (title: string, message?: string, buttons?: AlertButton[]) => {
    setAlertState({ title, message, buttons });
  };

  const handleClose = () => {
    setAlertState(null);
  };

  const handleButtonPress = (button: AlertButton) => {
    handleClose();
    if (button.onPress) {
      button.onPress();
    }
  };

  return (
    <AlertContext.Provider value={{ alert }}>
      {children}
      <Modal visible={alertState !== null} transparent animationType="fade">
        <View className="flex-1 bg-black/80 items-center justify-center p-6">
          <View className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl">
            <View className="p-6 items-center">
              <Text className="text-xl font-bold text-white text-center mb-2">{alertState?.title}</Text>
              {alertState?.message && (
                <Text className="text-zinc-400 text-center">{alertState.message}</Text>
              )}
            </View>
            <View className="flex-row border-t border-zinc-800">
              {alertState?.buttons ? (
                alertState.buttons.map((btn, index) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => handleButtonPress(btn)}
                    className={`flex-1 p-4 items-center justify-center ${index > 0 ? 'border-l border-zinc-800' : ''}`}
                  >
                    <Text 
                      className={`font-bold ${btn.style === 'cancel' ? 'text-zinc-400' : btn.style === 'destructive' ? 'text-red-500' : 'text-indigo-400'}`}
                    >
                      {btn.text}
                    </Text>
                  </TouchableOpacity>
                ))
              ) : (
                <TouchableOpacity
                  onPress={handleClose}
                  className="flex-1 p-4 items-center justify-center"
                >
                  <Text className="font-bold text-indigo-400">OK</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </AlertContext.Provider>
  );
};
