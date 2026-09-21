import React, { useState, useRef } from "react";
import {
  Sparkles,
  Image as ImageIcon,
  Upload,
  Download,
  Film,
  RefreshCw,
  X,
  Sliders,
  Check,
  AlertCircle,
  MessageSquare,
  Wand2,
} from "lucide-react";

interface ImageStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialImage?: string | null;
  onSendToChat?: (imageUrl: string, prompt: string) => void;
  onOpenVeoWithImage?: (imageUrl: string) => void;
  onAnimateWithVeo?: (imageUrl: string) => void;
}

const ASPECT_RATIOS = [
  { id: "1:1", label: "1:1 Square", desc: "Social / Avatars" },
  { id: "16:9", label: "16:9 Landscape", desc: "Desktop / Wallpaper" },
  { id: "9:16", label: "9:16 Portrait", desc: "Stories / Reels" },
  { id: "4:3", label: "4:3 Classic", desc: "Standard Photo" },
  { id: "3:4", label: "3:4 Vertical", desc: "Portrait Post" },
] as const;

const SAMPLE_PROMPTS = [
  "A majestic cybernetic peacock with iridescent neon feathers in a futuristic Indian garden",
  "A cozy futuristic tea stall in Varanasi at sunset with glowing holographic lanterns",
  "Cute robotic red panda reading an ancient scroll under starry Himalayan skies",
  "Hyper-realistic electric sports car driving across a glass bridge over clouds, 8k cinematic",
];

