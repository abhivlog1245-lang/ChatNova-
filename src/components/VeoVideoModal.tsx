import React, { useState, useRef, useEffect } from "react";
import {
  Film,
  Sparkles,
  Upload,
  Download,
  X,
  Play,
  RotateCcw,
  AlertCircle,
  Clock,
  Video,
  Layers,
  MessageSquare,
  CheckCircle2,
} from "lucide-react";

interface VeoVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialImage?: string | null;
  onSendToChat?: (videoUrl: string, prompt: string) => void;
}

const STATUS_MESSAGES = [
  "Submitting scene parameters to Veo 3 Video Engine...",
  "Analyzing visual depth and physics vectors...",
  "Synthesizing high-frame-rate motion paths...",
  "Rendering cinematic lighting and specular highlights...",
  "Encoding MP4 video stream...",
  "Finalizing video output...",
];

export const VeoVideoModal: React.FC<VeoVideoModalProps> = ({
  isOpen,
  onClose,
  initialImage = null,
  onSendToChat,
}) => {
  const [mode, setMode] = useState<"text_to_video" | "image_to_video">(
    initialImage ? "image_to_video" : "text_to_video"
  );
  const [prompt, setPrompt] = useState("");
  const [sourceImage, setSourceImage] = useState<string | null>(initialImage);
  const [aspectRatio, setAspectRatio] = useState<"16:9" | "9:16">("16:9");
  const [resolution, setResolution] = useState<"720p" | "1080p">("720p");

  const [isGenerating, setIsGenerating] = useState(false);
  const [statusMessageIndex, setStatusMessageIndex] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const pollIntervalRef = useRef<any>(null);
  const timerIntervalRef = useRef<any>(null);

  // Sync initial image if provided
  useEffect(() => {
    if (initialImage) {
      setSourceImage(initialImage);
      setMode("image_to_video");
    }
  }, [initialImage]);

  // Cycle status messages while generating
  useEffect(() => {
    if (isGenerating) {
      const msgInterval = setInterval(() => {
        setStatusMessageIndex((prev) => (prev + 1) % STATUS_MESSAGES.length);
      }, 7000);

      const tInterval = setInterval(() => {
        setElapsedSeconds((s) => s + 1);
      }, 1000);
      timerIntervalRef.current = tInterval;

      return () => {
        clearInterval(msgInterval);
        clearInterval(tInterval);
      };
    } else {
      setElapsedSeconds(0);
    }
  }, [isGenerating]);

  // Clean up polling intervals on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, []);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrorNotice("Please select an image file (PNG, JPG, WEBP) to animate.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target?.result as string;
      setSourceImage(base64);
      setMode("image_to_video");
      setErrorNotice(null);
    };
    reader.readAsDataURL(file);
  };

  const startGeneration = async () => {
    const trimmedPrompt = prompt.trim();

    if (mode === "text_to_video" && !trimmedPrompt) {
      setErrorNotice("Please enter a prompt describing the video you want to generate.");
      return;
    }

    if (mode === "image_to_video" && !sourceImage) {
      setErrorNotice("Please upload a photo to animate.");
      return;
    }

    setIsGenerating(true);
    setErrorNotice(null);
    setGeneratedVideoUrl(null);
    setStatusMessageIndex(0);

    try {
      // Step 1: Initiate video generation on server
      const res = await fetch("/api/generate-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: trimmedPrompt || "Smooth cinematic camera motion, realistic lighting and fluid dynamics",
          image: mode === "image_to_video" ? sourceImage : undefined,
          aspectRatio,
          resolution,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to start video generation.");
      }

      const operationName = data.operationName;
      if (!operationName) {
        throw new Error("Did not receive a valid operation ID from Veo.");
      }

      // Step 2: Poll operation status every 7 seconds
      const poll = async () => {
        try {
          const statusRes = await fetch("/api/video-status", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ operationName }),
          });

          const statusData = await statusRes.json();
          if (!statusRes.ok) {
            throw new Error(statusData.error || "Status check failed");
          }

          if (statusData.error) {
            clearInterval(pollIntervalRef.current);
            setIsGenerating(false);
            setErrorNotice(statusData.error);
            return;
          }

          if (statusData.done) {
            clearInterval(pollIntervalRef.current);
            // Step 3: Fetch video blob
            await fetchVideoFile(operationName);
          }
        } catch (pollErr: any) {
          console.warn("Polling error:", pollErr);
        }
      };

      // Start interval
      pollIntervalRef.current = setInterval(poll, 7000);
      // Run first poll after 3s
      setTimeout(poll, 3000);
    } catch (err: any) {
      console.error("Video generation failed:", err);
      setIsGenerating(false);
      setErrorNotice(err?.message || "Failed to generate video.");
    }
  };

  const fetchVideoFile = async (operationName: string) => {
    try {
      const response = await fetch(`/api/video-download?operationName=${encodeURIComponent(operationName)}`);
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || "Failed to download generated video.");
      }

      const blob = await response.blob();
      const videoBlobUrl = URL.createObjectURL(blob);
      setGeneratedVideoUrl(videoBlobUrl);
      setIsGenerating(false);
    } catch (fetchErr: any) {
      console.error("Failed to fetch final video:", fetchErr);
      setErrorNotice(fetchErr?.message || "Could not retrieve the generated video file.");
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!generatedVideoUrl) return;
    const a = document.createElement("a");
    a.href = generatedVideoUrl;
    a.download = `chatnova-veo-${Date.now()}.mp4`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleSendToChatAction = () => {
    if (generatedVideoUrl && onSendToChat) {
      onSendToChat(
        generatedVideoUrl,
        prompt || (mode === "image_to_video" ? "Veo Animated Photo" : "Veo 3 Video")
      );
      onClose();
    }
  };

  return (
    <div
      id="veo-video-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div
        id="veo-video-modal"
        className="relative w-full max-w-4xl max-h-[92vh] bg-slate-900 border border-purple-500/30 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-slate-100"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/30">
              <Film className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base sm:text-lg text-white">Veo 3 Video Generator</h3>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-mono">
                  veo-3.1-fast-generate-preview
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Text-to-Video and Photo Animation in 16:9 Landscape or 9:16 Portrait
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Controls Column */}
          <div className="lg:col-span-6 flex flex-col space-y-5">
            {/* Mode Switcher */}
            <div className="flex rounded-2xl bg-slate-950 p-1 border border-slate-800">
              <button
                type="button"
                onClick={() => setMode("text_to_video")}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  mode === "text_to_video"
                    ? "bg-purple-600 text-white shadow-md"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Video className="w-3.5 h-3.5" />
                <span>Text to Video</span>
              </button>
              <button
                type="button"
                onClick={() => setMode("image_to_video")}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  mode === "image_to_video"
                    ? "bg-purple-600 text-white shadow-md"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Animate Photo</span>
              </button>
            </div>

            {/* Photo Uploader (for Image to Video mode) */}
            {mode === "image_to_video" && (
              <div>
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span>Photo to Animate</span>
                  {sourceImage && (
                    <button
                      type="button"
                      onClick={() => setSourceImage(null)}
                      className="text-purple-400 hover:text-purple-300 text-xs font-medium cursor-pointer"
                    >
                      Change photo
                    </button>
                  )}
                </label>

                {sourceImage ? (
                  <div className="relative rounded-2xl overflow-hidden border border-purple-500/40 bg-slate-950 p-2 flex items-center justify-center">
                    <img
                      src={sourceImage}
                      alt="Source for animation"
                      className="max-h-40 object-contain rounded-xl"
                    />
                    <div className="absolute top-3 right-3 flex items-center gap-1.5">
                      <span className="px-2 py-0.5 bg-slate-900/90 border border-purple-500/40 rounded-full text-[10px] text-purple-300 font-medium">
                        Photo Ready for Veo
                      </span>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-700/80 hover:border-purple-500/50 rounded-2xl p-5 bg-slate-950/40 hover:bg-slate-950/70 transition-all cursor-pointer flex flex-col items-center justify-center text-center group"
                  >
                    <Upload className="w-7 h-7 text-slate-400 group-hover:text-purple-400 mb-1.5 transition-colors" />
                    <p className="text-xs text-slate-200 font-medium">
                      Upload a photo to animate into video
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Veo 3 will add realistic motion, camera movement, and life
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Prompt Input */}
            <div>
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 block">
                {mode === "image_to_video" ? "Motion Instructions (Optional)" : "Video Prompt"}
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={
                  mode === "image_to_video"
                    ? "e.g. 'The camera pans slowly around the subject with soft golden sunlight and fluttering particles'"
                    : "e.g. 'A neon-lit hovercraft racing through a rain-drenched futuristic metropolis, 4k ultra-cinematic, dynamic camera angles'"
                }
                rows={3}
                className="w-full bg-slate-950 border border-slate-700/80 focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30 rounded-2xl p-3.5 text-sm text-slate-100 placeholder:text-slate-500 resize-none outline-none leading-relaxed transition-all"
              />
            </div>

            {/* Aspect Ratio Selector (16:9 vs 9:16) */}
            <div>
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 block">
                Veo Aspect Ratio
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setAspectRatio("16:9")}
                  className={`p-3 rounded-2xl text-left border transition-all cursor-pointer ${
                    aspectRatio === "16:9"
                      ? "bg-purple-950/60 border-purple-500 text-purple-200 ring-1 ring-purple-500/40"
                      : "bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <div className="font-semibold text-xs text-white">16:9 Landscape</div>
                  <div className="text-[10px] text-slate-400">Desktop, YouTube & Cinema</div>
                </button>

                <button
                  type="button"
                  onClick={() => setAspectRatio("9:16")}
                  className={`p-3 rounded-2xl text-left border transition-all cursor-pointer ${
                    aspectRatio === "9:16"
                      ? "bg-purple-950/60 border-purple-500 text-purple-200 ring-1 ring-purple-500/40"
                      : "bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <div className="font-semibold text-xs text-white">9:16 Portrait</div>
                  <div className="text-[10px] text-slate-400">Reels, Shorts & Mobile</div>
                </button>
              </div>
            </div>

            {/* Error Notification */}
            {errorNotice && (
              <div className="p-3 rounded-xl bg-rose-950/70 border border-rose-600/50 text-rose-200 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                <span>{errorNotice}</span>
              </div>
            )}

            {/* Generate Action Button */}
            <button
              id="generate-veo-video-btn"
              type="button"
              disabled={isGenerating || (mode === "text_to_video" && !prompt.trim()) || (mode === "image_to_video" && !sourceImage)}
              onClick={startGeneration}
              className={`w-full py-3.5 px-6 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg cursor-pointer ${
                isGenerating || (mode === "text_to_video" && !prompt.trim()) || (mode === "image_to_video" && !sourceImage)
                  ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                  : "bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-purple-600/30 active:scale-98"
              }`}
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-purple-300 border-t-transparent animate-spin" />
                  <span>Veo 3 is rendering your video... ({elapsedSeconds}s)</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>{mode === "image_to_video" ? "Animate Photo into Video" : "Generate Veo Video"}</span>
                </>
              )}
            </button>
          </div>

          {/* Video Player / Status Column */}
          <div className="lg:col-span-6 flex flex-col">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 block">
              Veo Video Output
            </label>

            <div className="flex-1 min-h-[320px] rounded-3xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center p-4 relative overflow-hidden">
              {isGenerating ? (
                <div className="flex flex-col items-center text-center p-6 space-y-4 max-w-sm">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-full border-4 border-purple-500/20 border-t-purple-500 animate-spin" />
                    <Film className="w-8 h-8 text-purple-400 absolute inset-0 m-auto animate-pulse" />
                  </div>

                  <div>
                    <p className="font-bold text-sm text-purple-300">
                      {STATUS_MESSAGES[statusMessageIndex]}
                    </p>
                    <p className="text-xs text-slate-400 mt-1 flex items-center justify-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      <span>Elapsed time: {elapsedSeconds}s (Veo 3 fast generation)</span>
                    </p>
                  </div>

                  <div className="w-full bg-slate-800/60 rounded-full h-2 overflow-hidden">
                    <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-full w-3/4 animate-pulse" />
                  </div>

                  <p className="text-[11px] text-slate-500 leading-normal">
                    Video diffusion models generate multi-frame temporal coherency. Please keep this open while frames finish rendering.
                  </p>
                </div>
              ) : generatedVideoUrl ? (
                <div className="w-full h-full flex flex-col items-center justify-center">
                  <div
                    className={`relative rounded-2xl overflow-hidden shadow-2xl border border-purple-500/30 bg-black flex items-center justify-center ${
                      aspectRatio === "9:16" ? "max-h-[380px] aspect-[9/16]" : "w-full aspect-[16/9]"
                    }`}
                  >
                    <video
                      src={generatedVideoUrl}
                      controls
                      autoPlay
                      loop
                      playsInline
                      className="w-full h-full object-contain"
                    />
                  </div>

                  {/* Actions Bar */}
                  <div className="mt-4 w-full flex flex-wrap items-center justify-center gap-2 pt-3 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={handleDownload}
                      className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Download MP4 video"
                    >
                      <Download className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Download MP4</span>
                    </button>

                    {onSendToChat && (
                      <button
                        type="button"
                        onClick={handleSendToChatAction}
                        className="px-3.5 py-1.5 rounded-xl bg-purple-900/60 hover:bg-purple-800 text-xs text-purple-200 hover:text-white border border-purple-500/40 flex items-center gap-1.5 transition-colors cursor-pointer"
                        title="Add this video to the ChatNova conversation"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-purple-300" />
                        <span>Send to Chat</span>
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center text-center p-6 text-slate-500">
                  <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 mb-3 text-slate-600">
                    <Film className="w-10 h-10" />
                  </div>
                  <p className="text-sm font-medium text-slate-400">Veo 3 Video Ready</p>
                  <p className="text-xs text-slate-500 max-w-xs mt-1">
                    Select "Text to Video" or "Animate Photo", set your prompt, and let Veo synthesize your cinematic scene.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
