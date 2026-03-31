
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

interface AdNetworkInterface {
    initialize(): Promise<void>;
    showRewardedAd(): Promise<boolean>;
    onShowAd?: (onComplete: (success: boolean) => void) => void;
}

// Service for mobile ad network integration (AdMob / AppLovin)
// Implements a "Sandbox" pattern for web environments.
class AdService implements AdNetworkInterface {
    private _isNative: boolean = false;
    public onShowAd?: (onComplete: (success: boolean) => void) => void;

    constructor() {
        this._isNative = typeof window !== 'undefined' && (window as any).ReactNativeWebView;
        this.initialize();
    }

    async initialize(): Promise<void> {
        if (this._isNative) {
            console.log('[AdService] Initializing Native SDK...');
            // In a real app: MobileAds.initialize()
        } else {
            console.log('[AdService] Initializing Web Sandbox Environment');
        }
    }

    async showRewardedAd(): Promise<boolean> {
        if (this._isNative) {
            // In a real app: await RewardedAd.createForAdRequest(unitId).load().show();
            // For this hybrid architecture, we assume native bridge handles it.
            console.log('[AdService] Requesting Native Ad...');
            return true;
        }

        // Web Sandbox Logic:
        // We use a callback to show a React-based ad component for better UX.
        if (this.onShowAd) {
            return new Promise((resolve) => {
                this.onShowAd!((success) => {
                    resolve(success);
                });
            });
        }

        // Fallback if no callback registered
        console.info('[AdService] Sandbox: Loading Ad...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        await new Promise(resolve => setTimeout(resolve, 3000));
        return true; 
    }
}

export const adService = new AdService();
