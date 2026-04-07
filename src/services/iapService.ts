import { auth } from "../firebase";

export interface Product {
  id: string;
  title: string;
  price: string;
  credits: number;
}

export const iapService = {
  getProducts: async (): Promise<Product[]> => {
    return [
      { id: 'credits_10', title: '10 Credits', price: '$0.99', credits: 10 },
      { id: 'credits_50', title: '50 Credits', price: '$3.99', credits: 50 },
      { id: 'credits_100', title: '100 Credits', price: '$6.99', credits: 100 },
    ];
  },
  purchase: async (productId: string): Promise<{ success: boolean; credits?: number; url?: string }> => {
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error("Not authenticated");

      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ productId })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create checkout session');
      }

      const session = await response.json();
      
      // Redirect to Stripe Checkout
      if (session.url) {
        window.location.href = session.url;
        return { success: true, url: session.url };
      }

      return { success: false };
    } catch (error) {
      console.error("Purchase failed:", error);
      return { success: false };
    }
  }
};
