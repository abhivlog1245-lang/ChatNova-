import express from "express";
import http from "http";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { WebSocketServer, WebSocket } from "ws";
import { GoogleGenAI, GenerateVideosOperation, Modality } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

// Allow large payloads for base64 image and video uploads
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// ChatNova rule-based fallback & basic logic from the Flask app
function basicChatnovaResponse(message: string): string {
  const msg = (message || "").toLowerCase().trim();

  if (!msg) {
    return "Please type something 😊";
  }

  if (msg.includes("hello") || msg.includes("hi") || msg.includes("namaste")) {
    return "Hello! 👋 Main ChatNova hoon. Aapki kya help kar sakta hoon?";
  }

  if (msg.includes("your name") || msg.includes("tumhara naam")) {
    return "Mera naam ChatNova hai 🤖";
  }

  if (msg.includes("who are you") || msg.includes("tum kaun ho")) {
    return "Main ChatNova hoon — aapka AI companion 🚀";
  }

  if (msg.includes("help") || msg.includes("madad")) {
    return "Bilkul! Aap mujhse questions, ideas, coding aur bahut kuch pooch sakte ho.";
  }

  if (msg.includes("bye")) {
    return "Bye! 👋 Phir milte hain.";
  }

  return (
    "Interesting question! 🤔\n\n" +
    "Abhi main ChatNova ka basic version hoon. " +
    "Aap mujhe AI API se connect karke aur bhi powerful bana sakte ho."
  );
}

// Lazy Gemini AI initialization
let genAiClient: GoogleGenAI | null = null;
function getGenAiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  if (!genAiClient) {
    genAiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return genAiClient;
}

