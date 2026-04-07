import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  TextInput, 
  Modal, 
  ActivityIndicator, 
  KeyboardAvoidingView 
} from '../ReactNative';
import { Info, ChevronRight, RotateCcw, Check } from 'lucide-react';
import { Haptics, ImpactFeedbackStyle, NotificationFeedbackType } from '../../services/haptics';

export const Toast = ({ message, visible, onHide }: { message: string, visible: boolean, onHide: () => void }) => {
  useEffect(() => {
    if (visible) {
      Haptics.notificationAsync(NotificationFeedbackType.Success);
      const timer = setTimeout(onHide, 3000);
      return () => clearTimeout(timer);
    }
  }, [visible, onHide]);

  if (!visible) return null;

  return (
    <View className="absolute top-12 left-4 right-4 z-[90] animate-toast-in items-center">
      <View className="bg-zinc-800 border border-zinc-700 rounded-full px-6 py-3 flex-row items-center shadow-xl">
         <Check size={16} className="text-green-500 mr-2" />
         <Text className="text-white font-medium text-sm">{message}</Text>
      </View>
    </View>
  );
};

export const InputModal = ({ 
  visible, 
  title, 
  placeholder, 
  onSubmit, 
  onCancel 
}: { 
  visible: boolean, 
  title: string, 
  placeholder: string, 
  onSubmit: (text: string) => void, 
  onCancel: () => void 
}) => {
  const [text, setText] = useState('');

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
       <KeyboardAvoidingView behavior="padding" className="w-full px-8 items-center justify-center">
          <View className="w-full bg-zinc-900 border border-zinc-700 rounded-2xl p-6 shadow-2xl">
            <Text className="text-xl font-bold text-white mb-2">{title}</Text>
            <TextInput 
              className="w-full bg-zinc-950 text-white p-4 rounded-xl border border-zinc-800 mb-6"
              placeholder={placeholder}
              value={text}
              onChange={(e) => setText(e.target.value)}
              autoFocus
            />
            <View className="flex-row justify-end space-x-4">
              <TouchableOpacity onPress={() => { setText(''); onCancel(); }} className="px-4 py-2">
                <Text className="text-zinc-400 font-bold">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { onSubmit(text); setText(''); }} className="bg-indigo-600 px-6 py-2 rounded-xl">
                <Text className="text-white font-bold">Continue</Text>
              </TouchableOpacity>
            </View>
          </View>
       </KeyboardAvoidingView>
    </Modal>
  );
};

export const ErrorModal = ({ 
  visible, 
  error, 
  onRetry, 
  onRefund,
  isRetrying
}: { 
  visible: boolean, 
  error: string | null, 
  onRetry: () => void, 
  onRefund: () => void,
  isRetrying?: boolean
}) => {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <Modal visible={visible} transparent animationType="fade">
       <View className="flex-1 bg-black/80 items-center justify-center px-6">
          <View className="w-full bg-zinc-900 border border-red-900/30 rounded-2xl p-6 shadow-2xl">
            <View className="items-center mb-4">
               <View className="w-16 h-16 bg-red-900/20 rounded-full items-center justify-center mb-4">
                  <Info size={32} className="text-red-500" />
               </View>
               <Text className="text-2xl font-black text-white text-center">Generation Failed</Text>
               <Text className="text-zinc-400 text-center mt-2 px-4">
                  We encountered an issue while processing your request. Would you like to try again or get a refund?
               </Text>
            </View>

            {error && (
              <View className="mb-6">
                <TouchableOpacity 
                  onPress={() => setShowDetails(!showDetails)}
                  className="flex-row items-center justify-center mb-2"
                >
                  <Text className="text-zinc-500 text-xs font-bold uppercase mr-1">Error Details</Text>
                  <ChevronRight size={12} className={`text-zinc-500 transition-transform ${showDetails ? 'rotate-90' : ''}`} />
                </TouchableOpacity>
                {showDetails && (
                  <View className="bg-black/40 p-3 rounded-lg border border-zinc-800">
                    <Text className="text-red-400/80 text-xs font-mono leading-relaxed">{error}</Text>
                  </View>
                )}
              </View>
            )}

            <View className="space-y-3">
              <Button 
                onPress={onRetry} 
                isLoading={isRetrying}
                className="bg-indigo-600 w-full"
                icon={<RotateCcw size={18} />}
              >
                Retry Generation
              </Button>
              <Button 
                onPress={onRefund} 
                variant="secondary"
                className="w-full border-zinc-800"
                icon={<RotateCcw size={18} className="text-zinc-400" />}
              >
                Refund & Close
              </Button>
            </View>
            
            <Text className="text-zinc-600 text-[10px] text-center mt-4">
              Retrying will not cost additional credits.
            </Text>
          </View>
       </View>
    </Modal>
  );
};

