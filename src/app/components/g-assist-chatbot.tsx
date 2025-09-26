"use client";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Send, Mic, Paperclip, Sparkles, Zap, Star, MessageCircle, Brain, Wand2 } from "lucide-react";

// FIXED FloatingParticles hydration issue!
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

  // Typewriter effect for placeholder
  useEffect(() => {
    const prompts = [
      "Ask me anything about technology...",
      "Get help with coding and development...",
      "Explore creative ideas and solutions...",
      "Learn something new today...",
      "Solve complex problems together..."
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

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Simulate AI typing
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
  
    // Add user message to chat
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
      // Call OpenRouter API with Google Gemini model
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.NEXT_PUBLIC_OPENROUTER_API_KEY || ''}`,
          "HTTP-Referer": window.location.href,
          "X-Title": "G-Assist",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          // This line correctly specifies the model you want to use
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
        // Get more specific error information
        const errorData = await response.text();
        console.error(`API Error ${response.status}:`, errorData);
        throw new Error(`API request failed with status ${response.status}: ${errorData}`);
      }
  
      // *** THIS IS THE FIX ***
      // You must parse the JSON from the response body AFTER you know the request was successful.
      const data = await response.json();
  
      // Add AI response
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
        content: "Sorry, I encountered an error. Please make sure your API key is configured correctly in the environment variables and try again.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-teal-900 to-green-800 flex flex-col items-center justify-center p-2 md:p-4 relative overflow-hidden">
      <FloatingParticles />
      
      {/* Decorative elements */}
      <div className="absolute top-10 left-10 w-32 h-32 rounded-full bg-blue-500/10 blur-3xl"></div>
      <div className="absolute bottom-20 right-10 w-48 h-48 rounded-full bg-green-500/10 blur-3xl"></div>
      <div className="absolute top-1/3 right-1/4 w-24 h-24 rounded-full bg-teal-500/10 blur-3xl"></div>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-4xl bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden border border-white/20 relative z-10"
      >
        {/* Header Section with gradient and decorative elements */}
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
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-green-500 rounded-full blur-lg opacity-70"></div>
                <div className="relative w-12 h-12 rounded-full bg-gradient-to-r from-blue-400 to-green-500 flex items-center justify-center">
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
              </div>
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-3xl md:text-4xl font-bold text-white mb-1 bg-clip-text text-transparent bg-gradient-to-r from-blue-300 via-white to-green-300"
            >
              G-Assist
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-base text-blue-100 max-w-2xl mx-auto font-light"
            >
              Powered by Google Gemini 2.0 Flash - Your intelligent AI assistant
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="flex justify-center gap-1 mt-2"
            >
              {[...Array(5)].map((_, i) => (
                <motion.div
                  key={i}
                  animate={{ 
                    scale: [1, 1.2, 1],
                    rotate: [0, 10, -10, 0]
                  }}
                  transition={{ 
                    duration: 2,
                    repeat: Infinity,
                    delay: i * 0.2,
                    repeatDelay: 3
                  }}
                >
                  <Star className="h-4 w-4 text-yellow-300" fill="currentColor" />
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>

        {/* Chat Messages with beautiful<div className="h-80 overflow-y-auto p-3 bg-gradient-to-b from-black/5 to-transparent relative"> styling */}
        
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
                className="mb-6 p-4 rounded-full bg-gradient-to-r from-blue-500/20 to-green-500/20"
              >
                <Wand2 className="h-12 w-12 text-blue-300" />
              </motion.div>
              
              <motion.h3 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-2xl font-bold text-white mb-2"
              >
                Welcome to G-Assist
              </motion.h3>
              
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="text-blue-200 max-w-md"
              >
                Start a conversation with Google Gemini AI. I can help you with coding, answer questions, and assist with creative tasks.
              </motion.p>
              
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-8 w-full max-w-md"
              >
                {[
                  "Explain quantum computing",
                  "Write Python code",
                  "Creative story ideas",
                  "Solve math problems"
                ].map((suggestion, i) => (
                  <motion.div
                    key={i}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="bg-white/10 backdrop-blur-sm rounded-lg p-2 text-center text-xs text-white border border-white/20 cursor-pointer hover:bg-white/20 transition-colors"
                    onClick={() => setUserInput(suggestion)}
                  >
                    {suggestion}
                  </motion.div>
                ))}
              </motion.div>
            </div>
          ) : (
            <div className="space-y-4">
              <AnimatePresence>
                {messages.map((msg) => (
                  <motion.div 
                    key={msg.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div 
                      className={`max-w-[85%] rounded-3xl px-4 py-2 relative overflow-hidden ${
                        msg.role === 'user' 
                          ? 'bg-gradient-to-r from-blue-600 to-teal-600 text-white rounded-br-none' 
                          : 'bg-white/10 backdrop-blur-lg text-white border border-white/20 rounded-bl-none'
                      }`}
                    >
                      {msg.role === 'assistant' && (
                        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-cyan-500/10 to-green-500/10"></div>
                      )}
                      <div className="relative z-10">
                        <div className="flex items-start gap-3">
                          {msg.role === 'assistant' ? (
                            <div className="mt-1 p-1.5 rounded-lg bg-gradient-to-r from-cyan-500/30 to-green-500/30">
                              <Brain className="h-4 w-4 text-cyan-300" />
                            </div>
                          ) : (
                            <div className="mt-1 p-1.5 rounded-lg bg-gradient-to-r from-blue-500/30 to-teal-500/30">
                              <MessageCircle className="h-4 w-4 text-blue-300" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium mb-1">
                              {msg.role === 'user' ? 'You' : 'G-Assist'}
                            </p>
                            <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              
              {isTyping && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start"
                >
                  <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-3xl rounded-bl-none px-5 py-4">
                    <div className="flex items-center gap-2">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce"></div>
                        <div className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce delay-100"></div>
                        <div className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce delay-200"></div>
                      </div>
                      <span className="text-cyan-300 text-sm">G-Assist is thinking...</span>
                    </div>
                  </div>
                </motion.div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Chat Input Section with enhanced design */}
        <div className="p-3 bg-black/10 border-t border-white/10">
          <div className="relative">
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
              className="min-h-[60px] w-full rounded-xl border border-white/20 bg-white/10 backdrop-blur-lg p-3 pr-14 text-base text-white placeholder:text-white/60 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/30 focus:ring-opacity-50 resize-none"
              disabled={isLoading}
            />
            
            <Button 
              onClick={handleSubmit}
              size="icon" 
              className="absolute bottom-2.5 right-2.5 h-10 w-10 rounded-lg bg-gradient-to-r from-cyan-500 to-green-500 hover:from-cyan-600 hover:to-green-600 shadow-lg shadow-cyan-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
              disabled={isLoading || !userInput.trim()}
            >
              <Send className="h-4 w-4 text-white" />
            </Button>
          </div>

          {/* Action Buttons with beautiful styling */}
          <div className="flex justify-center gap-2 mt-2">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button 
                variant="outline" 
                size="icon" 
                className="h-10 w-10 rounded-full border border-white/30 bg-white/10 backdrop-blur-lg hover:bg-white/20 disabled:opacity-50"
                disabled={isLoading}
              >
                <Mic className="h-4 w-4 text-cyan-300" />
              </Button>
            </motion.div>
            
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button 
                variant="outline" 
                size="icon" 
                className="h-12 w-12 rounded-full border border-white/30 bg-white/10 backdrop-blur-lg hover:bg-white/20 disabled:opacity-50"
                disabled={isLoading}
              >
                <Paperclip className="h-4 w-4 text-cyan-300" />
              </Button>
            </motion.div>
          </div>
        </div>

        {/* Features Section with beautiful cards */}
        <div className="p-3 bg-gradient-to-r from-blue-900/30 to-green-900/30 border-t border-white/10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {[
              { 
                icon: <Zap className="h-6 w-6 text-yellow-400" />, 
                title: "Google Gemini", 
                desc: "Powered by cutting-edge AI" 
              },
              { 
                icon: <Sparkles className="h-6 w-6 text-cyan-400" />, 
                title: "Free to Use", 
                desc: "No API key required" 
              },
              { 
                icon: <Star className="h-6 w-6 text-green-400" fill="currentColor" />, 
                title: "Lightning Fast", 
                desc: "Instant AI responses" 
              }
            ].map((feature, i) => (
              <motion.div
                key={i}
                whileHover={{ y: -5 }}
                className="bg-white/5 backdrop-blur-sm rounded-lg p-3 border border-white/10 hover:border-white/20 transition-all duration-300"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-white/10">
                    {feature.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-white">{feature.title}</h3>
                </div>
                <p className="text-blue-200">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
      
      {/* Footer with subtle animation */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="mt-4 text-center text-white/60 text-sm"
      >
        <p>Powered by Google Gemini 2.0 Flash • Your intelligent AI assistant</p>
      </motion.div>
    </div>
  );
};

export default GAssistChatbot;
