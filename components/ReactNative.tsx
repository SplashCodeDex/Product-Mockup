/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { forwardRef, useEffect, useState, useRef } from 'react';

// --- Types ---

export interface ViewProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

export interface TextProps extends React.HTMLAttributes<HTMLSpanElement> {
  className?: string;
  style?: React.CSSProperties;
  numberOfLines?: number;
  children?: React.ReactNode;
}

export interface ImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  source: { uri: string };
  className?: string;
  style?: React.CSSProperties;
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'center';
}

export interface TouchableOpacityProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  activeOpacity?: number;
  className?: string;
  style?: React.CSSProperties;
  onPress?: (e: React.MouseEvent | React.TouchEvent) => void;
  disabled?: boolean;
  children?: React.ReactNode;
}

export interface ScrollViewProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  style?: React.CSSProperties;
  contentContainerStyle?: React.CSSProperties;
  horizontal?: boolean;
  showsHorizontalScrollIndicator?: boolean;
  showsVerticalScrollIndicator?: boolean;
  children?: React.ReactNode;
}

export interface SliderProps {
  value: number;
  minimumValue: number;
  maximumValue: number;
  step?: number;
  onValueChange?: (value: number) => void;
  onSlidingComplete?: (value: number) => void;
  className?: string;
  style?: React.CSSProperties;
  minimumTrackTintColor?: string;
  maximumTrackTintColor?: string;
  thumbTintColor?: string;
}

export interface ModalProps {
  visible: boolean;
  transparent?: boolean;
  animationType?: 'none' | 'slide' | 'fade';
  onRequestClose?: () => void;
  children?: React.ReactNode;
}

export interface ActivityIndicatorProps {
  size?: 'small' | 'large';
  color?: string;
  className?: string;
}

export interface KeyboardAvoidingViewProps extends ViewProps {
  behavior?: 'height' | 'padding' | 'position';
}

export interface CameraProps extends ViewProps {
  type?: 'front' | 'back';
  onCameraReady?: () => void;
}

// --- Components ---

// View: Flex container. 
// Fix: Condition 'flex-col' to avoid conflicts if 'flex-row' is passed in className.
export const View = forwardRef<HTMLDivElement, ViewProps>(({ className = '', style, ...props }, ref) => {
  const isRow = className.includes('flex-row');
  const dirClass = isRow ? 'flex' : 'flex flex-col';
  
  return (
    <div 
      ref={ref}
      // min-w-0 and min-h-0 help prevent flex children from overflowing container
      className={`relative ${dirClass} min-w-0 min-h-0 box-border ${className}`} 
      style={style} 
      {...props} 
    />
  );
});

// SafeAreaView: Adds padding for notches/home bars.
export const SafeAreaView = ({ className = '', style, ...props }: ViewProps) => (
  <div 
    className={`flex-1 pt-[var(--safe-top)] pb-[var(--safe-bottom)] flex flex-col ${className}`} 
    style={style} 
    {...props} 
  />
);

// KeyboardAvoidingView: Handles mobile keyboard resizing
export const KeyboardAvoidingView = ({ behavior, className = '', style, children, ...props }: KeyboardAvoidingViewProps) => {
  return (
    <div 
      className={`flex-1 flex flex-col min-w-0 transition-all duration-200 ${className}`}
      style={style}
      {...props}
    >
      {children}
    </div>
  );
};

// Text: Renders text. Uses block display to behave like a flex item properly.
export const Text = ({ className = '', style, numberOfLines, ...props }: TextProps) => {
  const lineClampStyle: React.CSSProperties = numberOfLines ? {
    display: '-webkit-box',
    WebkitLineClamp: numberOfLines,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  } : {};

  return (
    <span 
      className={`text-base text-zinc-100 font-sans whitespace-pre-wrap block ${className}`} 
      style={{ ...lineClampStyle, ...style }} 
      {...props} 
    />
  );
};

// Image: Renders images. 
export const Image = ({ source, className = '', style, resizeMode = 'cover', ...props }: ImageProps) => (
  <img 
    src={source.uri} 
    draggable="false"
    className={`block select-none ${className}`} 
    style={{ 
      objectFit: resizeMode,
      userSelect: 'none',
      WebkitUserDrag: 'none',
      ...style 
    }} 
    {...props} 
  />
);

