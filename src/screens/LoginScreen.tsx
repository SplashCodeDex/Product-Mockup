import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, ActivityIndicator } from '../components/ReactNative';
import { Package } from 'lucide-react';
import { APP_NAME } from '../constants';
import { auth } from '../firebase';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { useAlert } from '../providers/AlertProvider';

export const LoginScreen = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { alert } = useAlert();

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (e) {
      console.error("Login failed", e);
      alert("Login Failed", "Could not sign in with Google.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-black items-center justify-center px-8">
       <View className="w-24 h-24 bg-indigo-600 rounded-3xl items-center justify-center mb-8 shadow-2xl shadow-indigo-500/20">
          <Package size={48} className="text-white" />
       </View>
       <Text className="text-4xl font-black text-white mb-2">{APP_NAME}</Text>
       <Text className="text-zinc-400 text-center mb-12 text-lg leading-6 px-4">
          Sign in to sync your designs across devices and access AI features.
       </Text>
       
       <TouchableOpacity 
         onPress={handleLogin}
         disabled={isLoading}
         className="w-full bg-white flex-row items-center justify-center py-4 rounded-2xl active:scale-95 transition-transform"
       >
          {isLoading ? (
            <ActivityIndicator color="black" />
          ) : (
            <>
              <Image 
                source={{ uri: "https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" }} 
                className="w-6 h-6 mr-3"
              />
              <Text className="text-black font-bold text-lg">Continue with Google</Text>
            </>
          )}
       </TouchableOpacity>
       
       <Text className="text-zinc-600 text-xs mt-8 text-center px-8">
          By continuing, you agree to our <TouchableOpacity onPress={() => window.open('https://policies.google.com/terms', '_blank')}><Text className="underline">Terms of Service</Text></TouchableOpacity> and <TouchableOpacity onPress={() => window.open('https://policies.google.com/privacy', '_blank')}><Text className="underline">Privacy Policy</Text></TouchableOpacity>.
       </Text>
    </View>
  );
};
