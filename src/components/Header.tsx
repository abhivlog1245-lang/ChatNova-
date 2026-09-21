import React from "react";
import {
  Bot,
  Sparkles,
  Code2,
  Trash2,
  Cpu,
  Wrench,
  History,
  Mic,
  Image as ImageIcon,
  Film,
  Radio,
} from "lucide-react";
import { ChatMode, ServerInfo, UserProfile } from "../types";

interface HeaderProps {
  mode: ChatMode;
  onModeChange: (newMode: ChatMode) => void;
  serverInfo: ServerInfo | null;
  onClearChat: () => void;
  onOpenCodeModal: () => void;
  onOpenHistory: () => void;
  historyCount: number;
  user: UserProfile | null;
  onOpenLogin: () => void;
  onOpenLiveVoice?: () => void;
  onOpenImageStudio?: () => void;
  onOpenVeoVideo?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  mode,
  onModeChange,
  serverInfo,
  onClearChat,
  onOpenCodeModal,
  onOpenHistory,
  historyCount,
  user,
  onOpenLogin,
  onOpenLiveVoice,
  onOpenImageStudio,
  onOpenVeoVideo,
}) => {
  return (
    <header
      id="chatnova-header"
      className="bg-slate-950/75 border-b border-pink-500/20 text-slate-100 px-4 py-3 sm:px-6 sticky top-0 z-30 shadow-lg backdrop-blur-md"
    >
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Brand identity */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                id="chatnova-header-logo"
                src="/chatnova-logo.jpg"
                alt="ChatNova Logo"
                referrerPolicy="no-referrer"
                className="w-10 h-10 rounded-full object-cover ring-2 ring-pink-500/60 shadow-md shadow-pink-500/25"
              />
              <span
                className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-slate-900 rounded-full"
                title="Online"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
                  <span className="bg-gradient-to-r from-pink-400 via-purple-300 to-blue-400 bg-clip-text text-transparent font-extrabold">
                    ChatNova
                  </span>
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/30">
                    v1.0
                  </span>
                  <span
                    id="4k-quality-badge"
                    className="text-[10px] font-black px-1.5 py-0.5 rounded bg-gradient-to-r from-pink-500/25 to-indigo-500/25 text-pink-200 border border-pink-500/40 tracking-wider shadow-xs shadow-pink-500/20"
                    title="4K Ultra-Sharp Quality Enabled"
                  >
                    4K UHD
                  </span>
                </h1>
              </div>
              <p className="text-xs text-slate-400">
                Aapka AI companion 🚀 • Hindi, English & Hinglish
              </p>
            </div>
          </div>

          {/* Mobile buttons */}
          <div className="flex items-center gap-1.5 sm:hidden">
            {/* User profile / Google sign-in (mobile) */}
            <button
              id="header-login-btn-mobile"
              type="button"
              onClick={onOpenLogin}
              title={user ? user.email : "Sign in with Google"}
              className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
            >
              {user ? (
                user.picture ? (
                  <img
                    src={user.picture}
                    alt={user.name}
                    referrerPolicy="no-referrer"
                    className="w-6 h-6 rounded-full object-cover ring-1 ring-pink-500"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-pink-600 to-indigo-600 flex items-center justify-center text-white text-[10px] font-bold">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                )
              ) : (
                <svg className="w-5 h-5 p-0.5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24Z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15Z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98Z"
                  />
                </svg>
              )}
            </button>

            <button
              id="header-history-btn-mobile"
              type="button"
              onClick={onOpenHistory}
              title="Chat History"
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-pink-400 transition-colors relative"
            >
              <History className="w-4 h-4" />
              {historyCount > 0 && (
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-pink-500" />
              )}
            </button>
            <button
              id="header-code-btn-mobile"
              type="button"
              onClick={onOpenCodeModal}
              title="View Python Source"
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              <Code2 className="w-4 h-4" />
            </button>
            <button
              id="header-clear-btn-mobile"
              type="button"
              onClick={onClearChat}
              title="Clear Conversation"
              className="p-2 rounded-lg bg-slate-800 hover:bg-rose-900/40 hover:text-rose-300 text-slate-400 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Action Controls & Mode Switcher */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
          {/* Google Login / User Profile (Desktop) */}
          {user ? (
            <button
              id="header-user-profile-btn"
              type="button"
              onClick={onOpenLogin}
              className="inline-flex items-center gap-2 p-1 pl-1.5 pr-2.5 rounded-full bg-slate-900/90 hover:bg-slate-800 border border-pink-500/30 transition-all cursor-pointer shadow-sm"
              title={user.email}
            >
              {user.picture ? (
                <img
                  src={user.picture}
                  alt={user.name}
                  referrerPolicy="no-referrer"
                  className="w-6 h-6 rounded-full object-cover ring-1 ring-pink-400"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-pink-600 to-indigo-600 flex items-center justify-center text-white text-[11px] font-bold">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="text-xs font-semibold text-slate-200 max-w-[90px] truncate">
                {user.name}
              </span>
            </button>
          ) : (
            <button
              id="header-google-login-btn"
              type="button"
              onClick={onOpenLogin}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-900 text-xs font-semibold shadow-md shadow-pink-500/10 transition-all cursor-pointer"
              title="Sign in with Google"
            >
              <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24Z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15Z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98Z"
                />
              </svg>
              <span>Sign In</span>
            </button>
          )}

          {/* History Button (Desktop) */}
          <button
            id="header-history-btn"
            type="button"
            onClick={onOpenHistory}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-pink-500/30 hover:border-pink-500/60 text-xs font-semibold shadow-sm transition-all cursor-pointer"
            title="Chat History"
          >
            <History className="w-3.5 h-3.5 text-pink-400" />
            <span>History</span>
            {historyCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-pink-500/20 text-pink-300 text-[10px] font-bold border border-pink-500/30">
                {historyCount}
              </span>
            )}
          </button>

          {/* Engine Mode Toggle */}
          <div
            id="engine-mode-selector"
            className="flex items-center bg-slate-800/90 p-1 rounded-xl border border-slate-700/70 text-xs shadow-inner"
          >
            <button
              id="mode-ai-btn"
              type="button"
              onClick={() => onModeChange("ai")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                mode === "ai"
                  ? "bg-gradient-to-r from-pink-600 to-indigo-600 text-white shadow-sm shadow-pink-500/20"
                  : "text-slate-400 hover:text-slate-200"
              }`}
              title="Uses Gemini 3.8 Flash to power ChatNova"
            >
              <Sparkles className="w-3.5 h-3.5 text-pink-300" />
              <span>AI Mode</span>
              {serverInfo?.aiConfigured && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              )}
            </button>

            <button
              id="mode-basic-btn"
              type="button"
              onClick={() => onModeChange("basic")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                mode === "basic"
                  ? "bg-amber-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
              title="Uses the exact Python Flask rule-based logic"
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>Basic Rule Mode</span>
            </button>
          </div>

          {/* AI Features Button Group */}
          <div className="flex items-center gap-1.5">
            {onOpenLiveVoice && (
              <button
                id="header-live-voice-btn"
                type="button"
                onClick={onOpenLiveVoice}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white text-xs font-semibold shadow-md shadow-pink-600/30 transition-all cursor-pointer active:scale-95"
                title="Start Real-time Voice Call with ChatNova (gemini-3.8-live)"
              >
                <Radio className="w-3.5 h-3.5 text-white animate-pulse" />
                <span>Live Voice</span>
              </button>
            )}

            {onOpenImageStudio && (
              <button
                id="header-image-studio-btn"
                type="button"
                onClick={onOpenImageStudio}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-pink-300 border border-pink-500/30 hover:border-pink-500/60 text-xs font-medium transition-all cursor-pointer"
                title="Create & Edit Images (gemini-3.1-flash-image-preview)"
              >
                <ImageIcon className="w-3.5 h-3.5 text-pink-400" />
                <span className="hidden md:inline">Image Studio</span>
              </button>
            )}

            {onOpenVeoVideo && (
              <button
                id="header-veo-video-btn"
                type="button"
                onClick={onOpenVeoVideo}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-purple-300 border border-purple-500/30 hover:border-purple-500/60 text-xs font-medium transition-all cursor-pointer"
                title="Veo 3 Video Generator & Photo Animation (veo-3.1-fast-generate-preview)"
              >
                <Film className="w-3.5 h-3.5 text-purple-400" />
                <span className="hidden md:inline">Veo Video</span>
              </button>
            )}
          </div>

          {/* Python Code Viewer button */}
          <button
            id="view-python-code-btn"
            type="button"
            onClick={onOpenCodeModal}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/60 text-xs font-medium transition-colors"
          >
            <Code2 className="w-3.5 h-3.5 text-indigo-400" />
            <span>Python Flask Code</span>
          </button>

          {/* Clear conversation */}
          <button
            id="clear-chat-btn"
            type="button"
            onClick={onClearChat}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-950/40 hover:text-rose-300 hover:border-rose-900/50 text-slate-400 border border-slate-700/60 text-xs font-medium transition-colors"
            title="Clear Chat History"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>
        </div>
      </div>
    </header>
  );
};

