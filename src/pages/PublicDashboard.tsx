import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/i18n/LanguageContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { CheckCircle, Clock, FileText, TrendingUp, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { differenceInDays, parseISO } from 'date-fns';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#f97316', '#8b5cf6', '#ef4444'];
const categoryLabels: Record<string, string> = {
    road_infrastructure: 'Roads',
    water_supply: 'Water',
    electricity: 'Electricity',
    waste_management: 'Waste',
    public_safety: 'Safety',
    other: 'Other',
};

export default function PublicDashboard() {
    const { t } = useLanguage();
    const [complaints, setComplaints] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        supabase
            .from('complaints')
            .select('id, category, status, created_at, priority')
            .then(({ data }) => {
                setComplaints((data as any[]) || []);
                setLoading(false);
            });
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-background">
                <Navbar />
                <div className="flex justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-[3px] border-primary border-t-transparent" /></div>
            </div>
        );
    }

    const total = complaints.length;
    const resolved = complaints.filter(c => c.status === 'resolved').length;
    const inProgress = complaints.filter(c => c.status === 'in_progress').length;
    const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;

    // Avg resolution time (in days)
    const resolvedComplaints = complaints.filter(c => c.status === 'resolved');
    const avgDays = resolvedComplaints.length > 0
        ? Math.round(resolvedComplaints.reduce((acc, c) => acc + differenceInDays(new Date(), parseISO(c.created_at)), 0) / resolvedComplaints.length)
        : 0;

    // Category breakdown
    const catData = Object.entries(
        complaints.reduce((acc: Record<string, number>, c) => {
            acc[c.category] = (acc[c.category] || 0) + 1;
            return acc;
        }, {})
    ).map(([name, value]) => ({ name: categoryLabels[name] || name, value }));

    // Status breakdown
    const statusData = Object.entries(
        complaints.reduce((acc: Record<string, number>, c) => {
            acc[c.status] = (acc[c.status] || 0) + 1;
            return acc;
        }, {})
    ).map(([name, value]) => ({ name: name.replace('_', ' '), value: value as number }));

    // Priority breakdown
    const priorityData = [
        { name: 'Critical', value: complaints.filter(c => c.priority === 'critical').length, color: '#ef4444' },
        { name: 'High', value: complaints.filter(c => c.priority === 'high').length, color: '#f97316' },
        { name: 'Medium', value: complaints.filter(c => c.priority === 'medium').length, color: '#f59e0b' },
        { name: 'Low', value: complaints.filter(c => c.priority === 'low').length, color: '#10b981' },
    ].filter(p => p.value > 0);

    const statCards = [
        { icon: FileText, label: t('public_total'), value: total, color: 'from-blue-500 to-blue-600', bg: 'bg-blue-50' },
        { icon: CheckCircle, label: t('public_resolved'), value: resolved, color: 'from-emerald-500 to-teal-500', bg: 'bg-emerald-50' },
        { icon: TrendingUp, label: t('public_rate'), value: `${resolutionRate}%`, color: 'from-violet-500 to-violet-600', bg: 'bg-violet-50' },
        { icon: Clock, label: t('public_avg_days'), value: avgDays, color: 'from-amber-500 to-orange-500', bg: 'bg-amber-50' },
    ];

    return (
        <div className="min-h-screen bg-background pt-24">
            <Navbar />
            <div className="mx-auto max-w-7xl px-4 py-8">

                {/* Header */}
                <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                    <Link to="/" className="mb-4 flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors">
                        <ArrowLeft className="h-4 w-4" /> {t('back_home')}
                    </Link>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-sm text-muted-foreground">Live Data</span>
                    </div>
                    <h1 className="font-heading text-3xl font-bold">📊 {t('public_title')}</h1>
                    <p className="mt-1 text-muted-foreground">{t('public_subtitle')}</p>
                </motion.div>

                {/* Stat Cards */}
                <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {statCards.map((s, i) => (
                        <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                            <div className="rounded-2xl border bg-card shadow-card overflow-hidden">
                                <div className={`${s.bg} px-5 pt-5 pb-4`}>
                                    <div className={`mb-3 inline-flex rounded-xl bg-gradient-to-br ${s.color} p-2.5`}>
                                        <s.icon className="h-5 w-5 text-white" />
                                    </div>
                                    <p className="font-heading text-4xl font-bold">{s.value}</p>
                                </div>
                                <div className="px-5 py-3 border-t bg-card">
                                    <p className="text-sm font-medium text-muted-foreground">{s.label}</p>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Charts */}
                <div className="grid gap-6 lg:grid-cols-2 mb-8">

                    {/* Category Bar Chart */}
                    <div className="rounded-2xl border bg-card p-6 shadow-card">
                        <h3 className="font-heading font-semibold mb-4">{t('public_by_category')}</h3>
                        <ResponsiveContainer width="100%" height={220}>
                            <BarChart data={catData}>
                                <CartesianGrid strokeDasharray="3 3" className="opacity-50" />
                                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                                <YAxis tick={{ fontSize: 11 }} />
                                <Tooltip />
                                <Bar dataKey="value" fill="hsl(215,70%,38%)" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Status Pie */}
                    <div className="rounded-2xl border bg-card p-6 shadow-card">
                        <h3 className="font-heading font-semibold mb-4">{t('public_by_status')}</h3>
                        <ResponsiveContainer width="100%" height={220}>
                            <PieChart>
                                <Pie data={statusData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                                    {statusData.map((_, index) => (
                                        <Cell key={index} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Priority Breakdown */}
                {priorityData.length > 0 && (
                    <div className="rounded-2xl border bg-card p-6 shadow-card mb-8">
                        <h3 className="font-heading font-semibold mb-4">Priority Breakdown</h3>
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                            {priorityData.map(p => (
                                <div key={p.name} className="rounded-xl border p-4 text-center" style={{ borderColor: p.color + '40', background: p.color + '10' }}>
                                    <p className="font-heading text-3xl font-bold" style={{ color: p.color }}>{p.value}</p>
                                    <p className="text-xs text-muted-foreground mt-1">{p.name} Priority</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Government Accountability note */}
                <div className="rounded-2xl border bg-primary/5 p-6 text-center">
                    <p className="text-sm text-muted-foreground">
                        🏛️ This dashboard is publicly accessible to all citizens. Data refreshes in real-time from citizen reports.
                        <Link to="/heatmap" className="ml-2 font-medium text-primary hover:underline">View complaint heatmap →</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
