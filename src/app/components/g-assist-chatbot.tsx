"use client";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Mic, Waves, Volume2, VolumeX } from "lucide-react";

// --- HELPER COMPONENTS ---

// 1. Pouring Stream Component (for initial load and AI thinking)
const PouringStream = () => (
  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 h-full w-4 overflow-hidden pointer-events-none z-20">
    <motion.div
      className="w-full h-full bg-gradient-to-b from-cyan-300/90 via-cyan-400/70 to-transparent"
      initial={{ y: "-100%" }}
      animate={{ y: "0%" }}
      transition={{ duration: 2, ease: "linear" }}
      style={{
        clipPath: "polygon(10% 0, 90% 0, 100% 100%, 0% 100%)",
      }}
    />
  </div>
);


// 2. Water Bubble Component
const WaterBubble = ({ delay = 0, size = "medium", position, speed = "medium" }) => {
  const sizes = { small: "w-1 h-1", medium: "w-2 h-2", large: "w-3 h-3" };
  const durations = { slow: 12, medium: 8, fast: 5 };

  return (
    <motion.div
      className={`absolute ${sizes[size]} bubble-particle`}
      style={{ left: `${position}%`, animationDelay: `${delay}s` }}
      animate={{
        y: ["0%", "-100vh"],
        x: [0, Math.random() * 20 - 10, 0, Math.random() * 20 - 10, 0],
        opacity: [0.8, 0.8, 0],
      }}
      transition={{
        duration: Math.random() * 5 + durations[speed],
        repeat: Infinity,
        ease: "linear",
      }}
    />
  );
};

// 3. Ripple Effect Component
const Ripple = ({ x, y, onComplete }) => {
  return (
    <motion.div
      className="absolute pointer-events-none rounded-full border-2 border-cyan-200/80"
      style={{ left: x - 20, top: y - 20, width: 40, height: 40 }}
      initial={{ scale: 0, opacity: 1 }}
      animate={{ scale: 3, opacity: 0 }}
      transition={{ duration: 0.7, ease: "easeOut" }}
      onAnimationComplete={onComplete}
    />
  );
};


