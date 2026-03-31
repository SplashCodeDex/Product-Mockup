
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Product {
    id: string;
    title: string;
    price: string;
    credits: number;
    popular?: boolean;
}

interface IAPInterface {
    getProducts(): Promise<Product[]>;
    purchaseProduct(productId: string): Promise<PurchaseResult>;
    onShowPurchase?: (productId: string, onComplete: (success: boolean) => void) => void;
}

interface PurchaseResult {
    success: boolean;
    credits: number;
    transactionId?: string;
}

// Service for StoreKit / Google Play Billing
class IAPService implements IAPInterface {
    public onShowPurchase?: (productId: string, onComplete: (success: boolean) => void) => void;
    public readonly products: Product[] = [
         { id: 'credits_10', title: '10 Credits', price: '$0.99', credits: 10 },
         { id: 'credits_55', title: '55 Credits', price: '$4.99', credits: 55, popular: true },
         { id: 'credits_120', title: '120 Credits', price: '$9.99', credits: 120 },
    ];

    async getProducts(): Promise<Product[]> {
        // In a real app, this calls await IAP.getProducts(productIds);
        // We return the static configuration immediately.
        return this.products;
    }

    async purchaseProduct(productId: string): Promise<PurchaseResult> {
        const product = this.products.find(p => p.id === productId);
        if (!product) {
            throw new Error("Product not found");
        }

        console.info(`[IAPService] Processing purchase for ${productId}`);

        // Web Sandbox Logic:
        // We use a callback to show a React-based purchase component for better UX.
        if (this.onShowPurchase) {
            const success = await new Promise<boolean>((resolve) => {
                this.onShowPurchase!(productId, (success) => {
                    resolve(success);
                });
            });

            if (success) {
                return {
                    success: true,
                    credits: product.credits,
                    transactionId: crypto.randomUUID()
                };
            } else {
                return { success: false, credits: 0 };
            }
        }

        // Fallback if no callback registered
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        return {
            success: true,
            credits: product.credits,
            transactionId: crypto.randomUUID()
        };
    }
}

export const iapService = new IAPService();
