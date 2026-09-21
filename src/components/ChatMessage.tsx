import React, { useState } from "react";
import {
  Bot,
  User,
  Copy,
  Check,
  Volume2,
  VolumeX,
  Sparkles,
  Cpu,
  Film,
  Wand2,
  Download,
} from "lucide-react";
import { Message, UserProfile } from "../types";

interface ChatMessageProps {
  message: Message;
  user?: UserProfile | null;
  onAnimateImage?: (imageUrl: string) => void;
  onEditImage?: (imageUrl: string) => void;
}

const CodeSnippet: React.FC<{ language: string; code: string }> = ({ language, code }) => {
  const [codeCopied, setCodeCopied] = useState(false);

  const handleCopyCode = async () => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(code);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = code;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand("copy");
        textArea.remove();
      }
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <div className="my-3 rounded-xl overflow-hidden border border-slate-700/80 bg-slate-950 font-mono text-xs shadow-md">
      <div className="bg-slate-900/90 px-3 py-1.5 text-[11px] text-slate-400 border-b border-slate-800 flex justify-between items-center">
        <span className="font-semibold uppercase tracking-wider text-slate-300">{language || "code"}</span>
        <button
          type="button"
          onClick={handleCopyCode}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
          title="Copy code to clipboard"
        >
          {codeCopied ? (
            <>
              <Check className="w-3 h-3 text-emerald-400" />
              <span className="text-emerald-400 font-medium">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3 text-pink-400" />
              <span>Copy Code</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-3 overflow-x-auto text-emerald-300 leading-relaxed font-mono">
        <code>{code}</code>
      </pre>
    </div>
  );
};