// TouchableOpacity: Handles taps with opacity feedback.
// Fix: Condition 'flex-col' similarly to View.
export const TouchableOpacity = forwardRef<HTMLButtonElement, TouchableOpacityProps>(({ className = '', style, activeOpacity = 0.7, onPress, disabled, ...props }, ref) => {
  const isRow = className.includes('flex-row');
  const dirClass = isRow ? 'flex' : 'flex flex-col';

  return (
    <button 
      ref={ref}
      className={`${dirClass} flex-shrink-0 min-w-0 transition-opacity focus:outline-none bg-transparent border-0 p-0 text-left relative ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer active:opacity-50'} ${className}`} 
      style={{ ...style, touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }} 
      onClick={disabled ? undefined : onPress}
      disabled={disabled}
      type="button"
      {...props} 
    />
  );
});

// TextInput: Input field without default browser styles.
export const TextInput = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement> & { className?: string }>(
  ({ className = '', style, ...props }, ref) => (
    <input 
      ref={ref}
      className={`bg-transparent border-0 focus:outline-none focus:ring-0 text-zinc-100 placeholder-zinc-500 font-sans p-0 m-0 w-full ${className}`} 
      style={{ ...style, outline: 'none' }} 
      autoComplete="off"
      autoCapitalize="none"
      {...props} 
    />
  )
);

// ScrollView: Handles scrolling with native feel.
export const ScrollView = ({ 
  className = '', 
  style, 
  contentContainerStyle, 
  horizontal, 
  showsHorizontalScrollIndicator = true,
  showsVerticalScrollIndicator = true,
  children, 
  ...props 
}: ScrollViewProps) => {
  const scrollClass = horizontal 
    ? `overflow-x-auto flex-row ${!showsHorizontalScrollIndicator ? 'scrollbar-hide' : ''}` 
    : `overflow-y-auto flex-col ${!showsVerticalScrollIndicator ? 'scrollbar-hide' : ''}`;
  
  const touchAction = horizontal ? 'pan-x' : 'pan-y';

  return (
    <div 
      className={`flex-1 flex flex-col relative ${scrollClass} ${className}`} 
      style={{
        ...style,
        overscrollBehavior: 'contain',
        WebkitOverflowScrolling: 'touch',
        touchAction 
      }} 
      {...props} 
    >
      <div 
        className={`flex flex-shrink-0 ${horizontal ? 'flex-row min-w-full' : 'flex-col min-h-full'}`} 
        style={contentContainerStyle}
      >
        {children}
      </div>
    </div>
  );
};

// Slider: Native-like slider.
export const Slider = ({
  value,
  minimumValue,
  maximumValue,
  step = 1,
  onValueChange,
  onSlidingComplete,
  className = '',
  style,
  minimumTrackTintColor = '#4f46e5',
  maximumTrackTintColor = '#27272a',
}: SliderProps) => {
  const percentage = ((value - minimumValue) / (maximumValue - minimumValue)) * 100;

  return (
    <div 
      className={`relative flex items-center h-10 w-full flex-shrink-0 ${className}`} 
      style={{ ...style, touchAction: 'none' }}
    >
      <input
        type="range"
        min={minimumValue}
        max={maximumValue}
        step={step}
        value={value}
        onInput={(e) => onValueChange?.(parseFloat((e.target as HTMLInputElement).value))}
        onMouseUp={(e) => onSlidingComplete?.(parseFloat((e.target as HTMLInputElement).value))}
        onTouchEnd={(e) => onSlidingComplete?.(parseFloat((e.target as HTMLInputElement).value))}
        className="absolute inset-0 w-full h-full opacity-0 z-20 cursor-pointer"
      />
      {/* Track Background */}
      <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden relative z-0">
        <div 
          className="absolute top-0 left-0 h-full rounded-full"
          style={{ width: `${percentage}%`, backgroundColor: minimumTrackTintColor }}
        />
      </div>
      {/* Thumb */}
      <div 
        className="absolute h-6 w-6 bg-white rounded-full shadow-lg border-2 border-indigo-500 pointer-events-none z-10"
        style={{ left: `calc(${percentage}% - 12px)` }}
      />
    </div>
  );
};

export const StatusBar = ({ barStyle }: { barStyle?: 'light-content' | 'dark-content' }) => null;

export const Modal = ({ visible, transparent, animationType = 'fade', onRequestClose, children }: ModalProps) => {
  if (!visible) return null;

  const bgClass = transparent ? 'bg-black/80' : 'bg-black';
  return (
    <div className={`fixed inset-0 z-[100] flex flex-col items-center justify-center ${bgClass} animate-fade-in`}>
      <div className="absolute inset-0" onClick={onRequestClose} />
      <div className="relative w-full h-full pointer-events-auto flex flex-col justify-center">
        {children}
      </div>
    </div>
  );
};

