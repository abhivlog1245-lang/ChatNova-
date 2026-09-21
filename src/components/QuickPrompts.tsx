import React from "react";
import { Sparkles, MessageSquare } from "lucide-react";
import { ChatMode } from "../types";

interface QuickPromptsProps {
  onSelectPrompt: (prompt: string) => void;
  mode: ChatMode;
}

export const QuickPrompts: React.FC<QuickPromptsProps> = ({
  onSelectPrompt,
  mode,
}) => {
  const basicPrompts = [
    { label: "👋 Namaste!", text: "Namaste!" },
    { label: "🤖 Tumhara naam kya hai?", text: "Tumhara naam kya hai?" },
    { label: "🚀 Who are you?", text: "Who are you?" },
    { label: "💡 Madad chahiye", text: "Mujhe madad chahiye" },
    { label: "👋 Bye!", text: "Bye!" },
  ];

  const aiPrompts = [
    { label: "🧠 Explain Quantum Computing in Hinglish", text: "Quantum computing ko simple Hinglish me samjhao." },
    { label: "🐍 Write a Python web scraper", text: "Python me BeautifulSoup se simple web scraper ka code likho." },
    { label: "🎯 3 Product ideas for students", text: "College students ke liye 3 innovative product ideas batao." },
    { label: "✍️ Write a formal leave email", text: "Office ke liye professional sick leave email draft karo." },
  ];

  const displayPrompts = mode === "basic" ? basicPrompts : [...basicPrompts.slice(0, 3), ...aiPrompts];

  return (
    <div id="quick-prompts-container" className="my-3 px-2">
      <div className="flex items-center gap-1.5 text-xs text-slate-300 font-medium mb-2">
        <Sparkles className="w-3.5 h-3.5 text-pink-400" />
        <span>Quick suggestions:</span>
      </div>
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar flex-wrap">
        {displayPrompts.map((item, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => onSelectPrompt(item.text)}
            className="text-xs bg-slate-950/70 hover:bg-gradient-to-r hover:from-pink-950/50 hover:to-indigo-950/50 text-slate-300 hover:text-pink-200 border border-pink-500/20 hover:border-pink-500/50 px-3 py-1.5 rounded-full transition-all flex-shrink-0 cursor-pointer shadow-sm hover:shadow-md hover:shadow-pink-500/10 backdrop-blur-xs"
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
};
