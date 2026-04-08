/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { Asset, PlacedLayer } from "../types";
import { auth } from "../firebase";

const getAuthHeaders = async () => {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (auth.currentUser) {
    const token = await auth.currentUser.getIdToken();
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
};

/**
 * Helper to strip the data URL prefix (e.g. "data:image/png;base64,")
 */
const getBase64Data = (dataUrl: string): string => {
  return dataUrl.split(',')[1];
};

/**
 * Generates a DeXify mockup by compositing multiple logos onto a product image.
 */
export const generateMockup = async (
  product: Asset,
  layers: { asset: Asset; placement: PlacedLayer }[],
  instruction: string
): Promise<string> => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch("/api/ai/generate-mockup", {
      method: "POST",
      headers,
      body: JSON.stringify({ product, layers, instruction }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to generate mockup");
    }

    const data = await response.json();
    return data.imageUrl;
  } catch (error: any) {
    console.error("Mockup generation failed:", error);
    throw error;
  }
};

/**
 * Generates a new logo or product base from scratch using text.
 */
export const generateAsset = async (prompt: string, type: 'logo' | 'product'): Promise<string> => {
   try {
    const headers = await getAuthHeaders();
    const response = await fetch("/api/ai/generate-asset", {
      method: "POST",
      headers,
      body: JSON.stringify({ prompt, type }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to generate asset");
    }

    const data = await response.json();
    return data.imageUrl;
   } catch (error: any) {
       console.error("Asset generation failed:", error);
       throw error;
   }
}

/**
 * Takes a raw AR composite and makes it photorealistic.
 */
export const generateRealtimeComposite = async (
    compositeImageBase64: string,
    prompt: string = "Make this look like a real photo"
  ): Promise<string> => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch("/api/ai/generate-realtime-composite", {
        method: "POST",
        headers,
        body: JSON.stringify({ compositeImageBase64, prompt }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to process AR image");
      }

      const data = await response.json();
      return data.imageUrl;
    } catch (error: any) {
      console.error("AR Composite generation failed:", error);
      throw error;
    }
  };