export const ActivityIndicator = ({ size = 'small', color = '#a1a1aa', className = '' }: ActivityIndicatorProps) => {
  const sizeClass = size === 'large' ? 'w-8 h-8' : 'w-5 h-5';
  return (
    <div className={`flex items-center justify-center flex-shrink-0 ${className}`}>
      <svg className={`animate-spin ${sizeClass}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke={color} strokeWidth="4"></circle>
        <path className="opacity-75" fill={color} d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
    </div>
  );
};

// Camera: Wraps HTML5 Video in a Native-like component
export const Camera = forwardRef<HTMLVideoElement, CameraProps>(({ className = '', style, type = 'back', onCameraReady, ...props }, ref) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;
    setError(null);

    const startCamera = async () => {
      try {
        const constraints = {
          video: {
            facingMode: type === 'front' ? 'user' : 'environment',
            width: { ideal: 1920 },
            height: { ideal: 1080 }
          },
          audio: false
        };
        
        stream = await navigator.mediaDevices.getUserMedia(constraints);
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play();
            onCameraReady?.();
          };
        }
      } catch (err: any) {
        console.error("Camera Access Error:", err);
        setError(err.name === 'NotAllowedError' 
          ? "Camera permission denied. Please enable access in your browser settings." 
          : "Could not access camera.");
      }
    };

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [type, onCameraReady]);

  // Forward the internal ref to the parent if provided, otherwise use internal
  useEffect(() => {
    if (ref) {
      if (typeof ref === 'function') {
        ref(videoRef.current);
      } else {
        ref.current = videoRef.current;
      }
    }
  }, [ref]);

  return (
    <div className={`relative overflow-hidden bg-black flex-1 ${className}`} style={style} {...props}>
      {error ? (
         <div className="absolute inset-0 flex items-center justify-center p-6 text-center">
             <div className="bg-zinc-900/80 p-6 rounded-2xl border border-zinc-800 backdrop-blur-md">
                <p className="text-zinc-200 font-medium mb-2">Camera Unavailable</p>
                <p className="text-zinc-400 text-sm">{error}</p>
             </div>
         </div>
      ) : (
        <video
            ref={videoRef}
            playsInline
            muted
            autoPlay
            className="w-full h-full object-cover"
            style={{ transform: type === 'front' ? 'scaleX(-1)' : 'none' }}
        />
      )}
    </div>
  );
});

export const Alert = {
  alert: (title: string, message?: string, buttons?: { text: string, onPress?: () => void, style?: 'cancel' | 'destructive' | 'default' }[]) => {
    const btns = buttons || [{ text: 'OK' }];
    setTimeout(() => {
        if (btns.length > 1) {
           const result = window.confirm(`${title}\n\n${message || ''}`);
           if (result) {
               const okBtn = btns.find(b => b.style !== 'cancel');
               okBtn?.onPress?.();
           } else {
               const cancelBtn = btns.find(b => b.style === 'cancel');
               cancelBtn?.onPress?.();
           }
        } else {
            window.alert(`${title}\n\n${message || ''}`);
            btns[0]?.onPress?.();
        }
    }, 10);
  }
};

export const Share = {
  share: async (content: { message?: string, url?: string, title?: string }) => {
    if (navigator.share) {
      try {
        const shareData: any = {
          title: content.title || 'SKU Foundry',
          text: content.message
        };

        // If URL is a data URI, convert to file for native sharing if supported
        if (content.url && content.url.startsWith('data:')) {
           const blob = await (await fetch(content.url)).blob();
           const file = new File([blob], 'mockup.png', { type: blob.type });
           if (navigator.canShare && navigator.canShare({ files: [file] })) {
             shareData.files = [file];
           } else {
             // Fallback if file sharing not supported: just share text
           }
        } else if (content.url) {
          shareData.url = content.url;
        }

        await navigator.share(shareData);
        return { action: 'sharedActivityType' };
      } catch (error) {
        console.error("Share failed", error);
        return { action: 'dismissedAction' };
      }
    } else {
      // Fallback for desktop/unsupported
      if (content.url) {
        try {
           await navigator.clipboard.writeText(content.url);
           Alert.alert('Copied', 'Image URL copied to clipboard');
           return { action: 'sharedActivityType' };
        } catch (e) {
           return { action: 'dismissedAction' };
        }
      }
      return { action: 'dismissedAction' };
    }
  }
};