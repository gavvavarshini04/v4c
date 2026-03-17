import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Bot, User, Loader2, Sparkles, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface Message {
    role: 'user' | 'model';
    content: string;
}

export default function ChatBot() {
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<Message[]>([
        { role: 'model', content: 'Hello! I am your Voice4City assistant. How can I help you today?' }
    ]);
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage = input.trim();
        const lowMessage = userMessage.toLowerCase();
        setInput('');

        const newMessages = [...messages, { role: 'user', content: userMessage } as Message];
        setMessages(newMessages);
        setIsLoading(true);

        // Simulate thinking
        await new Promise(resolve => setTimeout(resolve, 800));

        let response = "";

        // 1. Time-based Greetings
        if (lowMessage.includes('hi') || lowMessage.includes('hello') || lowMessage.includes('hey')) {
            const hour = new Date().getHours();
            let greeting = "Good evening";
            if (hour < 12) greeting = "Good morning";
            else if (hour < 17) greeting = "Good afternoon";
            response = `${greeting}! I am your Voice4City assistant. How can I help you today?`;
        }
        // 2. Complaint Stats Tracking
        else if (lowMessage.includes('track') || lowMessage.includes('status') || lowMessage.includes('complaint') || lowMessage.includes('how many')) {
            try {
                const { data, error } = await supabase.from('complaints').select('status');
                if (error) throw error;

                const total = data.length;
                const resolved = data.filter(c => c.status === 'resolved').length;
                const pending = total - resolved;

                response = `Current City Statistics:
• Total Complaints: ${total}
• Resolved: ${resolved}
• Pending/Active: ${pending}

Would you like to track a specific complaint? Please visit the 'Track Complaint' page.`;
            } catch (err) {
                response = "I couldn't fetch the real-time statistics right now. Please try again or visit your dashboard.";
            }
        }
        // 3. How to report
        else if (lowMessage.includes('report') || lowMessage.includes('submit') || lowMessage.includes('new')) {
            response = "To report a new civic issue:\n1. Click the '+ New' button or 'Submit Complaint' in the navbar.\n2. Describe the issue (AI will help categorize it).\n3. Upload a photo if available.\n4. Mark the location on the map and submit!";
        }
        // 4. Emergency / SOS
        else if (lowMessage.includes('emergency') || lowMessage.includes('sos') || lowMessage.includes('help') || lowMessage.includes('danger')) {
            response = "🚨 If you are in immediate danger, please click the red 'SOS' button in the top right of the navbar. It will share your location with nearby authorities and send an alert!";
        }
        // 5. About / What is Voice4City
        else if (lowMessage.includes('what') || lowMessage.includes('about') || lowMessage.includes('voice4city')) {
            response = "Voice4City is a platform designed for citizens of Tirupati to directly interact with city authorities. You can report potholes, water leaks, electricity issues, and more. Our goal is a cleaner, safer, and smarter city!";
        }
        // 6. Who are you
        else if (lowMessage.includes('who') || lowMessage.includes('identity') || lowMessage.includes('name')) {
            response = "I am the V4C Virtual Assistant. I'm helping you navigate the platform and provide city statistics. Unlike the AI version, I am now a faster, lighter local script!";
        }
        // 7. Success Stories / Analytics
        else if (lowMessage.includes('heatmap') || lowMessage.includes('statistics') || lowMessage.includes('data')) {
            response = "You can view the city's complaint density on the 'Heatmap' page (for officers) or check out the 'Statistics' tab on your dashboard to see how your neighborhood is improving!";
        }
        // 8. Fallback
        else {
            response = "I'm a scripted assistant. Try asking: \n• 'How many complaints are resolved?'\n• 'How to report an issue?'\n• 'What is Voice4City?'\n• 'Is there an SOS button?'";
        }

        setMessages([...newMessages, { role: 'model', content: response }]);
        setIsLoading(false);
    };

    return (
        <div className="fixed bottom-8 right-8 z-50 flex flex-col items-end pointer-events-none">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="mb-6 w-[360px] pointer-events-auto"
                    >
                        <div className="glass-dark border border-white/5 shadow-cinematic rounded-[2.5rem] overflow-hidden flex flex-col h-[550px]">
                            {/* Header */}
                            <div className="px-6 py-6 flex items-center justify-between border-b border-white/5">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-2xl bg-white/10 flex items-center justify-center">
                                        <Bot className="h-5 w-5 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-white tracking-tight">V4C Assistant</h3>
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">Local Support</p>
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setIsOpen(false)}
                                    className="text-white/40 hover:text-white hover:bg-white/5 h-8 w-8 rounded-full"
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>

                            {/* Messages */}
                            <div
                                className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar"
                                ref={scrollRef}
                            >
                                {messages.map((m, i) => (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        key={i}
                                        className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div className={`flex flex-col gap-1.5 max-w-[85%] ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                                            <div className={`rounded-[1.5rem] px-4 py-3 text-sm transition-all ${m.role === 'user'
                                                ? 'bg-white text-slate-950 font-bold rounded-tr-none shadow-lg'
                                                : 'bg-white/5 text-white font-medium rounded-tl-none border border-white/5'
                                                }`}>
                                                {m.content}
                                            </div>
                                            <span className="text-[9px] font-bold uppercase tracking-widest text-white/20 px-1">
                                                {m.role === 'user' ? 'You' : 'Assistant'}
                                            </span>
                                        </div>
                                    </motion.div>
                                ))}
                                {isLoading && (
                                    <div className="flex justify-start">
                                        <div className="bg-white/5 border border-white/5 rounded-[1.5rem] rounded-tl-none px-5 py-3 flex gap-1.5 items-center">
                                            <span className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce" />
                                            <span className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce [animation-delay:0.2s]" />
                                            <span className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce [animation-delay:0.4s]" />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Input Area */}
                            <div className="p-6 border-t border-white/5 bg-white/5">
                                <form onSubmit={handleSend} className="relative flex items-center">
                                    <Input
                                        placeholder="Send a message..."
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        className="h-12 bg-white/5 border-none rounded-2xl text-white placeholder:text-white/30 focus-visible:ring-1 focus-visible:ring-white/20 pr-12 text-sm"
                                    />
                                    <Button
                                        type="submit"
                                        size="icon"
                                        disabled={!input.trim() || isLoading}
                                        className="absolute right-1 text-slate-950 bg-white hover:bg-white/90 rounded-xl h-10 w-10 transition-all active:scale-90"
                                    >
                                        <Send className="h-4 w-4" />
                                    </Button>
                                </form>
                                <div className="mt-4 flex items-center justify-center gap-1.5 opacity-20">
                                    <span className="text-[9px] font-bold uppercase tracking-[0.25em] text-white">Rule-based Support</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(!isOpen)}
                className={`h-16 w-16 rounded-[2rem] shadow-cinematic flex items-center justify-center transition-all duration-500 pointer-events-auto border border-white/10 ${isOpen ? 'bg-white text-slate-950' : 'glass-dark text-white hover:bg-slate-900'
                    }`}
            >
                <AnimatePresence mode="wait">
                    {isOpen ? (
                        <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
                            <X className="h-6 w-6" />
                        </motion.div>
                    ) : (
                        <motion.div key="chat" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}>
                            <MessageCircle className="h-6 w-6" />
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.button>
        </div>
    );
}