// Handler for ChatNova reply
async function generateChatResponse(
  message: string,
  mode: "auto" | "ai" | "basic" = "auto",
  history: Array<{ role: "user" | "assistant"; text: string }> = []
): Promise<{ reply: string; source: "gemini" | "rule_based" }> {
  const trimmed = (message || "").trim();
  if (!trimmed) {
    return { reply: "Please type something 😊", source: "rule_based" };
  }

  // If basic mode explicitly chosen, use the rule-based logic
  if (mode === "basic") {
    return { reply: basicChatnovaResponse(trimmed), source: "rule_based" };
  }

  // Try Gemini AI if available
  const ai = getGenAiClient();
  if (ai) {
    try {
      // Build conversation contents
      const conversationContents = [];
      
      // Include recent history (up to last 6 messages) for conversational memory
      const recentHistory = history.slice(-6);
      for (const item of recentHistory) {
        conversationContents.push({
          role: item.role === "assistant" ? "model" : "user",
          parts: [{ text: item.text }],
        });
      }

      // Add current message
      conversationContents.push({
        role: "user",
        parts: [{ text: trimmed }],
      });

      const systemInstruction = `You are ChatNova — a smart, friendly, and energetic AI companion.
Personality:
- You speak naturally in Hindi, English, or conversational Hinglish (matching the user's preferred language).
- If the user greets you with "hello", "hi", or "namaste", greet back warmly in your signature style: "Hello! 👋 Main ChatNova hoon. Aapki kya help kar sakta hoon?"
- If the user asks your name ("tumhara naam" or "your name"): "Mera naam ChatNova hai 🤖"
- If asked "who are you" or "tum kaun ho": "Main ChatNova hoon — aapka AI companion 🚀"
- If asked for help: offer rich help with coding, explanations, questions, writing, brainstorming, and daily problem-solving.
- When answering questions or coding problems, be concise, clear, accurate, and easy to understand with formatted code snippets or lists.
- Maintain a warm, encouraging, and helpful tone throughout.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: conversationContents,
        config: {
          systemInstruction,
        },
      });

      const replyText = response.text?.trim();
      if (replyText) {
        return { reply: replyText, source: "gemini" };
      }
    } catch (err: unknown) {
      console.warn("Gemini API call failed, falling back to rule-based logic:", err);
    }
  }

  // Fallback to the Python rule-based responses if no API key or API call failed
  return { reply: basicChatnovaResponse(trimmed), source: "rule_based" };
}

// 1. Exact Flask compatible endpoint: POST /chat
app.post("/chat", async (req, res) => {
  try {
    const message = req.body?.message ?? "";
    const mode = req.body?.mode ?? "auto";
    const history = req.body?.history ?? [];

    const result = await generateChatResponse(message, mode, history);
    res.json({
      reply: result.reply,
      source: result.source,
    });
  } catch (error) {
    console.error("Error in /chat endpoint:", error);
    res.status(500).json({
      reply: "Sorry, an unexpected error occurred. Please try again.",
      error: String(error),
    });
  }
});

// 2. Flexible API endpoint: POST /api/chat
app.post("/api/chat", async (req, res) => {
  try {
    const message = req.body?.message ?? "";
    const mode = req.body?.mode ?? "auto";
    const history = req.body?.history ?? [];

    const result = await generateChatResponse(message, mode, history);
    res.json({
      reply: result.reply,
      source: result.source,
    });
  } catch (error) {
    console.error("Error in /api/chat endpoint:", error);
    res.status(500).json({
      reply: "Sorry, an unexpected error occurred. Please try again.",
      error: String(error),
    });
  }
});

// 3. System info endpoint: GET /api/info
app.get("/api/info", (req, res) => {
  res.json({
    status: "ok",
    name: "ChatNova",
    aiConfigured: Boolean(process.env.GEMINI_API_KEY),
    model: "gemini-3.8-flash",
    imageModel: "gemini-3.1-flash-image-preview",
    videoModel: "veo-3.1-fast-generate-preview",
    liveModel: "gemini-3.8-live",
    version: "1.1.0",
  });
});

// Helper to clean base64 string
function cleanBase64(dataUrlOrBase64: string): { cleanData: string; mimeType: string } {
  if (!dataUrlOrBase64) return { cleanData: "", mimeType: "image/png" };
  const match = dataUrlOrBase64.match(/^data:([^;]+);base64,(.+)$/);
  if (match) {
    return { mimeType: match[1], cleanData: match[2] };
  }
  return { mimeType: "image/png", cleanData: dataUrlOrBase64 };
}

// 4. Create & Edit Images using gemini-3.1-flash-image-preview
app.post("/api/generate-image", async (req, res) => {
  try {
    const ai = getGenAiClient();
    if (!ai) {
      return res.status(503).json({
        error: "GEMINI_API_KEY is not configured on the server. Please check your settings.",
      });
    }

    const prompt = (req.body?.prompt || "").trim();
    const rawImage = req.body?.image;
    const requestedAspectRatio = req.body?.aspectRatio || "1:1";

    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required for image generation/editing." });
    }

    const parts: any[] = [];

    // If an image is provided, include it as inlineData for image editing
    if (rawImage) {
      const { cleanData, mimeType } = cleanBase64(rawImage);
      if (cleanData) {
        parts.push({
          inlineData: {
            data: cleanData,
            mimeType: mimeType || "image/png",
          },
        });
      }
    }

    // Add prompt text
    parts.push({ text: prompt });

    let response: any = null;
    try {
      response = await ai.models.generateContent({
        model: "gemini-3.1-flash-image-preview",
        contents: parts.length === 1 ? parts[0].text : { parts },
        config: {
          imageConfig: {
            aspectRatio: requestedAspectRatio,
          },
        },
      });
    } catch (modelErr) {
      console.warn("Primary image model failed, trying fallback gemini-3.1-flash-image:", modelErr);
      response = await ai.models.generateContent({
        model: "gemini-3.1-flash-image",
        contents: parts.length === 1 ? parts[0].text : { parts },
        config: {
          imageConfig: {
            aspectRatio: requestedAspectRatio,
          },
        },
      });
    }

    let imageUrl = "";
    let textOutput = "";

    const candidateParts = response?.candidates?.[0]?.content?.parts || [];
    for (const part of candidateParts) {
      if (part.inlineData?.data) {
        const mime = part.inlineData.mimeType || "image/png";
        imageUrl = `data:${mime};base64,${part.inlineData.data}`;
      } else if (part.text) {
        textOutput += part.text + " ";
      }
    }

    if (!imageUrl) {
      return res.status(500).json({
        error: "The model did not return an image. " + (textOutput ? `Note: ${textOutput.trim()}` : "Please try another prompt."),
      });
    }

    res.json({
      imageUrl,
      text: textOutput.trim() || undefined,
      prompt,
      aspectRatio: requestedAspectRatio,
      model: "gemini-3.1-flash-image-preview",
    });
  } catch (error: any) {
    console.error("Error generating/editing image:", error);
    res.status(500).json({
      error: error?.message || "Failed to generate image.",
    });
  }
});

// 5. Veo 3 Video Generation: Generate from text or animate an image using veo-3.1-fast-generate-preview
app.post("/api/generate-video", async (req, res) => {
  try {
    const ai = getGenAiClient();
    if (!ai) {
      return res.status(503).json({
        error: "GEMINI_API_KEY is not configured on the server. Please check your settings.",
      });
    }

    const prompt = (req.body?.prompt || "").trim();
    const rawImage = req.body?.image;
    const requestedAspectRatio = req.body?.aspectRatio === "9:16" ? "9:16" : "16:9";
    const requestedResolution = req.body?.resolution === "1080p" ? "1080p" : "720p";

    let operation: any = null;

    if (rawImage) {
      // Image animation mode
      const { cleanData, mimeType } = cleanBase64(rawImage);
      if (!cleanData) {
        return res.status(400).json({ error: "Invalid image provided for video animation." });
      }

      operation = await ai.models.generateVideos({
        model: "veo-3.1-fast-generate-preview",
        prompt: prompt || "Cinematic animation of this image with high detail and realistic natural motion",
        image: {
          imageBytes: cleanData,
          mimeType: mimeType || "image/png",
        },
        config: {
          numberOfVideos: 1,
          resolution: requestedResolution,
          aspectRatio: requestedAspectRatio,
        },
      });
    } else {
      // Text to video mode
      if (!prompt) {
        return res.status(400).json({ error: "A prompt is required for video generation." });
      }

      operation = await ai.models.generateVideos({
        model: "veo-3.1-fast-generate-preview",
        prompt,
        config: {
          numberOfVideos: 1,
          resolution: requestedResolution,
          aspectRatio: requestedAspectRatio,
        },
      });
    }

    if (!operation || !operation.name) {
      return res.status(500).json({ error: "Video operation could not be initiated." });
    }

    res.json({
      operationName: operation.name,
      model: "veo-3.1-fast-generate-preview",
      aspectRatio: requestedAspectRatio,
      resolution: requestedResolution,
      type: rawImage ? "image_to_video" : "text_to_video",
    });
  } catch (error: any) {
    console.error("Error starting video generation:", error);
    res.status(500).json({
      error: error?.message || "Failed to start video generation.",
    });
  }
});

// 6. Poll video status: POST /api/video-status
app.post("/api/video-status", async (req, res) => {
  try {
    const ai = getGenAiClient();
    if (!ai) {
      return res.status(503).json({ error: "GEMINI_API_KEY is not configured." });
    }

    const operationName = req.body?.operationName;
    if (!operationName) {
      return res.status(400).json({ error: "operationName is required." });
    }

    const op = new GenerateVideosOperation();
    op.name = operationName;
    const updated = await ai.operations.getVideosOperation({ operation: op });

    res.json({
      done: Boolean(updated.done),
      error: updated.error ? String(updated.error.message || updated.error) : null,
    });
  } catch (error: any) {
    console.error("Error polling video operation:", error);
    res.status(500).json({
      error: error?.message || "Failed to get video status.",
    });
  }
});

// 7. Download/Stream generated video: GET or POST /api/video-download
app.all("/api/video-download", async (req, res) => {
  try {
    const ai = getGenAiClient();
    const apiKey = process.env.GEMINI_API_KEY;
    if (!ai || !apiKey) {
      return res.status(503).json({ error: "GEMINI_API_KEY is not configured." });
    }

    const operationName = req.method === "GET" ? req.query?.operationName : req.body?.operationName;
    if (!operationName || typeof operationName !== "string") {
      return res.status(400).json({ error: "operationName is required." });
    }

    const op = new GenerateVideosOperation();
    op.name = operationName;
    const updated = await ai.operations.getVideosOperation({ operation: op });

    const uri = updated.response?.generatedVideos?.[0]?.video?.uri;
    if (!uri) {
      return res.status(404).json({ error: "Video URI not available. Operation may still be processing." });
    }

    const videoRes = await fetch(uri, {
      headers: { "x-goog-api-key": apiKey },
    });

    if (!videoRes.ok) {
      return res.status(videoRes.status).json({ error: `Failed to fetch video stream: ${videoRes.statusText}` });
    }

    res.setHeader("Content-Type", "video/mp4");
    res.setHeader("Content-Disposition", 'inline; filename="chatnova-veo-video.mp4"');

    const arrayBuffer = await videoRes.arrayBuffer();
    res.send(Buffer.from(arrayBuffer));
  } catch (error: any) {
    console.error("Error downloading video:", error);
    res.status(500).json({
      error: error?.message || "Failed to download generated video.",
    });
  }
});

async function startServer() {
  const server = http.createServer(app);

  // 8. WebSocket Server for Live voice conversations using gemini-3.8-live
  const wss = new WebSocketServer({ server, path: "/api/live" });

  wss.on("connection", async (clientWs: WebSocket) => {
    console.log("Client connected to Gemini Live voice socket");
    const ai = getGenAiClient();

    if (!ai) {
      clientWs.send(
        JSON.stringify({
          type: "error",
          message: "GEMINI_API_KEY is not configured on the server. Please check settings.",
        })
      );
      clientWs.close();
      return;
    }

    let liveSession: any = null;

    try {
      liveSession = await ai.live.connect({
        model: "gemini-3.8-live",
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Zephyr" } },
          },
          systemInstruction:
            "You are ChatNova — a warm, friendly, intelligent companion. You speak naturally in Hindi, English, or conversational Hinglish. Keep spoken responses concise, lively, and natural for real-time conversation.",
        },
        callbacks: {
          onmessage: (message: any) => {
            if (clientWs.readyState !== WebSocket.OPEN) return;

            // Model audio response chunk (24kHz PCM)
            const audioData = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (audioData) {
              clientWs.send(JSON.stringify({ type: "audio", audio: audioData }));
            }

            // User interrupted model speaking
            if (message.serverContent?.interrupted) {
              clientWs.send(JSON.stringify({ type: "interrupted" }));
            }

            // Text transcription if provided
            const textPart = message.serverContent?.modelTurn?.parts?.find((p: any) => p.text);
            if (textPart?.text) {
              clientWs.send(JSON.stringify({ type: "text", text: textPart.text }));
            }
          },
          onerror: (err: any) => {
            console.warn("Gemini Live session error:", err);
            if (clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(JSON.stringify({ type: "error", message: String(err?.message || err) }));
            }
          },
          onclose: () => {
            console.log("Gemini Live session closed");
            if (clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(JSON.stringify({ type: "closed" }));
            }
          },
        },
      });

      // Notify client that live session is ready
      clientWs.send(
        JSON.stringify({
          type: "ready",
          model: "gemini-3.8-live",
          message: "Connected to ChatNova Live Voice API",
        })
      );

      clientWs.on("message", (raw) => {
        try {
          const data = JSON.parse(raw.toString());
          if (data.type === "audio" && data.audio) {
            // Send 16kHz PCM audio to Gemini Live
            liveSession.sendRealtimeInput({
              audio: { data: data.audio, mimeType: "audio/pcm;rate=16000" },
            });
          } else if (data.type === "text" && data.text) {
            liveSession.sendRealtimeInput({
              text: data.text,
            });
          }
        } catch (err) {
          console.error("Error processing client live input:", err);
        }
      });

      clientWs.on("close", () => {
        try {
          if (liveSession) {
            liveSession.close();
          }
        } catch {
          // ignore
        }
      });
    } catch (connErr: any) {
      console.error("Failed to connect to Gemini Live:", connErr);
      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(
          JSON.stringify({
            type: "error",
            message: connErr?.message || "Failed to initialize Gemini Live session",
          })
        );
        clientWs.close();
      }
    }
  });

  // Vite middleware in dev; static dist in production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`ChatNova full-stack server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
