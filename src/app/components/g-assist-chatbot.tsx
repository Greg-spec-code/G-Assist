// FILE: src/app/g-assist-chatbot.tsx (or wherever you have it)
// --- PASTE THIS ENTIRE CODE BLOCK ---

"use client";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "./ui/button"; // Assuming ./ui/button exists
import { Textarea } from "./ui/textarea"; // Assuming ./ui/textarea exists
import { Send, Sparkles } from "lucide-react";

// SVG Shape Component - for the perfect curve
const SwoopShape = () => {
  return (
    <svg
      className="absolute bottom-0 left-0 w-full h-auto text-[#E9E8F5]"
      viewBox="0 0 1440 100"
      preserveAspectRatio="none"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true" // Decorative element
    >
      {/* This path creates the specific asymmetrical curve */}
      <path d="M1440 100H0V0C480 33.3333 960 66.6667 1440 0V100Z"></path>
    </svg>
  );
};

// Background particles Component
const NUM_PARTICLES = 15;
function generateParticles() {
  return Array.from({ length: NUM_PARTICLES }, () => ({
    top: Math.random() * 100, left: Math.random() * 100,
    width: Math.random() * 20 + 5, height: Math.random() * 20 + 5,
    x: Math.random() * 30 - 15, duration: Math.random() * 5 + 5,
  }));
}
const FloatingParticles = () => {
  const [particles, setParticles] = useState<Array<any>>([]);
  useEffect(() => { setParticles(generateParticles()); }, []);
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p, i) => (
        <motion.div key={i} className="absolute rounded-full bg-gradient-to-r from-blue-400/10 to-green-400/10"
          style={{ top: `${p.top}%`, left: `${p.left}%`, width: `${p.width}px`, height: `${p.height}px` }}
          animate={{ y: [0, -20, 0], x: [0, p.x, 0], opacity: [0.2, 0.5, 0.2] }}
          transition={{ duration: p.duration, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
};

// Main Chatbot Component
const GAssistChatbot = () => {
  const [placeholderText, setPlaceholderText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [loopNum, setLoopNum] = useState(0);
  const [typingSpeed, setTypingSpeed] = useState(150);
  const [userInput, setUserInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Array<{id: string, role: string, content: string}>>([]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const prompts = [ "Ask me anything...", "Get help with coding...", "Explore creative ideas...", ];
    const handleTyping = () => {
      const i = loopNum % prompts.length; const fullText = prompts[i];
      setPlaceholderText(isDeleting ? fullText.substring(0, placeholderText.length - 1) : fullText.substring(0, placeholderText.length + 1));
      setTypingSpeed(isDeleting ? 30 : 150);
      if (!isDeleting && placeholderText === fullText) { setTimeout(() => setIsDeleting(true), 2000); }
      else if (isDeleting && placeholderText === "") { setIsDeleting(false); setLoopNum(loopNum + 1); }
    };
    const timer = setTimeout(handleTyping, typingSpeed);
    return () => clearTimeout(timer);
  }, [placeholderText, isDeleting, loopNum, typingSpeed]);
  
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, isTyping]);
  
  useEffect(() => {
    if (isLoading) { const timer = setTimeout(() => setIsTyping(true), 500); return () => clearTimeout(timer); }
    else { setIsTyping(false); }
  }, [isLoading]);

  const handleSubmit = async (e: React.FormEvent | React.MouseEvent | React.KeyboardEvent) => {
    e.preventDefault(); if (!userInput.trim()) return;
    const newUserMessage = { id: Date.now().toString(), role: "user", content: userInput };
    setMessages(prev => [...prev, newUserMessage]);
    const currentInput = userInput; setUserInput(""); setIsLoading(true);
    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST", headers: { "Authorization": `Bearer ${process.env.NEXT_PUBLIC_OPENROUTER_API_KEY || ''}`, "Content-Type": "application/json" },
        body: JSON.stringify({ "model": "google/gemini-pro", "messages": [{ "role": "user", "content": currentInput }] })
      });
      if (!response.ok) { throw new Error(`API Error: ${response.statusText}`); }
      const data = await response.json();
      const aiResponse = { id: (Date.now() + 1).toString(), role: "assistant", content: data.choices?.[0]?.message?.content || "Sorry, I couldn't get a response." };
      setMessages(prev => [...prev, aiResponse]);
    } catch (error) {
      console.error("Error fetching from API:", error);
      const errorMessage = { id: (Date.now() + 2).toString(), role: "assistant", content: "An error occurred. Please try again." };
      setMessages(prev => [...prev, errorMessage]);
    } finally { setIsLoading(false); }
  };
  
  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
      <FloatingParticles />
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md h-[85vh] max-h-[750px] flex flex-col relative z-10"
      >
        {/* ============================ TOP DARK PANEL ============================ */}
        <div className="relative flex-shrink-0 h-[65%] bg-black/30 backdrop-blur-2xl rounded-t-3xl border-b-0 border-white/10 shadow-2xl z-20 pb-10">
            <div className="h-full flex flex-col">
                <div className="absolute top-0 left-0 right-0 p-5 text-center z-10">
                    <motion.h1 initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="text-2xl font-bold text-white tracking-wide">
                        G-Assist
                    </motion.h1>
                </div>
                
                <div className="flex-grow overflow-y-auto px-6 pt-20" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                    {messages.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center p-4 -mt-10">
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: "spring" }} className="mb-4 p-3 rounded-full bg-gradient-to-r from-blue-500/20 to-green-500/20">
                            <Sparkles className="h-8 w-8 text-blue-300" />
                        </motion.div>
                        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="text-blue-200 max-w-md text-sm">
                            How can I help you today?
                        </motion.p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <AnimatePresence>
                          {messages.map((msg) => (
                            <motion.div key={msg.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                              <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-white ${ msg.role === 'user' ? 'bg-blue-600 rounded-br-none' : 'bg-white/10 rounded-bl-none' }`}>
                                <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                              </div>
                            </motion.div>
                          ))}
                        </AnimatePresence>
                        {isTyping && (
                          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                            <div className="bg-white/10 rounded-2xl rounded-bl-none px-4 py-3">
                              <div className="flex items-center space-x-1">
                                <div className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce [animation-delay:-0.3s]"></div>
                                <div className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce [animation-delay:-0.15s]"></div>
                                <div className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce"></div>
                              </div>
                            </div>
                          </motion.div>
                        )}
                        <div ref={messagesEndRef} />
                      </div>
                    )}
                </div>
            </div>
            <div className="absolute -bottom-px left-0 w-full z-10">
                 <SwoopShape />
            </div>
        </div>

        {/* =========================== BOTTOM LIGHT PANEL =========================== */}
        <div className="flex-grow flex flex-col bg-[#E9E8F5] rounded-b-3xl p-6 relative z-10 shadow-inner">
            <form onSubmit={handleSubmit} className="relative">
                <Textarea
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  placeholder={placeholderText}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(e); } }}
                  className="min-h-[80px] w-full rounded-2xl border border-gray-300 bg-white p-4 pr-14 text-base text-gray-800 placeholder:text-gray-500/80 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 resize-none shadow-sm"
                  disabled={isLoading}
                  rows={3}
                />
                <Button 
                  type="submit"
                  size="icon" 
                  className="absolute bottom-3 right-3 h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-teal-500 hover:opacity-90 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                  disabled={isLoading || !userInput.trim()}
                  aria-label="Send message"
                >
                  <Send className="h-5 w-5 text-white" />
                </Button>
            </form>
             <div className="mt-auto text-center text-xs text-gray-400 pt-4">
                <p>Powered by Google Gemini</p>
             </div>
        </div>
      </motion.div>
    </div>
  );
};

export default GAssistChatbot;
