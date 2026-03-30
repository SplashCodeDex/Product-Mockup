
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
}

interface PurchaseResult {
    success: boolean;
    credits: number;
    transactionId?: string;
}

// Service for StoreKit / Google Play Billing
class IAPService implements IAPInterface {
    private readonly products: Product[] = [
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

        // In production, we would validate the receipt with a backend server here.
        // For this client-side architecture, we authorize the transaction immediately in Sandbox.
        
        return {
            success: true,
            credits: product.credits,
            transactionId: crypto.randomUUID()
        };
    }
}

export const iapService = new IAPService();
