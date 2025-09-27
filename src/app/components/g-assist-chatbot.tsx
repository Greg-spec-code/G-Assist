"use client";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Mic, Paperclip, Droplets, Volume2, VolumeX, Waves } from "lucide-react";

// Water bubble component
const WaterBubble = ({ delay = 0, size = "small", position }) => {
  const sizes = {
    small: "w-2 h-2",
    medium: "w-3 h-3",
    large: "w-4 h-4"
  };
  
  return (
    <motion.div
      className={`absolute ${sizes[size]} rounded-full bg-white/20 backdrop-blur-sm`}
      style={{ left: `${position}%` }}
      initial={{ bottom: -20, opacity: 0 }}
      animate={{
        bottom: ["0%", "100%"],
        opacity: [0, 0.6, 0.8, 0],
        x: [0, Math.random() * 20 - 10, Math.random() * 20 - 10, 0],
      }}
      transition={{
        duration: Math.random() * 5 + 5,
        repeat: Infinity,
        delay,
        ease: "easeOut"
      }}
    />
  );
};

// Water pour animation
const WaterPour = () => {
  return (
    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-8 h-32 overflow-hidden pointer-events-none z-50">
      <motion.div
        className="w-full h-full bg-gradient-to-b from-cyan-300/80 via-cyan-400/60 to-transparent"
        animate={{
          y: ["-100%", "100%"],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "linear",
        }}
        style={{
          clipPath: "polygon(35% 0%, 65% 0%, 55% 100%, 45% 100%)",
        }}
      />
      <motion.div
        className="absolute top-0 left-1/2 transform -translate-x-1/2 w-6"
        animate={{
          opacity: [0, 1, 0],
        }}
        transition={{
          duration: 0.5,
          repeat: Infinity,
        }}
      >
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-cyan-300 rounded-full"
            style={{ left: `${i * 20}px` }}
            animate={{
              y: [0, 150],
              opacity: [1, 0],
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              delay: i * 0.2,
            }}
          />
        ))}
      </motion.div>
    </div>
  );
};

// Ripple effect component
const Ripple = ({ x, y }) => {
  return (
    <motion.div
      className="absolute pointer-events-none"
      style={{ left: x, top: y }}
      initial={{ scale: 0, opacity: 1 }}
      animate={{ scale: 4, opacity: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1, ease: "easeOut" }}
    >
      <div className="w-10 h-10 rounded-full border-2 border-cyan-300/50" />
    </motion.div>
  );
};

