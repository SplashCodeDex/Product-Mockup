import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { GoogleGenAI, Modality } from "@google/genai";
import cors from "cors";
import admin from "firebase-admin";
import fs from "fs";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Firebase Admin
const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));

admin.initializeApp({
  projectId: firebaseConfig.projectId,
});

const db = admin.firestore(firebaseConfig.firestoreDatabaseId);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json({ limit: '50mb' }));

  // --- API Routes ---

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // --- Credit Economy Routes (Secure) ---

  // Middleware to verify Firebase Auth token
  const authenticate = async (req: any, res: any, next: any) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const token = authHeader.split(' ')[1];
    try {
      const decodedToken = await admin.auth().verifyIdToken(token);
      req.user = decodedToken;
      next();
    } catch (error) {
      res.status(401).json({ error: 'Invalid token' });
    }
  };

  app.post("/api/credits/add", authenticate, async (req: any, res: any) => {
    try {
      const { amount, reason } = req.body;
      const uid = req.user.uid;
      
      const userRef = db.collection('users').doc(uid);
      await db.runTransaction(async (transaction) => {
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists) {
          transaction.set(userRef, { credits: amount });
        } else {
          const currentCredits = userDoc.data()?.credits || 0;
          transaction.update(userRef, { credits: currentCredits + amount });
        }
      });

      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/credits/spend", authenticate, async (req: any, res: any) => {
    try {
      const { amount } = req.body;
      const uid = req.user.uid;
      
      const userRef = db.collection('users').doc(uid);
      const success = await db.runTransaction(async (transaction) => {
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists) return false;
        
        const currentCredits = userDoc.data()?.credits || 0;
        if (currentCredits < amount) return false;
        
        transaction.update(userRef, { credits: currentCredits - amount });
        return true;
      });

      if (!success) {
        return res.status(400).json({ error: 'Insufficient credits' });
      }

      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // --- AI Proxy Routes ---
  app.post("/api/ai/generate-mockup", authenticate, async (req, res) => {
    try {
      const { product, layers, instruction } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error("GEMINI_API_KEY is not configured on server.");

      const ai = new GoogleGenAI({ apiKey });
      const model = 'gemini-3.1-flash-image-preview';

      const parts: any[] = [
        {
          inlineData: {
            mimeType: product.mimeType,
            data: product.data.split(',')[1],
          },
        },
      ];

      let layoutHints = "";
      layers.forEach((layer: any, index: number) => {
        parts.push({
          inlineData: {
            mimeType: layer.asset.mimeType,
            data: layer.asset.data.split(',')[1],
          },
        });

        const vPos = layer.placement.y < 33 ? "top" : layer.placement.y > 66 ? "bottom" : "center";
        const hPos = layer.placement.x < 33 ? "left" : layer.placement.x > 66 ? "right" : "center";
        layoutHints += `\n- Logo ${index + 1}: Place at ${vPos}-${hPos} area (approx coords: ${Math.round(layer.placement.x)}% x, ${Math.round(layer.placement.y)}% y). Scale: ${layer.placement.scale}.`;
      });

      const finalPrompt = `
      User Instructions: ${instruction}
      
      Layout Guidance based on user's rough placement on canvas:
      ${layoutHints}

      System Task: Composite the provided logo images (images 2-${layers.length + 1}) onto the first image (the product) to create a realistic product mockup. 
      Follow the Layout Guidance for positioning if provided, but prioritize realistic surface warping, lighting, and perspective blending.
      Output ONLY the resulting image.
      `;

      parts.push({ text: finalPrompt });

      const response = await ai.models.generateContent({
        model,
        contents: { parts },
        config: {
          responseModalities: [Modality.IMAGE],
          imageConfig: {
            imageSize: '1K',
            aspectRatio: '1:1'
          }
        },
      });

      const candidates = response.candidates;
      if (candidates && candidates[0]?.content?.parts) {
          for (const part of candidates[0].content.parts) {
              if (part.inlineData && part.inlineData.data) {
                   return res.json({ imageUrl: `data:image/png;base64,${part.inlineData.data}` });
              }
          }
      }
      throw new Error("AI returned empty response");
    } catch (error: any) {
      console.error("Server Mockup Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/ai/generate-asset", authenticate, async (req, res) => {
    try {
      const { prompt, type } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error("GEMINI_API_KEY is not configured on server.");

      const ai = new GoogleGenAI({ apiKey });
      const model = 'gemini-3.1-flash-image-preview';
      
      const enhancedPrompt = type === 'logo' 
          ? `A high-quality, professional vector-style logo design of a ${prompt}. Isolated on a pure white background. Minimalist and clean, single distinct logo.`
          : `Professional studio product photography of a single ${prompt}. Ghost mannequin style or flat lay. Front view, isolated on neutral background. High resolution, photorealistic. Single object only, no stacks, no duplicates.`;

      const response = await ai.models.generateContent({
          model,
          contents: {
              parts: [{ text: enhancedPrompt }]
          },
          config: {
              responseModalities: [Modality.IMAGE],
              imageConfig: {
                  imageSize: '1K',
                  aspectRatio: '1:1'
              }
          }
      });

      const candidates = response.candidates;
      if (candidates && candidates[0]?.content?.parts) {
          for (const part of candidates[0].content.parts) {
              if (part.inlineData && part.inlineData.data) {
                   return res.json({ imageUrl: `data:image/png;base64,${part.inlineData.data}` });
              }
          }
      }
      throw new Error("AI returned empty response");
    } catch (error: any) {
      console.error("Server Asset Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/ai/generate-realtime-composite", authenticate, async (req, res) => {
    try {
      const { compositeImageBase64, prompt } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error("GEMINI_API_KEY is not configured on server.");

      const ai = new GoogleGenAI({ apiKey });
      const model = 'gemini-3.1-flash-image-preview';

      const parts = [
        {
          inlineData: {
            mimeType: 'image/png',
            data: compositeImageBase64.split(',')[1],
          },
        },
        {
          text: `Input is a rough AR composite. Task: ${prompt || "Make this look like a real photo"}. 
          Render the overlaid object naturally into the scene. 
          Match the lighting, shadows, reflections, and perspective of the background. 
          Keep the background largely as is, but blend the object seamlessly.
          Output ONLY the resulting image.`,
        },
      ];

      const response = await ai.models.generateContent({
        model,
        contents: { parts },
        config: {
          responseModalities: [Modality.IMAGE],
          imageConfig: {
            imageSize: '1K',
            aspectRatio: '1:1'
          }
        },
      });

      const candidates = response.candidates;
      if (candidates && candidates[0]?.content?.parts) {
          for (const part of candidates[0].content.parts) {
              if (part.inlineData && part.inlineData.data) {
                   return res.json({ imageUrl: `data:image/png;base64,${part.inlineData.data}` });
              }
          }
      }
      throw new Error("AI returned empty response");
    } catch (error: any) {
      console.error("Server AR Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // --- Vite Middleware ---

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