// --- MAIN CHATBOT COMPONENT ---
const GAssistChatbot = () => {
  const [userInput, setUserInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [waterLevel, setWaterLevel] = useState(0); // For initial fill animation
  const [ripples, setRipples] = useState([]);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const messagesEndRef = useRef(null);

  // Animate water filling on component mount
  useEffect(() => {
    const timer = setTimeout(() => setWaterLevel(100), 500);
    return () => clearTimeout(timer);
  }, []);

  // Auto-scroll to the bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Function to create a ripple effect
  const createRipple = (e) => {
    const newRipple = {
      id: Date.now(),
      x: e.clientX,
      y: e.clientY,
    };
    setRipples(prev => [...prev, newRipple]);
  };

  const handleRippleComplete = (id) => {
    setRipples(prev => prev.filter(r => r.id !== id));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userInput.trim() || isLoading) return;

    const newUserMessage = {
      id: Date.now(),
      role: "user",
      content: userInput,
    };
    setMessages(prev => [...prev, newUserMessage]);
    setUserInput("");
    setIsLoading(true);

    // --- API Call Simulation ---
    // Simulating a delay and then a response
    setTimeout(() => {
      const aiResponse = {
        id: Date.now() + 1,
        role: "assistant",
        content: `This is a simulated response to: "${userInput}"`,
      };
      setMessages(prev => [...prev, aiResponse]);
      setIsLoading(false);
      // Create a ripple where the new AI message appears
      createRipple({ clientX: window.innerWidth * 0.25, clientY: window.innerHeight - 250 });
    }, 2500);
  };

  return (
    // Main container using the water theme from globals.css
    <div className="min-h-screen relative overflow-hidden bg-blue-500">
      
      {/* --- WATER & BUBBLE BACKGROUND --- */}
      <div className="absolute inset-0 w-full h-full pointer-events-none">
        {/* The main rising water body */}
        <motion.div
          className="absolute bottom-0 left-0 w-full water-gradient"
          initial={{ height: "0%" }}
          animate={{ height: `${waterLevel}%` }}
          transition={{ duration: 5, ease: "easeOut" }}
        >
          {/* Animated SVG Waves on surface */}
          <div className="absolute -top-1 left-0 w-full h-8">
              <svg
                className="w-full h-full"
                viewBox="0 0 500 20"
                preserveAspectRatio="none"
              >
                  <path
                      className="water-wave"
                      fill="rgba(var(--water-primary), 0.8)"
                      style={{ animation: 'wave 4s cubic-bezier(0.36, 0.45, 0.63, 0.53) infinite' }}
                  />
              </svg>
          </div>
          {/* Underwater light rays */}
          {[...Array(5)].map((_, i) => (
            <div key={i} className="light-ray" style={{ left: `${i * 20}%`, animationDelay: `${i * 1.2}s`, transform: `translateX(${Math.random() * 20 - 10}px)` }}/>
          ))}
        </motion.div>
        
        {/* Pouring stream during initial load */}
        {waterLevel < 100 && <PouringStream />}

        {/* Ambient & Turbulent Bubbles */}
        {waterLevel > 10 && (
          <>
            {/* Ambient slow bubbles */}
            {[...Array(15)].map((_, i) => (
              <WaterBubble key={`amb-${i}`} delay={i * 0.8} position={Math.random() * 100} speed="slow" size={["small", "medium"][i%2]} />
            ))}
            {/* Turbulent fast bubbles in the center */}
            {[...Array(20)].map((_, i) => (
              <WaterBubble key={`turb-${i}`} delay={i * 0.2} position={Math.random() * 40 + 30} speed="fast" size="small" />
            ))}
          </>
        )}
      </div>

      {/* Ripple Effects Container */}
      <AnimatePresence>
        {ripples.map((ripple) => (
          <Ripple key={ripple.id} x={ripple.x} y={ripple.y} onComplete={() => handleRippleComplete(ripple.id)} />
        ))}
      </AnimatePresence>

      {/* --- UI & CHAT CONTENT --- */}
      <div className="relative z-10 flex flex-col h-screen">
        {/* Header */}
        <header className="bg-white/10 backdrop-blur-md p-4 border-b border-white/20">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <h1 className="text-xl font-bold text-white tracking-wide">Aqua AI</h1>
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            >
              {soundEnabled ? <Volume2 className="h-5 w-5 text-white" /> : <VolumeX className="h-5 w-5 text-white" />}
            </button>
          </div>
        </header>

        {/* Chat Area */}
        <main className="flex-1 max-w-4xl mx-auto w-full p-4 overflow-y-auto">
          <div className="space-y-6 pb-24">
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 150, damping: 20 }}
                className={`flex items-end gap-2 message-float ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl p-3 text-white ${
                    msg.role === 'user'
                      ? 'bg-blue-500/50'
                      : 'bg-cyan-500/40'
                  }`}
                  style={{ backdropFilter: 'blur(10px)', border: '1px solid rgba(255, 255, 255, 0.2)' }}
                >
                  <p>{msg.content}</p>
                </div>
              </motion.div>
            ))}

            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-start message-float"
              >
                <div className="bg-cyan-500/40 backdrop-blur-md rounded-2xl p-3 border border-white/20">
                    <motion.div
                      animate={{ y: [0, -4, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <Waves className="h-6 w-6 text-white" />
                    </motion.div>
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </main>
        
        {/* Glassy Floating Input Bar */}
        <footer className="fixed bottom-0 left-0 right-0 p-4 z-20">
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 100 }}
            className="max-w-4xl mx-auto p-2 rounded-2xl bg-white/10 backdrop-blur-lg border border-white/20 shadow-lg"
          >
            <form onSubmit={handleSubmit} className="flex items-center gap-2">
              <button type="button" className="p-2 text-white/80 hover:text-white">
                <Mic className="h-5 w-5" />
              </button>
              <textarea
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyDown={(e) => {
                  createRipple({ 
                    clientX: e.currentTarget.getBoundingClientRect().left + 50,
                    clientY: e.currentTarget.getBoundingClientRect().top + 20,
                  });
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
                placeholder="Ask me anything..."
                className="flex-1 min-h-[40px] max-h-[120px] bg-transparent text-white placeholder:text-white/60 resize-none p-2 focus:outline-none"
              />
              <button
                type="submit"
                disabled={isLoading || !userInput.trim()}
                className="p-3 rounded-full bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/50 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="h-5 w-5 text-white" />
              </button>
            </form>
          </motion.div>
        </footer>
      </div>

      {/* Underwater Ambient Sound */}
      {soundEnabled && (
        <audio autoPlay loop>
          {/* Make sure you have this audio file in your /public folder */}
          <source src="/underwater-ambience.mp3" type="audio/mpeg" />
        </audio>
      )}
    </div>
  );
};

export default GAssistChatbot;
