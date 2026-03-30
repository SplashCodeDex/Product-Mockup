
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { createContext, useContext, useState, useEffect, PropsWithChildren, useMemo, useCallback } from 'react';

// --- Types ---

export type Route<ParamList extends object, RouteName extends keyof ParamList> = {
  key: string;
  name: RouteName;
  params: ParamList[RouteName];
};

export type NavigationProp<ParamList extends object> = {
  navigate: <RouteName extends keyof ParamList>(name: RouteName, params?: ParamList[RouteName]) => void;
  goBack: () => void;
  canGoBack: () => boolean;
  push: <RouteName extends keyof ParamList>(name: RouteName, params?: ParamList[RouteName]) => void;
  replace: <RouteName extends keyof ParamList>(name: RouteName, params?: ParamList[RouteName]) => void;
};

export type NativeStackScreenProps<ParamList extends object, RouteName extends keyof ParamList> = {
  navigation: NavigationProp<ParamList>;
  route: Route<ParamList, RouteName>;
};

// --- Context ---

type NavigationContextType = {
  stack: Route<any, any>[];
  push: (name: string, params?: any) => void;
  pop: () => void;
  replace: (name: string, params?: any) => void;
};

const NavigationContext = createContext<NavigationContextType | null>(null);

// --- Hooks ---

export function useNavigation<ParamList extends object>() {
  const ctx = useContext(NavigationContext);
  if (!ctx) throw new Error("useNavigation must be used within a NavigationContainer");

  return {
    navigate: ctx.push,
    push: ctx.push,
    goBack: ctx.pop,
    replace: ctx.replace,
    canGoBack: () => ctx.stack.length > 1,
  };
}

export function useRoute<ParamList extends object, RouteName extends keyof ParamList>() {
  const ctx = useContext(NavigationContext);
  if (!ctx) throw new Error("useRoute must be used within a NavigationContainer");
  return ctx.stack[ctx.stack.length - 1] as Route<ParamList, RouteName>;
}

// --- Components ---

export const NavigationContainer = ({ children }: PropsWithChildren<{}>) => {
  const [stack, setStack] = useState<Route<any, any>[]>([]);

  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      setStack(prevStack => {
        if (prevStack.length > 1) {
          return prevStack.slice(0, -1);
        }
        return prevStack;
      });
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const push = useCallback((name: string, params: any = {}) => {
    const route = { key: Math.random().toString(36).substr(2, 9), name, params };
    window.history.pushState({ key: route.key }, name);
    setStack(prev => [...prev, route]);
  }, []);

  const pop = useCallback(() => {
    if (window.history.length > 1) {
        window.history.back();
    } else {
        setStack(prev => prev.length > 1 ? prev.slice(0, -1) : prev);
    }
  }, []);

  const replace = useCallback((name: string, params: any = {}) => {
    const route = { key: Math.random().toString(36).substr(2, 9), name, params };
    window.history.replaceState({ key: route.key }, name);
    setStack(prev => [...prev.slice(0, -1), route]);
  }, []);

  const value = useMemo(() => ({ stack, push, pop, replace }), [stack, push, pop, replace]);

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
};

export const createNativeStackNavigator = <ParamList extends object>() => {
  return {
    Navigator: ({ 
      initialRouteName, 
      children 
    }: PropsWithChildren<{ 
      initialRouteName: keyof ParamList, 
      screenOptions?: { headerShown?: boolean } 
    }>) => {
      const ctx = useContext(NavigationContext);
      
      useEffect(() => {
        if (ctx && ctx.stack.length === 0) {
          const route = { key: 'root', name: initialRouteName, params: undefined };
          window.history.replaceState({ key: 'root' }, String(initialRouteName));
          ctx.push(initialRouteName as string); 
        }
      }, []);

      if (!ctx || ctx.stack.length === 0) return null;

      const currentRoute = ctx.stack[ctx.stack.length - 1];
      
      let ScreenToRender = null;
      React.Children.forEach(children, (child) => {
        if (React.isValidElement(child)) {
          const props = child.props as any;
          if (props.name === currentRoute.name) {
             ScreenToRender = child;
          }
        }
      });

      return (
        <div className="flex-1 w-full h-full relative overflow-hidden bg-black">
          {ScreenToRender}
        </div>
      );
    },
    Screen: <RouteName extends keyof ParamList>({ 
      name, 
      component: Component 
    }: { 
      name: RouteName, 
      component: React.ComponentType<any>,
      options?: { headerShown?: boolean }
    }) => {
        const ctx = useContext(NavigationContext);
        if (!ctx) return null;
        
        const currentRoute = ctx.stack[ctx.stack.length - 1];
        if (currentRoute.name !== name) return null;

        // Use absolute positioning to ensure the screen overlays/fills properly
        // without affecting the document flow incorrectly.
        return (
          <div className="absolute inset-0 w-full h-full animate-slide-in bg-black">
             <Component 
                navigation={{ 
                  navigate: ctx.push, 
                  push: ctx.push, 
                  goBack: ctx.pop, 
                  canGoBack: () => ctx.stack.length > 1,
                  replace: ctx.replace
                }} 
                route={currentRoute} 
             />
          </div>
        );
    }
  };
};
