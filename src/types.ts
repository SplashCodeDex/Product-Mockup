
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

export interface Asset {
  id: string;
  uid: string; // Firebase Auth UID
  type: 'logo' | 'product';
  name: string;
  data: string; // URL (formerly base64)
  mimeType: string;
  createdAt?: number;
}

export interface PlacedLayer {
  uid: string; // unique instance id
  assetId: string;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  scale: number; // 1 = 100%
  rotation: number;
  opacity?: number;
  blendMode?: 'normal' | 'multiply' | 'screen' | 'overlay';
}

export interface Draft {
  id: string;
  uid: string;
  productId: string | null;
  layers: PlacedLayer[];
  lastModified: number;
}

export interface GeneratedMockup {
  id: string;
  uid: string;
  imageUrl: string;
  prompt: string;
  createdAt: number;
  layers?: PlacedLayer[]; // Store layout used
  productId?: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  credits: number;
  createdAt: number;
  role?: string;
}

export type AppView = 'dashboard' | 'assets' | 'studio' | 'gallery' | 'try-on';

export interface LoadingState {
  isGenerating: boolean;
  message: string;
}

export type RootStackParamList = {
  Dashboard: undefined;
  Assets: undefined;
  Studio: undefined;
  Result: { result: GeneratedMockup };
  Gallery: undefined;
  TryOn: undefined;
  Settings: undefined;
  Store: undefined;
};

export interface AuthContextType {
  user: UserProfile | null;
  isAuthReady: boolean;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<void>;
}

export interface EconomyContextType {
  credits: number;
  addCredits: (amount: number) => Promise<void>;
  spendCredits: (amount: number) => Promise<boolean>;
}

export interface DataContextType {
  isDataReady: boolean;
  assets: Asset[];
  addAsset: (a: Asset) => Promise<void>;
  removeAsset: (id: string) => Promise<void>;
  savedMockups: GeneratedMockup[];
  saveMockup: (m: GeneratedMockup) => Promise<void>;
  draft: Draft | null;
  updateDraft: (d: Partial<Draft>) => Promise<void>;
  clearDraft: () => Promise<void>;
  loadTemplates: () => Promise<void>;
  resetData: () => Promise<void>;
}

export interface GlobalContextType extends AuthContextType, EconomyContextType, DataContextType {}
