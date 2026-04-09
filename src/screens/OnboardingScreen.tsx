import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, ScrollView, Image } from '../components/ReactNative';
import { Package, Wand2, Share2, ArrowRight } from 'lucide-react';

const SLIDES = [
  {
    id: '1',
    title: 'Create Stunning Mockups',
    description: 'Upload your logos and place them on products with precision using our advanced studio tools.',
    icon: <Package size={64} className="text-indigo-400" />,
    color: 'bg-indigo-900/20',
    borderColor: 'border-indigo-500/30'
  },
  {
    id: '2',
    title: 'Powered by AI',
    description: 'Let Gemini generate photorealistic environments and lighting for your product placements instantly.',
    icon: <Wand2 size={64} className="text-fuchsia-400" />,
    color: 'bg-fuchsia-900/20',
    borderColor: 'border-fuchsia-500/30'
  },
  {
    id: '3',
    title: 'Export & Share',
    description: 'Download high-resolution images or share them directly with clients and social media.',
    icon: <Share2 size={64} className="text-emerald-400" />,
    color: 'bg-emerald-900/20',
    borderColor: 'border-emerald-500/30'
  }
];

export const OnboardingScreen = ({ onComplete }: { onComplete: () => void }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollPosition = e.currentTarget.scrollLeft;
    const windowWidth = e.currentTarget.clientWidth;
    const index = Math.round(scrollPosition / windowWidth);
    setCurrentIndex(index);
  };

  const nextSlide = () => {
    if (currentIndex < SLIDES.length - 1) {
      const nextIndex = currentIndex + 1;
      if (scrollRef.current) {
        scrollRef.current.scrollTo({
          left: nextIndex * scrollRef.current.clientWidth,
          behavior: 'smooth'
        });
      }
      setCurrentIndex(nextIndex);
    } else {
      onComplete();
    }
  };

  return (
    <SafeAreaView className="bg-black flex-1">
      <ScrollView 
        horizontal 
        className="flex-1"
        showsHorizontalScrollIndicator={false}
        style={{ scrollSnapType: 'x mandatory' }}
        onScroll={handleScroll}
        ref={scrollRef}
      >
        {SLIDES.map((slide, index) => (
          <View 
            key={slide.id} 
            className="w-screen h-full items-center justify-center p-8"
            style={{ scrollSnapAlign: 'start' }}
          >
            <View className={`w-48 h-48 rounded-full ${slide.color} border ${slide.borderColor} items-center justify-center mb-12 animate-pop-in`}>
              {slide.icon}
            </View>
            <Text className="text-3xl font-black text-white text-center mb-4 animate-slide-up">
              {slide.title}
            </Text>
            <Text className="text-zinc-400 text-center text-lg leading-7 animate-slide-up" style={{ animationDelay: '0.1s' }}>
              {slide.description}
            </Text>
          </View>
        ))}
      </ScrollView>

      <View className="p-8 pb-12 flex-row items-center justify-between">
        <View className="flex-row space-x-2">
          {SLIDES.map((_, index) => (
            <View 
              key={index} 
              className={`h-2 rounded-full transition-all duration-300 ${currentIndex === index ? 'w-8 bg-indigo-500' : 'w-2 bg-zinc-800'}`}
            />
          ))}
        </View>
        
        <TouchableOpacity 
          onPress={nextSlide}
          className="bg-white px-6 py-4 rounded-full flex-row items-center active:scale-95 transition-transform"
        >
          <Text className="text-black font-bold mr-2">
            {currentIndex === SLIDES.length - 1 ? 'Get Started' : 'Next'}
          </Text>
          <ArrowRight size={20} className="text-black" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};
