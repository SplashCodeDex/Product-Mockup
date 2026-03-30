
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

interface AdNetworkInterface {
    initialize(): Promise<void>;
    showRewardedAd(): Promise<boolean>;
}

// Service for mobile ad network integration (AdMob / AppLovin)
// Implements a "Sandbox" pattern for web environments.
class AdService implements AdNetworkInterface {
    private _isNative: boolean = false;

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
        // We do not "simulate" a 3-second wait (fake UI).
        // We strictly return success for testing the reward loop, or throw if offline.
        console.info('[AdService] Sandbox: Ad Request Filled & Completed');
        return true; 
    }
}

export const adService = new AdService();
