/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { Header } from "./components/Header";
import { ChatMessage } from "./components/ChatMessage";
import { QuickPrompts } from "./components/QuickPrompts";
import { ChatInput } from "./components/ChatInput";
import { PythonCodeModal } from "./components/PythonCodeModal";
import { HistoryDrawer } from "./components/HistoryDrawer";
import { GoogleLoginModal } from "./components/GoogleLoginModal";
import { LiveVoiceModal } from "./components/LiveVoiceModal";
import { ImageStudioModal } from "./components/ImageStudioModal";
import { VeoVideoModal } from "./components/VeoVideoModal";
import { ChatMode, Message, ServerInfo, ChatSession, UserProfile } from "./types";
import { Bot, Sparkles, AlertCircle, RefreshCw } from "lucide-react";

const INITIAL_MESSAGES: Message[] = [
  {
    id: "welcome-1",
    role: "assistant",
    text: "Hello! 👋 Main ChatNova hoon — aapka AI companion 🚀\n\nAap mujhse questions, ideas, coding aur bahut kuch pooch sakte ho (Hindi, English ya Hinglish me)! Kaise madad kar sakta hoon aapki?",
    timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    source: "gemini",
  },
];

export default function App() {
  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const saved = localStorage.getItem("chatnova_messages");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return INITIAL_MESSAGES;
  });

  const [mode, setMode] = useState<ChatMode>(() => {
    try {
      const saved = localStorage.getItem("chatnova_mode");
      if (saved === "basic" || saved === "ai") return saved;
    } catch {
      // ignore
    }
    return "ai";
  });

  const [serverInfo, setServerInfo] = useState<ServerInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCodeModalOpen, setIsCodeModalOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isLiveVoiceOpen, setIsLiveVoiceOpen] = useState(false);
  const [isImageStudioOpen, setIsImageStudioOpen] = useState(false);
  const [isVeoVideoOpen, setIsVeoVideoOpen] = useState(false);
  const [imageStudioInitialImage, setImageStudioInitialImage] = useState<string | null>(null);
  const [veoInitialImage, setVeoInitialImage] = useState<string | null>(null);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  const [user, setUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem("chatnova_user");
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return null;
  });

  const [currentSessionId, setCurrentSessionId] = useState<string>(() => {
    return `session-${Date.now()}`;
  });

  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    try {
      const saved = localStorage.getItem("chatnova_saved_sessions");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore
    }
    return [];
  });

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Sync current conversation into sessions array
  useEffect(() => {
    const hasUserMsg = messages.some((m) => m.role === "user");
    if (!hasUserMsg) return;

    const firstUserMsg = messages.find((m) => m.role === "user");
    const sessionTitle = firstUserMsg
      ? firstUserMsg.text.slice(0, 36) + (firstUserMsg.text.length > 36 ? "..." : "")
      : "New Conversation";

    setSessions((prevSessions) => {
      const existingIdx = prevSessions.findIndex((s) => s.id === currentSessionId);
      const updatedSession: ChatSession = {
        id: currentSessionId,
        title: sessionTitle,
        createdAt: existingIdx >= 0 ? prevSessions[existingIdx].createdAt : Date.now(),
        messages,
        mode,
      };

      let newSessions: ChatSession[];
      if (existingIdx >= 0) {
        newSessions = [...prevSessions];
        newSessions[existingIdx] = updatedSession;
      } else {
        newSessions = [updatedSession, ...prevSessions];
      }

      try {
        localStorage.setItem("chatnova_saved_sessions", JSON.stringify(newSessions));
      } catch {
        // ignore
      }
      return newSessions;
    });
  }, [messages, currentSessionId, mode]);

  // Save messages to local storage
  useEffect(() => {
    try {
      localStorage.setItem("chatnova_messages", JSON.stringify(messages));
    } catch {
      // ignore
    }
  }, [messages]);

  // Save mode to local storage
  useEffect(() => {
    try {
      localStorage.setItem("chatnova_mode", mode);
    } catch {
      // ignore
    }
  }, [mode]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Fetch server info
  useEffect(() => {
    fetch("/api/info")
      .then((res) => res.json())
      .then((data: ServerInfo) => {
        setServerInfo(data);
      })
      .catch((err) => {
        console.warn("Could not load server info:", err);
      });
  }, []);

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    setErrorBanner(null);
    const userMsgId = `user-${Date.now()}`;
    const userMessage: Message = {
      id: userMsgId,
      role: "user",
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setIsLoading(true);

    try {
      // Call Flask-compatible /chat route
      const response = await fetch("/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: text,
          mode,
          history: updatedMessages.map((m) => ({
            role: m.role,
            text: m.text,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }

      const data = await response.json();
      const botMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        text: data.reply || "Sorry, I could not generate a reply.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        source: data.source || (mode === "ai" ? "gemini" : "rule_based"),
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (err: unknown) {
      console.error("Chat error:", err);
      // Fallback response so user experience is never broken
      const fallbackMsg: Message = {
        id: `assistant-err-${Date.now()}`,
        role: "assistant",
        text:
          mode === "basic"
            ? "Interesting question! 🤔\n\nAbhi main ChatNova ka basic version hoon. Aap mujhe AI API se connect karke aur bhi powerful bana sakte ho."
            : "Maaf kijiye, temporary network issue aayi. Kripya dobara try karein ya Basic Mode switch karein.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        source: "rule_based",
      };
      setMessages((prev) => [...prev, fallbackMsg]);
      setErrorBanner("Server response timed out. A fallback response was provided.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewChat = () => {
    const newId = `session-${Date.now()}`;
    setCurrentSessionId(newId);
    setMessages(INITIAL_MESSAGES);
  };

  const handleSelectSession = (sessionId: string) => {
    const found = sessions.find((s) => s.id === sessionId);
    if (found) {
      setCurrentSessionId(found.id);
      setMessages(found.messages);
      setMode(found.mode);
    }
  };

  const handleDeleteSession = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = sessions.filter((s) => s.id !== sessionId);
    setSessions(updated);
    try {
      localStorage.setItem("chatnova_saved_sessions", JSON.stringify(updated));
    } catch {
      // ignore
    }
    if (sessionId === currentSessionId) {
      handleNewChat();
    }
  };

  const handleClearAllSessions = () => {
    setSessions([]);
    try {
      localStorage.removeItem("chatnova_saved_sessions");
      localStorage.removeItem("chatnova_messages");
    } catch {
      // ignore
    }
    handleNewChat();
  };

  const handleLogin = (newUser: UserProfile) => {
    setUser(newUser);
    try {
      localStorage.setItem("chatnova_user", JSON.stringify(newUser));
    } catch {
      // ignore
    }
  };

  const handleLogout = () => {
    setUser(null);
    try {
      localStorage.removeItem("chatnova_user");
    } catch {
      // ignore
    }
  };

  const handleClearChat = () => {
    handleNewChat();
    try {
      localStorage.removeItem("chatnova_messages");
    } catch {
      // ignore
    }
  };

  const handleOpenLiveVoice = () => {
    setIsLiveVoiceOpen(true);
  };

  const handleOpenImageStudio = (initialImg?: string) => {
    setImageStudioInitialImage(initialImg || null);
    setIsImageStudioOpen(true);
  };

  const handleOpenVeoVideo = (initialImg?: string) => {
    setVeoInitialImage(initialImg || null);
    setIsVeoVideoOpen(true);
  };

  const handleSendImageToChat = (imageUrl: string, prompt: string) => {
    const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const newMsg: Message = {
      id: `img-${Date.now()}`,
      role: "assistant",
      text: `🎨 **AI Image Generated with Gemini 3.1 Flash Image**\n\nPrompt: *"${prompt}"*`,
      imageUrl,
      mediaType: "image",
      timestamp: timeStr,
      source: "gemini",
    };
    setMessages((prev) => [...prev, newMsg]);
    setIsImageStudioOpen(false);
  };

  const handleSendVideoToChat = (videoUrl: string, prompt: string) => {
    const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const newMsg: Message = {
      id: `video-${Date.now()}`,
      role: "assistant",
      text: `🎬 **AI Video Generated with Veo 3.1**\n\nPrompt: *"${prompt}"*`,
      videoUrl,
      mediaType: "video",
      timestamp: timeStr,
      source: "gemini",
    };
    setMessages((prev) => [...prev, newMsg]);
    setIsVeoVideoOpen(false);
  };

  return (
    <div className="relative flex flex-col h-screen text-slate-100 font-sans antialiased overflow-hidden selection:bg-pink-500/30 selection:text-pink-200 bg-gradient-to-br from-[#270838] via-[#0d1024] to-[#082040]">
      {/* Ambient pink and blue glow effects */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-pink-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header bar */}
      <Header
        mode={mode}
        onModeChange={setMode}
        serverInfo={serverInfo}
        onClearChat={handleClearChat}
        onOpenCodeModal={() => setIsCodeModalOpen(true)}
        onOpenHistory={() => setIsHistoryOpen(true)}
        historyCount={sessions.length}
        user={user}
        onOpenLogin={() => setIsLoginModalOpen(true)}
        onOpenLiveVoice={handleOpenLiveVoice}
        onOpenImageStudio={() => handleOpenImageStudio()}
        onOpenVeoVideo={() => handleOpenVeoVideo()}
      />

      {/* Optional error notification banner */}
      {errorBanner && (
        <div
          id="error-banner"
          className="bg-rose-950/80 border-b border-rose-800 text-rose-200 px-4 py-2 text-xs flex items-center justify-between z-20"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
            <span>{errorBanner}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorBanner(null)}
            className="text-rose-400 hover:text-rose-100 font-bold px-2 py-0.5 rounded hover:bg-rose-900/50"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Chat Messages Feed */}
      <main
        id="chat-feed"
        className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 max-w-5xl w-full mx-auto relative z-10"
      >
        {/* Welcome Hero card when conversation is minimal */}
        {messages.length <= 1 && (
          <div
            id="chatnova-hero-intro"
            className="mb-6 mt-2 p-6 rounded-2xl bg-gradient-to-br from-pink-950/40 via-slate-900/70 to-blue-950/40 border border-pink-500/20 shadow-xl shadow-pink-950/20 text-center relative overflow-hidden backdrop-blur-sm"
          >
            <div className="relative w-20 h-20 mx-auto mb-3">
              <img
                src="/chatnova-logo.jpg"
                alt="ChatNova Emblem"
                referrerPolicy="no-referrer"
                className="w-20 h-20 rounded-full object-cover ring-2 ring-pink-500/60 shadow-xl shadow-pink-500/30"
              />
            </div>
            <h2 className="text-xl font-bold tracking-tight">
              <span className="bg-gradient-to-r from-pink-400 via-purple-300 to-blue-400 bg-clip-text text-transparent font-extrabold">
                {user ? `Namaste, ${user.name}!` : "Meet ChatNova"}
              </span>
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-md mx-auto leading-relaxed">
              Your versatile companion. Speak in <span className="text-pink-300 font-medium">Hinglish</span>,{" "}
              <span className="text-purple-300 font-medium">Hindi</span>, or{" "}
              <span className="text-blue-300 font-medium">English</span> for conversation, problem-solving, code, and daily tasks.
            </p>
          </div>
        )}

        {/* Message list */}
        <div className="space-y-1">
          {messages.map((message) => (
            <ChatMessage
              key={message.id}
              message={message}
              user={user}
              onAnimateImage={(img) => handleOpenVeoVideo(img)}
              onEditImage={(img) => handleOpenImageStudio(img)}
            />
          ))}

          {/* Typing Indicator */}
          {isLoading && (
            <div
              id="typing-indicator"
              className="flex items-start gap-3 my-3 px-2 sm:px-0"
            >
              <img
                src="/chatnova-logo.jpg"
                alt="ChatNova"
                referrerPolicy="no-referrer"
                className="w-8 h-8 rounded-full object-cover ring-1 ring-indigo-500/50 shadow-sm flex-shrink-0"
              />
              <div className="bg-slate-900 border border-slate-800 text-slate-300 rounded-2xl rounded-tl-xs p-3.5 shadow-sm text-sm flex items-center gap-2">
                <span className="text-xs font-medium text-indigo-300">
                  ChatNova is thinking
                </span>
                <span className="inline-flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" />
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Suggested Quick Prompts */}
      <div className="max-w-5xl w-full mx-auto">
        <QuickPrompts onSelectPrompt={handleSendMessage} mode={mode} />
      </div>

      {/* Input bar */}
      <ChatInput
        onSendMessage={handleSendMessage}
        isLoading={isLoading}
        mode={mode}
        onOpenLiveVoice={handleOpenLiveVoice}
        onOpenImageStudio={() => handleOpenImageStudio()}
        onOpenVeoVideo={() => handleOpenVeoVideo()}
      />

      {/* Python Code Viewer Modal */}
      <PythonCodeModal
        isOpen={isCodeModalOpen}
        onClose={() => setIsCodeModalOpen(false)}
      />

      {/* Slide-out Chat History Drawer */}
      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        sessions={sessions}
        currentSessionId={currentSessionId}
        onSelectSession={handleSelectSession}
        onNewChat={handleNewChat}
        onDeleteSession={handleDeleteSession}
        onClearAllSessions={handleClearAllSessions}
        user={user}
        onOpenLogin={() => setIsLoginModalOpen(true)}
      />

      {/* Google Login & Profile Modal */}
      <GoogleLoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        user={user}
        onLogin={handleLogin}
        onLogout={handleLogout}
      />

      {/* Live Voice Call Modal (gemini-3.8-live) */}
      <LiveVoiceModal
        isOpen={isLiveVoiceOpen}
        onClose={() => setIsLiveVoiceOpen(false)}
      />

      {/* Image Studio Modal (gemini-3.1-flash-image-preview) */}
      <ImageStudioModal
        isOpen={isImageStudioOpen}
        onClose={() => setIsImageStudioOpen(false)}
        initialImage={imageStudioInitialImage}
        onSendToChat={handleSendImageToChat}
        onAnimateWithVeo={(img) => {
          setIsImageStudioOpen(false);
          handleOpenVeoVideo(img);
        }}
      />

      {/* Veo Video Generator Modal (veo-3.1-fast-generate-preview) */}
      <VeoVideoModal
        isOpen={isVeoVideoOpen}
        onClose={() => setIsVeoVideoOpen(false)}
        initialImage={veoInitialImage}
        onSendToChat={handleSendVideoToChat}
      />
    </div>
  );
}
