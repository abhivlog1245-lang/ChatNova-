import React from "react";
import {
  History,
  Plus,
  Trash2,
  X,
  MessageSquare,
  Calendar,
  Sparkles,
  Download,
  LogOut,
  User,
} from "lucide-react";
import { ChatSession, UserProfile } from "../types";

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: ChatSession[];
  currentSessionId: string;
  onSelectSession: (sessionId: string) => void;
  onNewChat: () => void;
  onDeleteSession: (sessionId: string, e: React.MouseEvent) => void;
  onClearAllSessions: () => void;
  user: UserProfile | null;
  onOpenLogin: () => void;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  isOpen,
  onClose,
  sessions,
  currentSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  onClearAllSessions,
  user,
  onOpenLogin,
}) => {
  if (!isOpen) return null;

  const handleExportSession = (session: ChatSession, e: React.MouseEvent) => {
    e.stopPropagation();
    const exportText = session.messages
      .map(
        (m) =>
          `[${m.timestamp}] ${m.role === "assistant" ? "ChatNova" : "You"}: ${
            m.text
          }`
      )
      .join("\n\n");
    const blob = new Blob([exportText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ChatNova_${session.title.slice(0, 20).replace(/\s+/g, "_")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      id="history-drawer-overlay"
      className="fixed inset-0 z-50 flex bg-black/70 backdrop-blur-sm transition-opacity"
      onClick={onClose}
    >
      {/* Drawer panel */}
      <div
        id="history-drawer-panel"
        className="relative w-full max-w-xs sm:max-w-sm h-full bg-slate-950/95 border-r border-pink-500/20 text-slate-100 flex flex-col shadow-2xl backdrop-blur-xl animate-in slide-in-from-left duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-pink-500/20 bg-slate-950/80">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-pink-500/20 text-pink-400 border border-pink-500/30">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
                Chat History
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-pink-500/20 text-pink-300 font-semibold">
                  {sessions.length}
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">Past conversations</p>
            </div>
          </div>

          <button
            id="close-history-drawer-btn"
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* User Account / Google Login Card in Drawer */}
        <div className="px-3 py-2.5 bg-slate-900/60 border-b border-slate-800/80">
          {user ? (
            <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-950/60 border border-pink-500/20">
              <div className="flex items-center gap-2 min-w-0">
                {user.picture ? (
                  <img
                    src={user.picture}
                    alt={user.name}
                    referrerPolicy="no-referrer"
                    className="w-7 h-7 rounded-full object-cover ring-1 ring-pink-500/50 flex-shrink-0"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-pink-600 to-indigo-600 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-white truncate">{user.name}</p>
                  <p className="text-[10px] text-slate-400 truncate">{user.email}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenLogin();
                }}
                className="text-[10px] px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-pink-300 font-medium transition-colors flex-shrink-0 cursor-pointer"
              >
                Profile
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenLogin();
              }}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-white hover:bg-slate-100 text-slate-900 text-xs font-semibold shadow transition-all cursor-pointer"
            >
              <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
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
              <span>Sign in with Google</span>
            </button>
          )}
        </div>

        {/* New Chat Action */}
        <div className="p-3 border-b border-slate-800/80 bg-slate-900/40">
          <button
            id="history-new-chat-btn"
            type="button"
            onClick={() => {
              onNewChat();
              onClose();
            }}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-pink-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 text-white font-medium text-xs shadow-md shadow-pink-600/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Start New Chat</span>
          </button>
        </div>

        {/* Sessions list */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
          {sessions.length === 0 ? (
            <div className="text-center py-12 px-4 text-slate-400">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 text-slate-600 opacity-60" />
              <p className="text-xs font-medium text-slate-300">No chat history yet</p>
              <p className="text-[11px] text-slate-500 mt-1">
                Your conversations will automatically save here as you chat.
              </p>
            </div>
          ) : (
            sessions.map((session) => {
              const isActive = session.id === currentSessionId;
              const dateStr = new Date(session.createdAt).toLocaleDateString([], {
                month: "short",
                day: "numeric",
              });
              const timeStr = new Date(session.createdAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              });

              return (
                <div
                  key={session.id}
                  onClick={() => {
                    onSelectSession(session.id);
                    onClose();
                  }}
                  className={`group relative flex items-start justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${
                    isActive
                      ? "bg-pink-950/40 border-pink-500/50 shadow-sm shadow-pink-500/10 text-white"
                      : "bg-slate-900/60 hover:bg-slate-800/80 border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white"
                  }`}
                >
                  <div className="flex items-start gap-2.5 min-w-0 pr-1">
                    <MessageSquare
                      className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                        isActive ? "text-pink-400" : "text-slate-500"
                      }`}
                    />
                    <div className="min-w-0">
                      <h3 className="text-xs font-semibold truncate leading-tight">
                        {session.title || "New Conversation"}
                      </h3>
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-1">
                        <span>
                          {dateStr} • {timeStr}
                        </span>
                        <span>•</span>
                        <span>{session.messages.length} msgs</span>
                      </div>
                    </div>
                  </div>

                  {/* Action buttons (Export, Delete) */}
                  <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    <button
                      type="button"
                      onClick={(e) => handleExportSession(session, e)}
                      title="Export transcript"
                      className="p-1 rounded-md text-slate-400 hover:text-pink-300 hover:bg-slate-800"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => onDeleteSession(session.id, e)}
                      title="Delete chat"
                      className="p-1 rounded-md text-slate-400 hover:text-rose-400 hover:bg-rose-950/40"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Drawer footer */}
        {sessions.length > 0 && (
          <div className="p-3 border-t border-pink-500/20 bg-slate-950/80 flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={onClearAllSessions}
              className="text-[11px] text-rose-400/80 hover:text-rose-300 flex items-center gap-1 transition-colors"
            >
              <Trash2 className="w-3 h-3" />
              <span>Clear all history</span>
            </button>
            <span className="text-[10px] text-slate-500">Auto-saved locally</span>
          </div>
        )}
      </div>
    </div>
  );
};
