import React, { useState, useRef, useEffect } from "react";
import {
  Send,
  Mic,
  MicOff,
  Sparkles,
  Cpu,
  AlertCircle,
  Radio,
  Image as ImageIcon,
  Film,
} from "lucide-react";
import { ChatMode } from "../types";

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  mode: ChatMode;
  onOpenLiveVoice?: () => void;
  onOpenImageStudio?: () => void;
  onOpenVeoVideo?: () => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  isLoading,
  mode,
  onOpenLiveVoice,
  onOpenImageStudio,
  onOpenVeoVideo,
}) => {
  const [inputText, setInputText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState("");
  const [voiceNotice, setVoiceNotice] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const recognitionRef = useRef<any>(null);

  // Initialize Web Speech API recognition instance
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = "hi-IN"; // Supports Hindi & Hinglish/English mixed speech

        recognition.onstart = () => {
          setIsListening(true);
          setVoiceNotice(null);
        };

        recognition.onresult = (event: any) => {
          let finalTranscript = "";
          let currentInterim = "";

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript + " ";
            } else {
              currentInterim += transcript;
            }
          }

          if (finalTranscript) {
            setInputText((prev) => (prev ? `${prev.trim()} ${finalTranscript}`.trim() : finalTranscript.trim()));
          }
          setInterimText(currentInterim);
        };

        recognition.onerror = (event: any) => {
          console.warn("Speech recognition error:", event.error);
          setIsListening(false);
          setInterimText("");
          if (event.error === "not-allowed") {
            setVoiceNotice("Microphone permission denied. Please allow mic access in your browser.");
          } else if (event.error === "no-speech") {
            setVoiceNotice("No voice detected. Please try speaking closer to the mic.");
          } else {
            setVoiceNotice(`Speech error (${event.error}). Please try again.`);
          }
          setTimeout(() => setVoiceNotice(null), 5000);
        };

        recognition.onend = () => {
          setIsListening(false);
          setInterimText("");
        };

        recognitionRef.current = recognition;
      } catch (err) {
        console.error("Error setting up SpeechRecognition:", err);
      }
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  const handleToggleVoice = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setVoiceNotice("Web Speech API is not supported in this browser. Please use Google Chrome, Edge, or Safari.");
      setTimeout(() => setVoiceNotice(null), 6000);
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
      setIsListening(false);
      setInterimText("");
    } else {
      if (recognitionRef.current) {
        try {
          setVoiceNotice(null);
          recognitionRef.current.start();
        } catch (err: any) {
          console.warn("Recognition start failed:", err);
          // If already started, restart
          try {
            recognitionRef.current.stop();
            setTimeout(() => recognitionRef.current?.start(), 150);
          } catch {
            // ignore
          }
        }
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    const trimmed = inputText.trim();
    if (!trimmed || isLoading) return;
    if (isListening && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
      setIsListening(false);
      setInterimText("");
    }
    onSendMessage(trimmed);
    setInputText("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  // Adjust textarea height on input change
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        140
      )}px`;
    }
  };

  return (
    <div id="chat-input-wrapper" className="p-3 sm:p-4 bg-slate-950/75 border-t border-pink-500/20 backdrop-blur-md relative z-20">
      <div className="max-w-5xl mx-auto">
        {/* Active Voice Listening Banner */}
        {isListening && (
          <div
            id="voice-listening-banner"
            className="mb-2 px-3 py-2 rounded-xl bg-pink-950/60 border border-pink-500/40 flex items-center justify-between text-xs text-pink-200 animate-in fade-in duration-200"
          >
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-pink-500" />
              </span>
              <span className="font-semibold text-pink-300">Listening to your voice...</span>
              {interimText && (
                <span className="text-pink-100/90 italic truncate max-w-xs sm:max-w-md">
                  "{interimText}"
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={handleToggleVoice}
              className="text-[11px] px-2 py-0.5 rounded-lg bg-pink-900/70 hover:bg-pink-800 text-white font-medium transition-colors cursor-pointer"
            >
              Done Speaking
            </button>
          </div>
        )}

        {/* Voice Warning/Error Notice */}
        {voiceNotice && (
          <div
            id="voice-notice-banner"
            className="mb-2 px-3 py-1.5 rounded-xl bg-amber-950/80 border border-amber-600/40 text-amber-200 text-xs flex items-center justify-between animate-in fade-in duration-150"
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
              <span>{voiceNotice}</span>
            </div>
            <button
              type="button"
              onClick={() => setVoiceNotice(null)}
              className="text-amber-400 hover:text-white text-xs font-bold px-1.5 py-0.5"
            >
              ✕
            </button>
          </div>
        )}

        {/* Quick Action Pills for Image, Video, and Voice Call */}
        <div className="mb-2 flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {onOpenLiveVoice && (
            <button
              id="quick-live-voice-btn"
              type="button"
              onClick={onOpenLiveVoice}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-pink-950/60 hover:bg-pink-900/80 text-pink-300 hover:text-white border border-pink-500/30 hover:border-pink-500/60 transition-all cursor-pointer flex-shrink-0"
              title="Start Live Voice Call with ChatNova"
            >
              <Radio className="w-3 h-3 text-pink-400 animate-pulse" />
              <span>🎙️ Live Voice Call</span>
            </button>
          )}

          {onOpenImageStudio && (
            <button
              id="quick-image-studio-btn"
              type="button"
              onClick={onOpenImageStudio}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 hover:border-pink-500/40 transition-all cursor-pointer flex-shrink-0"
              title="Create or Edit Images with Gemini"
            >
              <ImageIcon className="w-3 h-3 text-pink-400" />
              <span>🎨 Create / Edit Image</span>
            </button>
          )}

          {onOpenVeoVideo && (
            <button
              id="quick-veo-video-btn"
              type="button"
              onClick={onOpenVeoVideo}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 hover:border-purple-500/40 transition-all cursor-pointer flex-shrink-0"
              title="Generate Video or Animate Photo with Veo 3"
            >
              <Film className="w-3 h-3 text-purple-400" />
              <span>🎬 Veo 3 Video</span>
            </button>
          )}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
          className={`relative flex items-end gap-2 bg-slate-950/80 border rounded-2xl p-2 transition-all shadow-inner ${
            isListening
              ? "border-pink-500 ring-2 ring-pink-500/40 shadow-pink-500/20"
              : "border-pink-500/25 focus-within:border-pink-500/60 focus-within:ring-1 focus-within:ring-pink-500/30"
          }`}
        >
          {/* Text input area */}
          <textarea
            id="chat-message-input"
            ref={textareaRef}
            rows={1}
            value={inputText}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={
              isListening
                ? "Listening... Speak in Hindi, English, or Hinglish..."
                : mode === "basic"
                ? "Type or use mic (e.g. 'hello', 'who are you', 'help')..."
                : "Ask ChatNova anything in Hindi, English, or Hinglish..."
            }
            className="w-full bg-transparent text-slate-100 text-sm placeholder:text-slate-500 resize-none focus:outline-none px-2 py-1.5 min-h-[40px] max-h-[140px] leading-relaxed"
          />

          {/* Controls: Voice & Send */}
          <div className="flex items-center gap-1.5 pb-0.5 flex-shrink-0">
            {/* Microphone Button with Web Speech API */}
            <button
              id="voice-dictate-btn"
              type="button"
              onClick={handleToggleVoice}
              title={
                isListening
                  ? "Stop listening (Microphone active)"
                  : "Start voice typing (Convert speech to text)"
              }
              className={`p-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center ${
                isListening
                  ? "bg-gradient-to-r from-pink-600 to-rose-600 text-white shadow-lg shadow-pink-600/50 ring-2 ring-pink-400 animate-pulse"
                  : "text-slate-400 hover:text-pink-300 hover:bg-slate-800/90 active:scale-95"
              }`}
            >
              {isListening ? (
                <div className="relative">
                  <Mic className="w-4 h-4 text-white" />
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-white animate-ping" />
                </div>
              ) : (
                <Mic className="w-4 h-4" />
              )}
            </button>

            {/* Send Button */}
            <button
              id="send-message-btn"
              type="submit"
              disabled={!inputText.trim() || isLoading}
              className={`p-2.5 rounded-xl flex items-center justify-center transition-all ${
                inputText.trim() && !isLoading
                  ? "bg-gradient-to-r from-pink-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 text-white shadow-md shadow-pink-600/30 cursor-pointer active:scale-95"
                  : "bg-slate-800/80 text-slate-500 cursor-not-allowed"
              }`}
              title="Send message (Enter)"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>

        {/* Footer info bar */}
        <div className="mt-2 px-2 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5">
            {mode === "ai" ? (
              <>
                <Sparkles className="w-3 h-3 text-pink-400" />
                <span>ChatNova AI mode active (Gemini 3.8 Flash)</span>
              </>
            ) : (
              <>
                <Cpu className="w-3 h-3 text-blue-400" />
                <span>ChatNova basic rule mode active</span>
              </>
            )}
            <span className="text-slate-600">•</span>
            <span className="text-slate-400 flex items-center gap-1">
              <Radio className="w-3 h-3 text-pink-400" />
              <span>Voice to Text ready</span>
            </span>
          </div>
          <span className="hidden sm:inline">Click mic or press Enter to send</span>
        </div>
      </div>
    </div>
  );
};

