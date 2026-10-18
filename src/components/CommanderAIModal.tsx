import React, { useState } from 'react';
import { askCommanderSI } from '../services/geminiService';
import { X, Send, Sparkles, Bot, User, Loader2 } from 'lucide-react';

interface CommanderAIModalProps {
  isOpen: boolean;
  onClose: () => void;
  chamberState: any;
  isBeginnerMode: boolean;
}

interface Message {
  sender: 'user' | 'si';
  text: string;
}

const QUICK_QUESTIONS = [
  'Why does fire turn into a floating blue ball in zero-g?',
  'What happens if Hydrogen leaks into our Artemis 34% O₂ cabin?',
  'Can an astronaut blow out a space fire like a birthday candle?',
  'Why is throwing water on a space station fire dangerous?',
  'Explain the 1997 Mir space station fire like I am 10 years old.',
];

export const CommanderAIModal: React.FC<CommanderAIModalProps> = ({
  isOpen,
  onClose,
  chamberState,
  isBeginnerMode,
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'si',
      text: `Greetings, Space Cadet. I am the NULL-G Super Intelligence (SI). I analyze spacecraft atmosphere risks, zero-gravity combustion physics, and crew survival protocols. How can I assist your mission today?`,
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSend = async (questionText?: string) => {
    const q = questionText || input.trim();
    if (!q || isLoading) return;

    setMessages((prev) => [...prev, { sender: 'user', text: q }]);
    setInput('');
    setIsLoading(true);

    try {
      const answer = await askCommanderSI(q, chamberState, isBeginnerMode);
      setMessages((prev) => [...prev, { sender: 'si', text: answer }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'si',
          text: 'Communication link interrupted. In zero gravity, remember: cutting the cabin fans will suffocate the flame sphere within seconds!',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md">
      <div className="relative w-full max-w-2xl max-h-[88vh] flex flex-col bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden animate-fadeIn">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/40">
              <Sparkles className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                NULL-G Commander Super Intelligence
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-700 font-sans">
                  GEMINI 3.8 FLASH
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                {isBeginnerMode ? 'Layperson Mode: Simple everyday analogies & clear advice' : 'Technical Mode: Aerospace combustion thermodynamics'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Chat Stream */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex items-start gap-2.5 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {m.sender === 'si' && (
                <div className="w-7 h-7 rounded-lg bg-indigo-600/30 border border-indigo-500/50 flex items-center justify-center text-indigo-300 shrink-0 mt-0.5">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed ${
                  m.sender === 'user'
                    ? 'bg-cyan-500 text-slate-950 font-medium font-sans'
                    : 'bg-slate-950 border border-slate-800 text-slate-200 shadow-sm'
                }`}
              >
                {m.text}
              </div>

              {m.sender === 'user' && (
                <div className="w-7 h-7 rounded-lg bg-cyan-600/30 border border-cyan-500/50 flex items-center justify-center text-cyan-300 shrink-0 mt-0.5">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-2 text-xs text-indigo-400 font-mono py-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>SI reasoning combustion pathways...</span>
            </div>
          )}
        </div>

        {/* Quick Suggestion Pills */}
        <div className="px-4 py-2 border-t border-slate-800/80 bg-slate-950/40 flex items-center gap-1.5 overflow-x-auto">
          <span className="text-[10px] font-mono text-slate-500 shrink-0">Try:</span>
          {QUICK_QUESTIONS.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(q)}
              className="text-[10px] px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 whitespace-nowrap transition-all"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3 border-t border-slate-800 bg-slate-950 flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask about zero-gravity fire, gases, or safety..."
            className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || isLoading}
            className="px-3 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-slate-950 font-bold text-xs font-mono transition-all flex items-center gap-1.5"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send</span>
          </button>
        </div>
      </div>
    </div>
  );
};