export const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  user,
  onAnimateImage,
  onEditImage,
}) => {
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const isUser = message.role === "user";

  const handleCopy = async () => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(message.text);
      } else {
        // Fallback for environments where navigator.clipboard might be restricted
        const textArea = document.createElement("textarea");
        textArea.value = message.text;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand("copy");
        textArea.remove();
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.warn("Failed to copy text:", err);
    }
  };

  const handleSpeak = () => {
    if (!("speechSynthesis" in window)) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel(); // stop any ongoing speech
    const utterance = new SpeechSynthesisUtterance(message.text);
    
    // Choose appropriate voice if available (Hindi / Indian English / default)
    const voices = window.speechSynthesis.getVoices();
    const hindiVoice = voices.find(
      (v) => v.lang.includes("hi") || v.lang.includes("HI") || v.name.includes("Hindi")
    );
    const indianVoice = voices.find(
      (v) => v.lang === "en-IN" || v.name.includes("India")
    );
    if (hindiVoice) {
      utterance.voice = hindiVoice;
    } else if (indianVoice) {
      utterance.voice = indianVoice;
    }

    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  // Render text with code blocks and paragraphs formatted cleanly
  const renderFormattedContent = (content: string) => {
    const parts = content.split(/(```[\s\S]*?```)/g);

    return parts.map((part, index) => {
      if (part.startsWith("```") && part.endsWith("```")) {
        const lines = part.slice(3, -3).trim().split("\n");
        let language = "";
        let codeBody = part.slice(3, -3).trim();

        if (lines[0] && !lines[0].includes(" ") && lines.length > 1) {
          language = lines[0];
          codeBody = lines.slice(1).join("\n");
        }

        return (
          <CodeSnippet
            key={index}
            language={language}
            code={codeBody}
          />
        );
      }

      // Format normal text with line breaks and bold highlighting
      return (
        <div key={index} className="space-y-2 leading-relaxed whitespace-pre-wrap">
          {part.split("\n\n").map((para, pIdx) => (
            <p key={pIdx}>{para}</p>
          ))}
        </div>
      );
    });
  };

  return (
    <div
      id={`message-${message.id}`}
      className={`flex items-start gap-3 my-3 px-2 sm:px-0 group ${
        isUser ? "flex-row-reverse" : "flex-row"
      }`}
    >
      {/* Avatar */}
      {isUser ? (
        user?.picture ? (
          <img
            src={user.picture}
            alt={user.name}
            referrerPolicy="no-referrer"
            className="w-8 h-8 rounded-full object-cover ring-1 ring-pink-500/60 shadow-md flex-shrink-0"
          />
        ) : (
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-white shadow-md bg-gradient-to-tr from-pink-600 to-indigo-600">
            {user ? (
              <span className="text-xs font-bold">{user.name.charAt(0).toUpperCase()}</span>
            ) : (
              <User className="w-4 h-4" />
            )}
          </div>
        )
      ) : (
        <img
          src="/chatnova-logo.jpg"
          alt="ChatNova"
          referrerPolicy="no-referrer"
          className="w-8 h-8 rounded-full object-cover ring-1 ring-pink-500/60 shadow-sm flex-shrink-0"
        />
      )}

      {/* Bubble Container */}
      <div
        className={`max-w-[85%] sm:max-w-[78%] rounded-2xl p-3.5 shadow-md text-sm ${
          isUser
            ? "bg-gradient-to-r from-pink-600 to-indigo-600 text-white rounded-tr-xs shadow-pink-600/20"
            : "bg-slate-950/75 border border-pink-500/20 text-slate-100 rounded-tl-xs backdrop-blur-sm"
        }`}
      >
        {/* Assistant Header info (Mode pill, timestamp) */}
        {!isUser && (
          <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-pink-500/10 text-[11px] text-slate-400">
            <div className="flex items-center gap-1.5 font-medium">
              <span className="text-pink-200 font-semibold">ChatNova</span>
              {message.source === "gemini" ? (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-pink-500/20 text-pink-300 border border-pink-500/30 text-[10px]">
                  <Sparkles className="w-2.5 h-2.5" />
                  Gemini 3.8
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[10px]">
                  <Cpu className="w-2.5 h-2.5" />
                  Python Logic
                </span>
              )}
            </div>
            <span>{message.timestamp}</span>
          </div>
        )}

        {/* Message Content */}
        <div className="break-words">
          {message.text && renderFormattedContent(message.text)}
        </div>

        {/* Media Attachments: Image */}
        {message.imageUrl && (
          <div className="mt-3 rounded-2xl overflow-hidden border border-pink-500/30 bg-slate-950/60 p-1.5 shadow-lg">
            <img
              src={message.imageUrl}
              alt="AI Attachment"
              className="max-h-72 w-auto max-w-full rounded-xl object-contain mx-auto"
            />
            <div className="mt-2 pt-1.5 border-t border-slate-800/80 flex flex-wrap items-center justify-end gap-1.5 text-[11px]">
              {onAnimateImage && (
                <button
                  type="button"
                  onClick={() => onAnimateImage(message.imageUrl!)}
                  className="px-2 py-1 rounded-lg bg-purple-900/60 hover:bg-purple-800 text-purple-200 hover:text-white border border-purple-500/30 flex items-center gap-1 transition-colors cursor-pointer"
                  title="Animate this image into video with Veo"
                >
                  <Film className="w-3 h-3 text-pink-300" />
                  <span>Animate with Veo</span>
                </button>
              )}
              {onEditImage && (
                <button
                  type="button"
                  onClick={() => onEditImage(message.imageUrl!)}
                  className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
                  title="Edit this image with Gemini"
                >
                  <Wand2 className="w-3 h-3 text-pink-400" />
                  <span>Edit Image</span>
                </button>
              )}
              <a
                href={message.imageUrl}
                download="chatnova-image.png"
                className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center gap-1 transition-colors"
                title="Download image"
              >
                <Download className="w-3 h-3 text-emerald-400" />
                <span>Save</span>
              </a>
            </div>
          </div>
        )}

        {/* Media Attachments: Video */}
        {message.videoUrl && (
          <div className="mt-3 rounded-2xl overflow-hidden border border-purple-500/30 bg-black p-1.5 shadow-lg">
            <video
              src={message.videoUrl}
              controls
              autoPlay
              loop
              playsInline
              className="max-h-72 w-auto max-w-full rounded-xl object-contain mx-auto"
            />
            <div className="mt-2 pt-1.5 border-t border-slate-800/80 flex items-center justify-end gap-1.5 text-[11px]">
              <a
                href={message.videoUrl}
                download="chatnova-veo-video.mp4"
                className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center gap-1 transition-colors"
                title="Download video"
              >
                <Download className="w-3 h-3 text-emerald-400" />
                <span>Download MP4</span>
              </a>
            </div>
          </div>
        )}

        {/* Action toolbar for assistant responses */}
        {!isUser && (
          <div className="mt-2.5 pt-2 border-t border-pink-500/15 flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Copy to Clipboard Button */}
              <button
                id={`copy-clipboard-btn-${message.id}`}
                type="button"
                onClick={handleCopy}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all cursor-pointer text-xs font-medium ${
                  copied
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm shadow-emerald-500/10"
                    : "bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-pink-500/25 hover:border-pink-500/50 active:scale-95"
                }`}
                title="Copy assistant response to clipboard"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-300 font-semibold">Copied to Clipboard!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-pink-400" />
                    <span>Copy to Clipboard</span>
                  </>
                )}
              </button>

              {"speechSynthesis" in window && (
                <button
                  id={`speak-btn-${message.id}`}
                  type="button"
                  onClick={handleSpeak}
                  className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs transition-all cursor-pointer ${
                    isSpeaking
                      ? "text-rose-300 bg-rose-950/50 border border-rose-700/50 shadow-sm"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 border border-transparent"
                  }`}
                  title={isSpeaking ? "Stop speaking" : "Listen to ChatNova voice output"}
                >
                  {isSpeaking ? (
                    <>
                      <VolumeX className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
                      <span>Stop</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Listen</span>
                    </>
                  )}
                </button>
              )}
            </div>

            <span className="text-[10px] text-slate-500 font-mono">{message.timestamp}</span>
          </div>
        )}

        {/* User timestamp & copy button */}
        {isUser && (
          <div className="mt-1 flex items-center justify-end gap-1.5 text-[10px] text-indigo-200">
            <button
              id={`copy-user-msg-btn-${message.id}`}
              type="button"
              onClick={handleCopy}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:text-white cursor-pointer"
              title="Copy message to clipboard"
            >
              {copied ? (
                <span className="text-[10px] text-emerald-300 flex items-center gap-0.5">
                  <Check className="w-2.5 h-2.5" /> Copied
                </span>
              ) : (
                <Copy className="w-3 h-3 text-pink-200" />
              )}
            </button>
            <span>{message.timestamp}</span>
          </div>
        )}
      </div>
    </div>
  );
};
