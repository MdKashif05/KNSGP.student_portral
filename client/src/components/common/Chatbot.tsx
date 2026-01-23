import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MessageCircle, X, Send, Bot, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { apiRequest } from "@/lib/queryClient";

interface Message {
  role: "user" | "model";
  parts: string;
}

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();

    if (!inputValue.trim() || isLoading) return;

    const userMessage = inputValue.trim();
    // Capitalize first letter of user message for display
    const formattedUserMessage = userMessage.charAt(0).toUpperCase() + userMessage.slice(1);
    
    setInputValue("");
    setMessages((prev) => [...prev, { role: "user", parts: formattedUserMessage }]);
    setIsLoading(true);

    try {
      const response = await apiRequest("POST", "/api/chat", {
        message: userMessage,
        history: messages.map(m => ({
          role: m.role,
          parts: [{ text: m.parts }]
        }))
      });

      const data = await response.json();
      
      setMessages((prev) => [...prev, { role: "model", parts: data.response }]);
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [
        ...prev, 
        { role: "model", parts: "Sorry, I encountered an error. Please try again." }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4">
      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.2 }}
            className="w-[350px] sm:w-[400px]"
          >
            <Card className="flex flex-col h-[500px] shadow-2xl border-primary/20 overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-4 flex items-center justify-between text-white shadow-md">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 p-2 rounded-full backdrop-blur-sm border border-white/10">
                    <Bot className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm tracking-wide">Edumanage AI</h3>
                    <p className="text-[10px] text-white/80 font-medium">Online • Ask me anything</p>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 hover:bg-white/20 text-white rounded-full transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
                {messages.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full text-center p-6 animate-in fade-in duration-500">
                    <div className="bg-emerald-100 p-4 rounded-full mb-4">
                      <Bot className="h-8 w-8 text-emerald-600" />
                    </div>
                    <h4 className="font-semibold text-slate-800 mb-2">Hi! I'm Edumanage AI</h4>
                    <p className="text-sm text-slate-500 max-w-[200px] leading-relaxed">
                      I can help you with your studies, college info, or general questions.
                    </p>
                  </div>
                )}
                
                {messages.map((msg, idx) => (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={idx}
                    className={`flex items-end gap-2 ${
                      msg.role === "user" ? "flex-row-reverse" : "flex-row"
                    }`}
                  >
                    <div
                      className={`h-8 w-8 shrink-0 rounded-full flex items-center justify-center shadow-sm border ${
                        msg.role === "user" 
                          ? "bg-slate-800 text-white border-slate-700" 
                          : "bg-emerald-500 text-white border-emerald-400"
                      }`}
                    >
                      {msg.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                    </div>
                    <div
                      className={`relative px-4 py-2.5 max-w-[80%] text-sm shadow-sm ${
                        msg.role === "user"
                          ? "bg-slate-800 text-white rounded-2xl rounded-br-none"
                          : "bg-white text-slate-700 border border-slate-100 rounded-2xl rounded-bl-none"
                      }`}
                    >
                      {msg.parts}
                    </div>
                  </motion.div>
                ))}
                
                {isLoading && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-end gap-2"
                  >
                    <div className="h-8 w-8 shrink-0 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-sm border border-emerald-400">
                      <Bot className="h-4 w-4" />
                    </div>
                    <div className="bg-white border border-slate-100 rounded-2xl rounded-bl-none px-4 py-3 shadow-sm">
                      <div className="flex gap-1.5">
                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce"></span>
                      </div>
                    </div>
                  </motion.div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="p-4 bg-card border-t">
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <Input
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Type your question..."
                    className="flex-1 focus-visible:ring-emerald-500"
                    disabled={isLoading}
                  />
                  <Button 
                    type="submit" 
                    size="icon" 
                    disabled={isLoading || !inputValue.trim()}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle Button */}
      <div className="relative group">
        <AnimatePresence>
          {!isOpen && (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="absolute right-full mr-4 top-1/2 -translate-y-1/2 whitespace-nowrap bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-sm font-medium shadow-lg pointer-events-none"
            >
              Chat with us!
              <div className="absolute right-[-6px] top-1/2 -translate-y-1/2 border-[6px] border-transparent border-l-emerald-500"></div>
            </motion.div>
          )}
        </AnimatePresence>
        
        <Button
          size="icon"
          className={`h-14 w-14 rounded-full shadow-lg transition-all duration-300 ${
            isOpen 
              ? "bg-muted text-muted-foreground hover:bg-muted/80 rotate-90" 
              : "bg-emerald-500 hover:bg-emerald-600 text-white hover:scale-110 animate-pulse-subtle"
          }`}
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-7 w-7" />}
        </Button>
      </div>
    </div>
  );
}