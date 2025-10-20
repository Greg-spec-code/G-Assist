"use client";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Send, Mic, Paperclip, Sparkles, Zap, Star, MessageCircle, Brain, Wand2 } from "lucide-react";

// NOTE: No changes were made to the FloatingParticles component.
const NUM_PARTICLES = 15;
function generateParticles() {
  return Array.from({ length: NUM_PARTICLES }, () => ({
    top: Math.random() * 100,
    left: Math.random() * 100,
    width: Math.random() * 20 + 5,
    height: Math.random() * 20 + 5,
    x: Math.random() * 30 - 15,
    duration: Math.random() * 5 + 5,
  }));
}
const FloatingParticles = () => {
  const [particles, setParticles] = useState<Array<any>>([]);
  useEffect(() => {
    setParticles(generateParticles());
  }, []);
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-gradient-to-r from-blue-400/20 to-green-400/20"
          style={{
            top: `${p.top}%`,
            left: `${p.left}%`,
            width: `${p.width}px`,
            height: `${p.height}px`,
          }}
          animate={{
            y: [0, -20, 0],
            x: [0, p.x, 0],
            opacity: [0.3, 0.7, 0.3],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
};

const GAssistChatbot = () => {
  const [placeholderText, setPlaceholderText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [loopNum, setLoopNum] = useState(0);
  const [typingSpeed, setTypingSpeed] = useState(150);
  const [userInput, setUserInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Array<{id: string, role: string, content: string, timestamp: Date}>>([]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const prompts = [
      "Ask me anything...",
      "Help me with code...",
      "Creative ideas...",
      "Learn something new...",
      "Solve a problem..."
    ];
    const handleTyping = () => {
      const i = loopNum % prompts.length;
      const fullText = prompts[i];

      if (isDeleting) {
        setPlaceholderText(fullText.substring(0, placeholderText.length - 1));
        setTypingSpeed(30);
      } else {
        setPlaceholderText(fullText.substring(0, placeholderText.length + 1));
        setTypingSpeed(150);
      }

      if (!isDeleting && placeholderText === fullText) {
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => setIsDeleting(true), 1000);
      } else if (isDeleting && placeholderText === "") {
        setIsDeleting(false);
        setLoopNum(loopNum + 1);
      }
    };

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(handleTyping, typingSpeed);

    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [placeholderText, isDeleting, loopNum, typingSpeed]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (isLoading) {
      const timer = setTimeout(() => {
        setIsTyping(true);
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setIsTyping(false);
    }
  }, [isLoading]);

  const handleSubmit = async (e: React.FormEvent | React.MouseEvent | React.KeyboardEvent) => {
    e.preventDefault();
    if (!userInput.trim()) return;

    const newUserMessage = {
      id: Date.now().toString(),
      role: "user",
      content: userInput,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newUserMessage]);
    setUserInput("");
    setIsLoading(true);

    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.NEXT_PUBLIC_OPENROUTER_API_KEY || ''}`,
          "HTTP-Referer": window.location.href,
          "X-Title": "G-Assist",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
         "model": "google/gemini-2.0-flash-exp:free",
          "messages": [
            ...messages.filter(m => m.role !== 'system').map(m => ({
              role: m.role,
              content: m.content
            })),
            {
              role: "user",
              content: userInput
            }
          ]
        })
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error(`API Error ${response.status}:`, errorData);
        throw new Error(`API request failed with status ${response.status}: ${errorData}`);
      }

      const data = await response.json();

      const aiResponse = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.choices?.[0]?.message?.content || "I'm sorry, I couldn't generate a response. Please try again.",
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiResponse]);
    } catch (error) {
      console.error("Error:", error);
      const errorMessage = {
        id: (Date.now() + 2).toString(),
        role: "assistant",
        content: "Sorry, I encountered an error. Please make sure your API key is configured correctly and try again.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen w-screen bg-gradient-to-br from-blue-900 via-teal-900 to-green-800 flex flex-col items-center justify-center p-2 sm:p-4 relative overflow-hidden">
      <FloatingParticles />
      
      <div className="absolute top-10 left-10 w-32 h-32 rounded-full bg-blue-500/10 blur-3xl"></div>
      <div className="absolute bottom-20 right-10 w-48 h-48 rounded-full bg-green-500/10 blur-3xl"></div>
      <div className="absolute top-1/3 right-1/4 w-24 h-24 rounded-full bg-teal-500/10 blur-3xl"></div>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full h-full md:max-w-3xl lg:max-w-[40rem] xl:max-w-[48rem] bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden border border-white/20 z-10 flex flex-col"
      >
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/80 via-teal-600/80 to-green-600/80"></div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-yellow-400/30 to-green-500/30 rounded-full -translate-y-32 translate-x-32 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-cyan-400/30 to-blue-500/30 rounded-full translate-y-24 -translate-x-24 blur-3xl"></div>
          
          <div className="relative p-4 text-center z-10">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="flex justify-center mb-2"
            >
              <div className="relative w-12 h-12">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-green-500 rounded-full blur-md opacity-70"></div>
                <div className="relative rounded-full bg-gradient-to-r from-blue-400 to-green-500 flex items-center justify-center w-full h-full">
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
              </div>
            </motion.div>
            
            <motion.h1 
              className="text-2xl font-bold text-white bg-clip-text text-transparent bg-gradient-to-r from-blue-300 via-white to-green-300"
            >
              G-Assist
            </motion.h1>
            
            <motion.p className="text-xs text-blue-100 font-light">
              Powered by Google Gemini 2.0 Flash
            </motion.p>
          </div>
        </div>

        <div className="flex-grow overflow-y-auto p-4 bg-gradient-to-b from-black/5 to-transparent">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-4">
              <motion.div
                initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: "spring" }}
                className="mb-4 p-3 rounded-full bg-gradient-to-r from-blue-500/20 to-green-500/20"
              >
                <Wand2 className="h-10 w-10 text-blue-300" />
              </motion.div>
              
              <h3 className="text-xl font-bold text-white mb-2">Welcome to G-Assist</h3>
              <p className="text-blue-200 max-w-md text-sm">
                Start a conversation with Google Gemini AI.
              </p>
              
              <div className="grid grid-cols-2 gap-2 mt-6 w-full max-w-sm">
                {[
                  "Explain quantum computing", "Write Python code",
                  "Creative story ideas", "Solve math problems"
                ].map((suggestion) => (
                  <motion.div
                    key={suggestion} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    className="bg-white/10 backdrop-blur-sm rounded-lg p-2 text-xs text-white border border-white/20 cursor-pointer hover:bg-white/20 transition-colors"
                    onClick={() => setUserInput(suggestion)}
                  >
                    {suggestion}
                  </motion.div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <AnimatePresence>
                {messages.map((msg) => (
                  <motion.div 
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div 
                      className={`max-w-[85%] rounded-2xl px-4 py-3 relative overflow-hidden ${
                        msg.role === 'user' 
                          ? 'bg-gradient-to-r from-blue-600 to-teal-600 text-white rounded-br-lg' 
                          : 'bg-white/10 backdrop-blur-lg text-white border border-white/20 rounded-bl-lg'
                      }`}
                    >
                      <div className="relative z-10 flex items-start gap-2.5">
                          {msg.role === 'assistant' && (
                            <div className="p-1 rounded-md bg-gradient-to-r from-cyan-500/30 to-green-500/30 mt-0.5">
                              <Brain className="h-4 w-4 text-cyan-300" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-sm mb-0.5">
                              {msg.role === 'user' ? 'You' : 'G-Assist'}
                            </p>
                            <p className="leading-relaxed whitespace-pre-wrap text-sm">{msg.content}</p>
                          </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              
              {isTyping && (
                <motion.div 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="flex justify-start"
                >
                  <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl rounded-bl-lg px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex space-x-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce"></div>
                        <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce delay-100"></div>
                        <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce delay-200"></div>
                      </div>
                      <span className="text-cyan-300 text-xs">G-Assist is thinking...</span>
                    </div>
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        <div className="p-3 bg-black/10 border-t border-white/10">
          <div className="grid grid-cols-3 gap-2 mb-3">
            {[
              { icon: <Zap className="h-4 w-4 text-yellow-400" />, title: "Google Gemini" },
              { icon: <Sparkles className="h-4 w-4 text-cyan-400" />, title: "Free to Use" },
              { icon: <Star className="h-4 w-4 text-green-400" fill="currentColor" />, title: "Lightning Fast" }
            ].map((feature) => (
              <div
                key={feature.title}
                className="bg-white/5 backdrop-blur-sm rounded-lg p-2 border border-white/10"
              >
                <div className="flex items-center justify-center gap-2">
                  {feature.icon}
                  <h3 className="text-xs font-semibold text-white">{feature.title}</h3>
                </div>
              </div>
            ))}
          </div>
          
          <div className="relative flex items-center gap-2">
            <Textarea
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder={placeholderText}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              className="w-full rounded-xl border border-white/20 bg-white/10 backdrop-blur-lg p-3 pr-12 text-sm text-white placeholder:text-white/60 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/30 resize-none min-h-[44px]"
              disabled={isLoading}
              rows={1}
            />
            
            <div className="flex gap-2">
               <Button 
                  onClick={handleSubmit} size="icon" 
                  className="h-11 w-11 rounded-full bg-gradient-to-r from-cyan-500 to-green-500 shrink-0"
                  disabled={isLoading || !userInput.trim()}
                >
                  <Send className="h-5 w-5 text-white" />
                </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default GAssistChatbot;