const GAssistChatbot = () => {
  const [userInput, setUserInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState([]);
  const [waterLevel, setWaterLevel] = useState(0);
  const [ripples, setRipples] = useState([]);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const messagesEndRef = useRef(null);
  const chatAreaRef = useRef(null);

  // Animate water filling on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setWaterLevel(100);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Create ripple effect
  const createRipple = (e) => {
    if (!chatAreaRef.current) return;
    const rect = chatAreaRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const newRipple = { id: Date.now(), x, y };
    setRipples(prev => [...prev, newRipple]);
    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== newRipple.id));
    }, 1000);
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!userInput.trim()) return;

    // Create splash effect
    createRipple({ clientX: window.innerWidth / 2, clientY: window.innerHeight / 2 });

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
            ...messages.map(m => ({
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
        throw new Error(`API request failed: ${errorData}`);
      }

      const data = await response.json();
      const aiResponse = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.choices?.[0]?.message?.content || "I'm sorry, I couldn't generate a response.",
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiResponse]);
    } catch (error) {
      console.error("Error:", error);
      const errorMessage = {
        id: (Date.now() + 2).toString(),
        role: "assistant",
        content: "Sorry, I encountered an error. Please check your API key and try again.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-b from-cyan-50 to-blue-100">
      {/* Water background layer */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Water fill animation */}
        <motion.div
          className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-blue-500 via-cyan-400 to-cyan-300/90"
          initial={{ height: "0%" }}
          animate={{ height: `${waterLevel}%` }}
          transition={{ duration: 3, ease: "easeInOut" }}
        >
          {/* Water surface waves */}
          <svg className="absolute top-0 left-0 w-full h-20" preserveAspectRatio="none">
            <motion.path
              d="M0,10 Q250,20 500,10 T1000,10 L1000,100 L0,100 Z"
              fill="url(#waterGradient)"
              animate={{
                d: [
                  "M0,10 Q250,20 500,10 T1000,10 L1000,100 L0,100 Z",
                  "M0,15 Q250,5 500,15 T1000,15 L1000,100 L0,100 Z",
                  "M0,10 Q250,20 500,10 T1000,10 L1000,100 L0,100 Z"
                ]
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            <defs>
              <linearGradient id="waterGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="rgba(34, 211, 238, 0.8)" />
                <stop offset="100%" stopColor="rgba(59, 130, 246, 0.9)" />
              </linearGradient>
            </defs>
          </svg>

          {/* Underwater light rays */}
          <div className="absolute inset-0 opacity-30">
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute top-0 h-full w-16 bg-gradient-to-b from-white/20 to-transparent"
                style={{ left: `${i * 25}%` }}
                animate={{
                  opacity: [0.2, 0.5, 0.2],
                  x: [-20, 20, -20],
                }}
                transition={{
                  duration: 8,
                  repeat: Infinity,
                  delay: i * 1.5,
                }}
              />
            ))}
          </div>
        </motion.div>

        {/* Bubbles */}
        {[...Array(15)].map((_, i) => (
          <WaterBubble
            key={i}
            delay={i * 0.5}
            size={["small", "medium", "large"][i % 3]}
            position={Math.random() * 100}
          />
        ))}
      </div>

      {/* Water pour effect */}
      {waterLevel < 100 && <WaterPour />}

      {/* Main content */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/20 backdrop-blur-xl border-b border-white/30 p-4"
        >
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="w-12 h-12 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 flex items-center justify-center"
              >
                <Droplets className="h-6 w-6 text-white" />
              </motion.div>
              <div>
                <h1 className="text-2xl font-bold text-white">Aqua G-Assist</h1>
                <p className="text-cyan-100 text-sm">Powered by Google Gemini 2.0</p>
              </div>
            </div>
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="rounded-full bg-white/20 backdrop-blur-lg hover:bg-white/30 border border-white/30 p-2 transition-all"
            >
              {soundEnabled ? <Volume2 className="h-5 w-5 text-white" /> : <VolumeX className="h-5 w-5 text-white" />}
            </button>
          </div>
        </motion.div>

        {/* Chat area */}
        <div 
          ref={chatAreaRef}
          className="flex-1 max-w-4xl mx-auto w-full p-4 overflow-y-auto"
          onClick={createRipple}
        >
          {/* Ripple effects */}
          <AnimatePresence>
            {ripples.map((ripple) => (
              <Ripple key={ripple.id} x={ripple.x} y={ripple.y} />
            ))}
          </AnimatePresence>

          {/* Messages */}
          <div className="space-y-4 pb-20">
            {messages.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-20"
              >
                <Waves className="h-16 w-16 text-cyan-300 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-white mb-2">Welcome to Aqua G-Assist</h2>
                <p className="text-cyan-100">Start a conversation and watch the water ripple with intelligence</p>
              </motion.div>
            ) : (
              <AnimatePresence>
                {messages.map((msg, index) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 20, scale: 0.8 }}
                    animate={{ 
                      opacity: 1, 
                      y: [20, -5, 0],
                      scale: 1,
                    }}
                    transition={{
                      type: "spring",
                      stiffness: 200,
                      damping: 20,
                    }}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <motion.div
                      animate={{
                        y: [0, -3, 0],
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        delay: index * 0.2,
                        ease: "easeInOut"
                      }}
                      className={`max-w-[80%] rounded-2xl p-4 backdrop-blur-lg ${
                        msg.role === 'user'
                          ? 'bg-gradient-to-r from-blue-400/80 to-cyan-400/80 text-white'
                          : 'bg-white/30 text-white border border-white/40'
                      }`}
                      style={{
                        boxShadow: "0 8px 32px rgba(31, 38, 135, 0.2)",
                      }}
                    >
                      <p className="font-medium mb-1 text-sm opacity-90">
                        {msg.role === 'user' ? 'You' : 'Aqua Assistant'}
                      </p>
                      <p>{msg.content}</p>
                    </motion.div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
            
            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-start"
              >
                <div className="bg-white/30 backdrop-blur-lg rounded-2xl p-4 border border-white/40">
                  <div className="flex items-center gap-2">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    >
                      <Droplets className="h-5 w-5 text-cyan-300" />
                    </motion.div>
                    <span className="text-cyan-100">Thinking...</span>
                  </div>
                </div>
              </motion.div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input area */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-cyan-400/50 to-transparent backdrop-blur-xl border-t border-white/30 p-4"
        >
          <div className="max-w-4xl mx-auto">
            <div className="flex gap-2">
              <textarea
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="Dive into conversation..."
                className="flex-1 min-h-[50px] max-h-[100px] rounded-xl bg-white/20 backdrop-blur-lg text-white placeholder:text-white/60 border border-white/30 resize-none p-3 focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
              />
              <button
                onClick={handleSubmit}
                disabled={isLoading || !userInput.trim()}
                className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white px-6 py-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <Send className="h-5 w-5" />
              </button>
            </div>
            
            <div className="flex justify-center gap-2 mt-3">
              <button
                className="rounded-full bg-white/10 backdrop-blur-lg hover:bg-white/20 p-2 transition-all"
              >
                <Mic className="h-5 w-5 text-white" />
              </button>
              <button
                className="rounded-full bg-white/10 backdrop-blur-lg hover:bg-white/20 p-2 transition-all"
              >
                <Paperclip className="h-5 w-5 text-white" />
              </button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Underwater ambient sound (optional implementation) */}
      {soundEnabled && (
        <audio autoPlay loop>
          <source src="/underwater-ambience.mp3" type="audio/mpeg" />
        </audio>
      )}
    </div>
  );
};

export default GAssistChatbot;