export const ImageStudioModal: React.FC<ImageStudioModalProps> = ({
  isOpen,
  onClose,
  initialImage = null,
  onSendToChat,
  onOpenVeoWithImage,
  onAnimateWithVeo,
}) => {
  const [prompt, setPrompt] = useState("");
  const [aspectRatio, setAspectRatio] = useState<"1:1" | "16:9" | "9:16" | "4:3" | "3:4">("1:1");
  const [sourceImage, setSourceImage] = useState<string | null>(initialImage);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const [copiedNotification, setCopiedNotification] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Sync initial image if provided
  React.useEffect(() => {
    if (initialImage) {
      setSourceImage(initialImage);
    }
  }, [initialImage]);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrorNotice("Please select an image file (PNG, JPEG, WEBP).");
      return;
    }

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const base64 = uploadEvent.target?.result as string;
      setSourceImage(base64);
      setErrorNotice(null);
    };
    reader.readAsDataURL(file);
  };

  const handleGenerate = async () => {
    const trimmedPrompt = prompt.trim();
    if (!trimmedPrompt) {
      setErrorNotice("Please enter a prompt describing the image you want to create or edit.");
      return;
    }

    setIsGenerating(true);
    setErrorNotice(null);

    try {
      const response = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: trimmedPrompt,
          image: sourceImage || undefined,
          aspectRatio,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate image.");
      }

      if (data.imageUrl) {
        setGeneratedImage(data.imageUrl);
      } else {
        throw new Error("No image data returned from model.");
      }
    } catch (err: any) {
      console.error("Image generation error:", err);
      setErrorNotice(err?.message || "Failed to generate image. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!generatedImage) return;
    const a = document.createElement("a");
    a.href = generatedImage;
    a.download = `chatnova-gemini-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleSendToChatAction = () => {
    if (generatedImage && onSendToChat) {
      onSendToChat(generatedImage, prompt || "Generated AI Image");
      onClose();
    }
  };

  const handleAnimateWithVeo = () => {
    if (generatedImage) {
      if (onAnimateWithVeo) {
        onAnimateWithVeo(generatedImage);
      } else if (onOpenVeoWithImage) {
        onOpenVeoWithImage(generatedImage);
      }
      onClose();
    }
  };

  const handleUseAsEditSource = () => {
    if (generatedImage) {
      setSourceImage(generatedImage);
      setPrompt("");
      setGeneratedImage(null);
    }
  };

  return (
    <div
      id="image-studio-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div
        id="image-studio-modal"
        className="relative w-full max-w-4xl max-h-[92vh] bg-slate-900 border border-pink-500/30 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-slate-100"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-pink-600 to-indigo-600 text-white shadow-md shadow-pink-600/30">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base sm:text-lg text-white">AI Image Studio</h3>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/30 font-mono">
                  gemini-3.1-flash-image-preview
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Generate brand new visuals or edit existing photos with text instructions
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
            {/* Mode selection / Source Image display */}
            <div>
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center justify-between">
                <span>{sourceImage ? "Image to Edit (Source Image)" : "Create or Edit Mode"}</span>
                {sourceImage && (
                  <button
                    type="button"
                    onClick={() => setSourceImage(null)}
                    className="text-pink-400 hover:text-pink-300 text-xs font-medium cursor-pointer"
                  >
                    Clear source image
                  </button>
                )}
              </label>

              {sourceImage ? (
                <div className="relative rounded-2xl overflow-hidden border border-pink-500/40 bg-slate-950 p-2 flex items-center justify-center">
                  <img
                    src={sourceImage}
                    alt="Source for editing"
                    className="max-h-44 object-contain rounded-xl"
                  />
                  <div className="absolute top-3 right-3 flex items-center gap-1.5">
                    <span className="px-2 py-0.5 bg-slate-900/90 border border-pink-500/40 rounded-full text-[10px] text-pink-300 font-medium">
                      Editing Mode Active
                    </span>
                    <button
                      type="button"
                      onClick={() => setSourceImage(null)}
                      className="p-1 rounded-full bg-slate-900/90 hover:bg-rose-900 text-slate-300 hover:text-white text-xs"
                      title="Remove image"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-700/80 hover:border-pink-500/50 rounded-2xl p-4 bg-slate-950/40 hover:bg-slate-950/70 transition-all cursor-pointer flex flex-col items-center justify-center text-center group"
                >
                  <Upload className="w-7 h-7 text-slate-400 group-hover:text-pink-400 mb-1.5 transition-colors" />
                  <p className="text-xs text-slate-300 font-medium">
                    Upload a photo to <span className="text-pink-400 font-semibold">Edit</span> with AI
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Or leave empty to generate a brand new image from text
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

            {/* Prompt Input */}
            <div>
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 block">
                {sourceImage ? "Describe your edits / modifications" : "Enter Image Prompt"}
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={
                  sourceImage
                    ? "e.g. 'Add a glowing neon visor and cybernetic background', 'Change the lighting to sunset', 'Add a cute puppy next to the subject'"
                    : "e.g. 'A futuristic electric train zooming through a glowing cyberpunk city in India, cinematic lighting, 4k ultra-detailed'"
                }
                rows={4}
                className="w-full bg-slate-950 border border-slate-700/80 focus:border-pink-500 focus:ring-1 focus:ring-pink-500/30 rounded-2xl p-3.5 text-sm text-slate-100 placeholder:text-slate-500 resize-none outline-none leading-relaxed transition-all"
              />

              {/* Sample Prompt Pills */}
              <div className="mt-2 flex flex-wrap gap-1.5">
                <span className="text-[11px] text-slate-400 flex items-center gap-1 mr-1">
                  <Wand2 className="w-3 h-3 text-pink-400" /> Ideas:
                </span>
                {SAMPLE_PROMPTS.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setPrompt(p)}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/50 transition-colors text-left truncate max-w-full cursor-pointer"
                  >
                    {p.slice(0, 36)}...
                  </button>
                ))}
              </div>
            </div>

            {/* Aspect Ratio Selector */}
            <div>
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 block">
                Aspect Ratio
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {ASPECT_RATIOS.map((ratio) => (
                  <button
                    key={ratio.id}
                    type="button"
                    onClick={() => setAspectRatio(ratio.id as any)}
                    className={`p-2 rounded-xl text-left border transition-all cursor-pointer ${
                      aspectRatio === ratio.id
                        ? "bg-pink-950/60 border-pink-500 text-pink-200 ring-1 ring-pink-500/40"
                        : "bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700"
                    }`}
                  >
                    <div className="font-semibold text-xs text-white">{ratio.label}</div>
                    <div className="text-[10px] text-slate-400">{ratio.desc}</div>
                  </button>
                ))}
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
              id="generate-image-submit-btn"
              type="button"
              disabled={isGenerating || !prompt.trim()}
              onClick={handleGenerate}
              className={`w-full py-3.5 px-6 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg cursor-pointer ${
                isGenerating || !prompt.trim()
                  ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                  : "bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 text-white shadow-pink-600/30 active:scale-98"
              }`}
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-pink-300" />
                  <span>
                    {sourceImage
                      ? "Editing image with Gemini 3.1 Flash Image..."
                      : "Synthesizing image with Gemini 3.1 Flash Image..."}
                  </span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>{sourceImage ? "Generate Image Edits" : "Create Image"}</span>
                </>
              )}
            </button>
          </div>

          {/* Preview & Output Column */}
          <div className="lg:col-span-6 flex flex-col">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 block">
              Generated Visual Result
            </label>

            <div className="flex-1 min-h-[320px] rounded-3xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center p-4 relative overflow-hidden">
              {isGenerating ? (
                <div className="flex flex-col items-center text-center p-6 space-y-3">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full border-4 border-pink-500/20 border-t-pink-500 animate-spin" />
                    <Sparkles className="w-6 h-6 text-pink-400 absolute inset-0 m-auto animate-pulse" />
                  </div>
                  <p className="font-semibold text-sm text-pink-300">Rendering visual preview...</p>
                  <p className="text-xs text-slate-400 max-w-xs">
                    Calling gemini-3.1-flash-image-preview with your requested composition.
                  </p>
                </div>
              ) : generatedImage ? (
                <div className="w-full h-full flex flex-col items-center justify-center">
                  <img
                    src={generatedImage}
                    alt="AI Generated result"
                    className="max-h-[360px] w-auto max-w-full object-contain rounded-2xl shadow-xl border border-pink-500/20"
                  />

                  {/* Actions Bar for the generated image */}
                  <div className="mt-4 w-full flex flex-wrap items-center justify-center gap-2 pt-3 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={handleDownload}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Download image to your computer"
                    >
                      <Download className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Download</span>
                    </button>

                    {(onOpenVeoWithImage || onAnimateWithVeo) && (
                      <button
                        type="button"
                        onClick={handleAnimateWithVeo}
                        className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-600 hover:to-indigo-600 text-xs text-white font-medium flex items-center gap-1.5 transition-all shadow-sm shadow-indigo-500/30 cursor-pointer"
                        title="Animate this image into a video using Veo"
                      >
                        <Film className="w-3.5 h-3.5 text-pink-300" />
                        <span>🎬 Animate with Veo</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={handleUseAsEditSource}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Use this image as source to make further edits"
                    >
                      <Wand2 className="w-3.5 h-3.5 text-pink-400" />
                      <span>Edit This</span>
                    </button>

                    {onSendToChat && (
                      <button
                        type="button"
                        onClick={handleSendToChatAction}
                        className="px-3 py-1.5 rounded-xl bg-pink-900/50 hover:bg-pink-800 text-xs text-pink-200 hover:text-white border border-pink-500/40 flex items-center gap-1.5 transition-colors cursor-pointer"
                        title="Add this image into the active ChatNova conversation"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-pink-300" />
                        <span>Send to Chat</span>
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center text-center p-6 text-slate-500">
                  <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 mb-3 text-slate-600">
                    <ImageIcon className="w-10 h-10" />
                  </div>
                  <p className="text-sm font-medium text-slate-400">Ready to create</p>
                  <p className="text-xs text-slate-500 max-w-xs mt-1">
                    Enter a prompt on the left or upload a photo to edit, then click generate.
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
