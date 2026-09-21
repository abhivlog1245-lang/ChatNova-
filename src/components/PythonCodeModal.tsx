import React, { useState } from "react";
import { X, Copy, Check, Terminal, Code2 } from "lucide-react";

interface PythonCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PYTHON_SNIPPET = `from flask import Flask, render_template, request, jsonify

app = Flask(__name__)

def chatnova_response(message):
    msg = message.lower().strip()

    if not msg:
        return "Please type something 😊"

    if "hello" in msg or "hi" in msg or "namaste" in msg:
        return "Hello! 👋 Main ChatNova hoon. Aapki kya help kar sakta hoon?"

    if "your name" in msg or "tumhara naam" in msg:
        return "Mera naam ChatNova hai 🤖"

    if "who are you" in msg or "tum kaun ho" in msg:
        return "Main ChatNova hoon — aapka AI companion 🚀"

    if "help" in msg or "madad" in msg:
        return "Bilkul! Aap mujhse questions, ideas, coding aur bahut kuch pooch sakte ho."

    if "bye" in msg:
        return "Bye! 👋 Phir milte hain."

    return (
        "Interesting question! 🤔\\n\\n"
        "Abhi main ChatNova ka basic version hoon. "
        "Aap mujhe AI API se connect karke aur bhi powerful bana sakte ho."
    )


@app.route("/")
def home():
    return render_template("index.html")


@app.route("/chat", methods=["POST"])
def chat():
    data = request.get_json()
    message = data.get("message", "")

    response = chatnova_response(message)

    return jsonify({
        "reply": response
    })


if __name__ == "__main__":
    app.run(debug=True)
`;

export const PythonCodeModal: React.FC<PythonCodeModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(PYTHON_SNIPPET);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <div
      id="python-code-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs"
    >
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-white text-base">
                ChatNova Flask Backend
              </h3>
              <p className="text-xs text-slate-400">
                Original Python snippet with endpoints & rule matcher
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Code</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Code Content */}
        <div className="p-4 overflow-y-auto flex-1 bg-slate-950 font-mono text-xs">
          <pre className="text-emerald-300 leading-relaxed overflow-x-auto whitespace-pre">
            <code>{PYTHON_SNIPPET}</code>
          </pre>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Code2 className="w-4 h-4 text-indigo-400" />
            <span>
              Both <code className="text-indigo-300">/chat</code> and Gemini AI routes are live in this app.
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
