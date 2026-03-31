
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

export interface Asset {
  id: string;
  uid: string; // Firebase Auth UID
  type: 'logo' | 'product';
  name: string;
  data: string; // Base64
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

export interface GlobalContextType {
  user: UserProfile | null;
  logout: () => Promise<void>;
  assets: Asset[];
  addAsset: (a: Asset) => void;
  removeAsset: (id: string) => void;
  savedMockups: GeneratedMockup[];
  saveMockup: (m: GeneratedMockup) => void;
  resetData: () => void;
  deleteAccount: () => Promise<void>;
  loadTemplates: () => void;
  
  // Persistence
  draft: Draft | null;
  updateDraft: (d: Partial<Draft>) => void;
  clearDraft: () => void;

  // Economy
  credits: number;
  addCredits: (amount: number) => void;
  spendCredits: (amount: number) => boolean;
}