export const AdTimer = ({ onComplete }: { onComplete: () => void }) => {
    const [timeLeft, setTimeLeft] = useState(5);

    useEffect(() => {
        if (timeLeft === 0) {
            onComplete();
            return;
        }
        const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
        return () => clearTimeout(timer);
    }, [timeLeft]);

    return (
        <View className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden mb-4">
            <View 
                className="bg-indigo-600 h-full" 
                style={{ width: `${(5 - timeLeft) / 5 * 100}%` }} 
            />
            <View className="absolute inset-0 items-center justify-center">
                <Text className="text-[8px] text-white font-bold">{timeLeft}s</Text>
            </View>
        </View>
    );
};

export const Header = ({ title, leftAction, rightAction }: { title: string, leftAction?: { icon: React.ReactNode, onPress: () => void }, rightAction?: { icon: React.ReactNode, onPress: () => void } }) => (
  <View className="pt-[env(safe-area-inset-top)] bg-zinc-950 border-b border-zinc-800 shrink-0 z-50">
    <View className="h-14 flex-row items-center justify-between px-4">
      <View className="flex-row items-center flex-1 pr-4 min-w-0">
        {leftAction && (
          <TouchableOpacity 
            onPress={() => {
              Haptics.impactAsync(ImpactFeedbackStyle.Light);
              leftAction.onPress();
            }} 
            className="mr-4 p-1"
          >
            {leftAction.icon}
          </TouchableOpacity>
        )}
        <Text numberOfLines={1} className="text-lg font-bold text-white flex-1">{title}</Text>
      </View>
      {rightAction ? (
        <TouchableOpacity 
          onPress={() => {
            Haptics.impactAsync(ImpactFeedbackStyle.Light);
            rightAction.onPress();
          }} 
          className="p-1"
        >
          {rightAction.icon}
        </TouchableOpacity>
      ) : <View className="w-8" />}
    </View>
  </View>
);

export const ProcessingModal = ({ visible, message }: { visible: boolean, message: string }) => (
  <Modal visible={visible} transparent animationType="fade">
    <View className="flex-1 bg-black/80 items-center justify-center p-8">
      <View className="bg-zinc-900 p-8 rounded-3xl items-center border border-zinc-800 shadow-2xl">
        <ActivityIndicator size="large" color="#4f46e5" />
        <Text className="text-white font-bold text-lg mt-6 text-center">{message}</Text>
        <Text className="text-zinc-500 text-xs mt-2 text-center">Please wait while we process your request</Text>
      </View>
    </View>
  </Modal>
);

export const Button = ({ 
  onPress, 
  children, 
  variant = 'primary', 
  icon,
  disabled,
  isLoading,
  className = ''
}: { 
  onPress: () => void, 
  children?: React.ReactNode, 
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost', 
  icon?: React.ReactNode,
  disabled?: boolean,
  isLoading?: boolean,
  className?: string
}) => {
  const bgColors = {
    primary: 'bg-indigo-600',
    secondary: 'bg-zinc-800 border border-zinc-700',
    danger: 'bg-red-600',
    ghost: 'bg-transparent'
  };

  const textColors = {
    primary: 'text-white',
    secondary: 'text-white',
    danger: 'text-white',
    ghost: 'text-indigo-400'
  };

  return (
    <TouchableOpacity 
      onPress={onPress}
      disabled={disabled || isLoading}
      className={`flex-row items-center justify-center py-3 px-6 rounded-xl active:scale-95 transition-transform ${bgColors[variant]} ${disabled ? 'opacity-50' : ''} ${className}`}
    >
      {isLoading ? (
        <ActivityIndicator color={variant === 'ghost' ? '#4f46e5' : 'white'} />
      ) : (
        <>
          {icon && <View className="mr-2">{icon}</View>}
          {children && <Text className={`font-bold ${textColors[variant]}`}>{children}</Text>}
        </>
      )}
    </TouchableOpacity>
  );
};
