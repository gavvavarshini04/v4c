import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import {
    Settings,
    HelpCircle,
    Info,
    LogOut,
    ChevronRight,
    ArrowLeft,
    Shield,
    MessageSquare,
    UserCircle,
    Mail,
    Phone,
    LayoutDashboard
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export default function Profile() {
    const { user, profile, role, signOut } = useAuth();
    const { t } = useLanguage();
    const navigate = useNavigate();

    const { data: stats } = useQuery({
        queryKey: ['user-stats', user?.id],
        queryFn: async () => {
            if (!user) return null;

            const { count: totalCount } = await supabase
                .from('complaints')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id);

            const { count: resolvedCount } = await supabase
                .from('complaints')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id)
                .eq('status', 'resolved');

            return {
                total: totalCount || 0,
                resolved: resolvedCount || 0,
            };
        },
        enabled: !!user,
        refetchOnWindowFocus: true
    });

    const handleLogout = async () => {
        await signOut();
        navigate('/');
    };

    const menuItems = [
        {
            icon: LayoutDashboard,
            label: t('dash_track') || "Track Complaints",
            desc: "View status of your reports",
            action: () => navigate('/dashboard')
        },
        {
            icon: Settings,
            label: "Settings",
            desc: "App preferences & security",
            action: () => { }
        },
        {
            icon: HelpCircle,
            label: "Help & Support",
            desc: "FAQs and contact support",
            action: () => { }
        },
        {
            icon: Info,
            label: "About App",
            desc: "Version info & legal",
            action: () => { }
        },
        {
            icon: UserCircle,
            label: "Switch Account",
            desc: "Login with different role",
            action: () => navigate('/login'),
            color: "text-blue-400"
        },
        {
            icon: LogOut,
            label: t('nav_logout'),
            desc: "Sign out of your session",
            action: handleLogout,
            color: "text-destructive"
        },
    ];

    const getInitials = (name: string) => {
        return name.split(' ').map(n => n[0]).join('').toUpperCase();
    };

    return (
        <div className="min-h-screen bg-slate-950 text-white pb-20 selection:bg-primary/30">
            <div className="relative z-10 max-w-2xl mx-auto px-6">
                {/* Header */}
                <div className="pt-4 flex items-center justify-between mb-8">
                    <motion.button
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        onClick={() => navigate(-1)}
                        className="group h-12 w-12 flex items-center justify-center rounded-2xl glass-dark hover:bg-white/10 transition-all border border-white/5"
                    >
                        <ArrowLeft className="h-5 w-5 text-white/60 group-hover:text-white" />
                    </motion.button>
                    <div className="w-12" /> {/* Spacer */}
                </div>

                {/* Profile Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="glass-dark rounded-[2.5rem] p-8 border border-white/10 shadow-2xl relative overflow-hidden mb-8"
                >
                    <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
                        <div className="relative">
                            <div className="h-28 w-28 rounded-3xl bg-gradient-to-br from-primary via-primary/80 to-blue-600 flex items-center justify-center text-4xl font-bold shadow-2xl border-2 border-white/20 transform rotate-3 hover:rotate-0 transition-transform duration-500">
                                {profile?.name ? getInitials(profile.name) : <UserCircle className="h-14 w-14" />}
                            </div>
                            <div className="absolute -bottom-2 -right-2 h-10 w-10 rounded-2xl bg-slate-900 border border-white/10 flex items-center justify-center shadow-xl">
                                <Shield className="h-5 w-5 text-primary" />
                            </div>
                        </div>

                        <div className="flex-1 text-center md:text-left">
                            <motion.h2
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.2 }}
                                className="text-3xl font-bold tracking-tight mb-2"
                            >
                                {profile?.name || 'User'}
                            </motion.h2>
                            <div className="flex flex-wrap justify-center md:justify-start gap-4 text-white/50 text-sm">
                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/5">
                                    <Mail className="h-3.5 w-3.5" />
                                    <span>{user?.email}</span>
                                </div>
                                {profile?.phone && (
                                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/5">
                                        <Phone className="h-3.5 w-3.5" />
                                        <span>{profile.phone}</span>
                                    </div>
                                )}
                            </div>
                            <div className="mt-5 flex items-center justify-center md:justify-start">
                                <span className="px-4 py-1.5 rounded-full bg-primary/20 border border-primary/30 text-[10px] uppercase tracking-[0.2em] font-black text-primary animate-pulse">
                                    {role} Access
                                </span>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4 mb-8">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 }}
                        className="glass-dark rounded-3xl p-6 border border-white/5 text-center group hover:bg-white/5 transition-colors"
                    >
                        <p className="text-4xl font-black mb-1 group-hover:text-primary transition-colors">{stats?.total || 0}</p>
                        <p className="text-[10px] text-white/30 uppercase tracking-[0.2em] font-bold">Total Complaints</p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.4 }}
                        className="glass-dark rounded-3xl p-6 border border-white/5 text-center group hover:bg-white/5 transition-colors"
                    >
                        <p className="text-4xl font-black mb-1 group-hover:text-green-400 transition-colors">{stats?.resolved || 0}</p>
                        <p className="text-[10px] text-white/30 uppercase tracking-[0.2em] font-bold">Successfully Resolved</p>
                    </motion.div>
                </div>

                {/* Menu Items */}
                <div className="space-y-3">
                    {menuItems.map((item, idx) => (
                        <motion.button
                            key={idx}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.5 + idx * 0.05 }}
                            onClick={item.action}
                            className="w-full glass-dark hover:bg-white/[0.07] transition-all rounded-[1.5rem] p-5 flex items-center justify-between group border border-white/5"
                        >
                            <div className="flex items-center gap-5">
                                <div className={`h-12 w-12 rounded-2xl bg-white/5 flex items-center justify-center ${item.color || 'text-white/40'} group-hover:bg-primary/10 group-hover:text-primary transition-all duration-300`}>
                                    <item.icon className="h-6 w-6" />
                                </div>
                                <div className="text-left">
                                    <span className={`block font-bold text-base ${item.color || 'text-white/90'}`}>{item.label}</span>
                                    <span className="text-[10px] text-white/30 font-medium uppercase tracking-wider">{item.desc}</span>
                                </div>
                            </div>
                            <ChevronRight className="h-5 w-5 text-white/10 group-hover:text-white/40 group-hover:translate-x-1 transition-all" />
                        </motion.button>
                    ))}
                </div>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1 }}
                    className="mt-16 text-center"
                >
                    <div className="inline-block px-4 py-2 rounded-2xl bg-white/[0.02] border border-white/5">
                        <p className="text-[10px] text-white/20 tracking-[0.3em] uppercase font-bold">Voice4City v1.2.0 • Immersive Beta</p>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
