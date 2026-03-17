import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Link } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import { MapPin, Target, Activity, CheckCircle2, AlertCircle, ArrowRight, Layers, Info, Filter, LayoutDashboard } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';
import 'leaflet/dist/leaflet.css';

const STATUS_COLORS: Record<string, string> = {
    submitted: '#f59e0b',
    under_review: '#3b82f6',
    assigned: '#8b5cf6',
    in_progress: '#f97316',
    resolved: '#10b981',
    rejected: '#ef4444',
};

const categoryLabels: Record<string, string> = {
    road_infrastructure: 'Road & Infrastructure',
    water_supply: 'Water Supply',
    electricity: 'Electricity',
    waste_management: 'Waste Management',
    public_safety: 'Public Safety',
    other: 'Other',
};

interface Complaint {
    id: string;
    title: string;
    category: string;
    status: string;
    latitude: number;
    longitude: number;
}

// Sub-component to automatically fit map to markers
function FitBounds({ complaints }: { complaints: any[] }) {
    const map = useMap();
    useEffect(() => {
        if (complaints.length > 0) {
            const validPoints = complaints
                .map(c => [Number(c.latitude), Number(c.longitude)])
                .filter(p => !isNaN(p[0]) && !isNaN(p[1]) && (p[0] !== 0 || p[1] !== 0));

            if (validPoints.length > 0) {
                const bounds = L.latLngBounds(validPoints as L.LatLngExpression[]);
                map.fitBounds(bounds, { padding: [50, 50] });
            }
        }
    }, [complaints, map]);
    return null;
}

export default function ComplaintHeatmap() {
    const [complaints, setComplaints] = useState<Complaint[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        supabase
            .from('complaints')
            .select('id, title, category, status, latitude, longitude')
            .not('latitude', 'is', null)
            .then(({ data }) => {
                setComplaints((data as any[]) || []);
                setLoading(false);
            });
    }, []);

    const filtered = filter === 'all' ? complaints : complaints.filter(c => c.status === filter);

    const stats = {
        total: complaints.length,
        resolved: complaints.filter(c => c.status === 'resolved').length,
        inProgress: complaints.filter(c => c.status === 'in_progress').length,
        pending: complaints.filter(c => ['submitted', 'under_review', 'assigned'].includes(c.status)).length,
        rejected: complaints.filter(c => c.status === 'rejected').length,
    };

    return (
        <div className="min-h-screen bg-background pt-24">
            <Navbar />
            <div className="mx-auto max-w-7xl px-4 py-10">

                {/* Header Section */}
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div>
                            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary mb-4">
                                <Activity className="h-3 w-3" /> Live City Analytics
                            </div>
                            <h1 className="font-heading text-4xl font-extrabold tracking-tight sm:text-5xl">Complaint Heatmap</h1>
                            <p className="mt-4 max-w-2xl text-lg text-muted-foreground leading-relaxed">
                                A comprehensive visual representation of civic issues across Tirupati.
                                Real-time data helps authorities prioritize responses and optimize resources.
                            </p>
                        </div>
                        <Link
                            to="/admin"
                            className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground shadow-cinematic hover:bg-primary/90 transition-all hover:-translate-y-1 active:translate-y-0"
                        >
                            <LayoutDashboard className="h-4 w-4" /> Go to Dashboard
                        </Link>
                    </div>
                </motion.div>

                {/* Professional Stats Cards */}
                <div className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {[
                        { label: 'Total Logs', value: stats.total, color: 'bg-blue-500', icon: Target, gradient: 'from-blue-600/10 to-blue-400/5', border: 'border-blue-200/50' },
                        { label: 'Active Reports', value: stats.pending, color: 'bg-amber-500', icon: Activity, gradient: 'from-amber-600/10 to-amber-400/5', border: 'border-amber-200/50' },
                        { label: 'Work in Progress', value: stats.inProgress, color: 'bg-orange-500', icon: AlertCircle, gradient: 'from-orange-600/10 to-orange-400/5', border: 'border-orange-200/50' },
                        { label: 'Resolved Cases', value: stats.resolved, color: 'bg-emerald-500', icon: CheckCircle2, gradient: 'from-emerald-600/10 to-emerald-400/5', border: 'border-emerald-200/50' },
                    ].map((s, i) => (
                        <motion.div
                            key={s.label}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className={`group relative overflow-hidden rounded-2xl border bg-card p-6 shadow-card transition-all hover:shadow-elevated hover:-translate-y-1 ${s.border}`}
                        >
                            <div className={`absolute inset-0 bg-gradient-to-br ${s.gradient} transition-opacity group-hover:opacity-100`} />
                            <div className="relative flex items-center justify-between">
                                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${s.color} text-white shadow-lg`}>
                                    <s.icon className="h-6 w-6" />
                                </div>
                                <div className="text-right">
                                    <p className="text-3xl font-black tabular-nums tracking-tight">{s.value}</p>
                                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mt-1">{s.label}</p>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Map Control Bar (Glassmorphism inspired) */}
                <div className="mb-0 relative z-20 flex flex-col md:flex-row items-center justify-between gap-4 glass bg-white/60 p-5 rounded-t-3xl border-b-0">
                    <div className="flex items-center gap-3">
                        <div className="bg-primary/5 p-2 rounded-lg">
                            <Filter className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {['all', 'submitted', 'in_progress', 'resolved'].map(f => (
                                <button
                                    key={f}
                                    onClick={() => setFilter(f)}
                                    className={`relative px-4 py-2 text-xs font-bold transition-all rounded-xl border ${filter === f
                                        ? 'bg-primary text-primary-foreground border-primary shadow-lg scale-105'
                                        : 'bg-white/80 hover:bg-white text-muted-foreground border-border/50 hover:border-primary/20'
                                        }`}
                                >
                                    {f === 'all' ? 'All Complaints' : f.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="hidden lg:flex items-center gap-6 pr-4">
                        <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full animate-pulse bg-emerald-500" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Live Tracking</span>
                        </div>
                    </div>
                </div>

                {/* Map Container */}
                <div className="overflow-hidden rounded-b-3xl border border-t-0 shadow-cinematic bg-card relative" style={{ height: '620px' }}>
                    <div className="absolute top-4 right-4 z-[1000] space-y-2">
                        <div className="glass bg-white/90 p-4 rounded-2xl border shadow-lg space-y-3 min-w-[160px]">
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                <Layers className="h-3 w-3" /> Map Legend
                            </p>
                            <div className="space-y-2">
                                {Object.entries(STATUS_COLORS).map(([status, color]) => (
                                    <div key={status} className="flex items-center gap-3 group">
                                        <div className="h-3 w-3 rounded-full shadow-sm transition-transform group-hover:scale-125" style={{ background: color }} />
                                        <span className="text-[11px] font-bold capitalize text-slate-700">{status.replace('_', ' ')}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    {loading ? (
                        <div className="flex h-full items-center justify-center bg-muted">
                            <div className="h-8 w-8 animate-spin rounded-full border-3 border-primary border-t-transparent" />
                        </div>
                    ) : (
                        <MapContainer center={[13.6288, 79.4192]} zoom={11} className="h-full w-full" scrollWheelZoom>
                            <TileLayer
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            />
                            <FitBounds complaints={complaints} />
                            {filtered.map(c => {
                                const lat = Number(c.latitude);
                                const lng = Number(c.longitude);
                                if (isNaN(lat) || isNaN(lng)) return null;

                                return (
                                    <CircleMarker
                                        key={c.id}
                                        center={[lat, lng]}
                                        radius={10}
                                        pathOptions={{
                                            color: STATUS_COLORS[c.status] || '#666',
                                            fillColor: STATUS_COLORS[c.status] || '#666',
                                            fillOpacity: 0.7,
                                            weight: 2,
                                        }}
                                    >
                                        <Popup>
                                            <div className="p-1 min-w-[220px] font-body bg-white">
                                                <div className="flex items-center justify-between mb-3">
                                                    <span className="text-[10px] font-bold uppercase tracking-widest text-primary bg-primary/5 px-2 py-0.5 rounded">
                                                        {categoryLabels[c.category] || c.category}
                                                    </span>
                                                    <span className="text-[10px] font-medium text-muted-foreground select-all">#{c.id.slice(0, 8)}</span>
                                                </div>
                                                <h3 className="font-heading text-sm font-bold leading-tight mb-2 text-slate-900">{c.title}</h3>
                                                <div className="flex flex-col gap-3 mt-4">
                                                    <div className="flex items-center justify-between gap-4">
                                                        <span
                                                            className="rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm"
                                                            style={{ background: STATUS_COLORS[c.status] }}
                                                        >
                                                            {c.status.replace('_', ' ')}
                                                        </span>
                                                        <Link
                                                            to={`/complaint/${c.id}`}
                                                            className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:gap-2 transition-all group/link"
                                                        >
                                                            Inspect Details <ArrowRight className="h-3.5 w-3.5 group-hover/link:translate-x-0.5 transition-transform" />
                                                        </Link>
                                                    </div>
                                                </div>
                                            </div>
                                        </Popup>
                                    </CircleMarker>
                                );
                            })}
                        </MapContainer>
                    )}
                </div>

                {/* Refined Location Marking Section */}
                {complaints.filter(c => !c.latitude || !c.longitude || (Number(c.latitude) === 0 && Number(c.longitude) === 0)).length > 0 && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-12 rounded-3xl border border-amber-200 bg-amber-50/50 p-8 shadow-sm backdrop-blur-sm">
                        <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
                            <div className="flex items-start gap-4 max-w-2xl">
                                <div className="h-12 w-12 shrink-0 flex items-center justify-center rounded-2xl bg-amber-100 text-amber-600 shadow-sm border border-amber-200">
                                    <MapPin className="h-6 w-6" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-amber-900 leading-tight">Address Untracked Reports</h3>
                                    <p className="mt-2 text-sm text-amber-800/80 leading-relaxed font-medium">
                                        We've identified {complaints.filter(c => !c.latitude || !c.longitude || (Number(c.latitude) === 0 && Number(c.longitude) === 0)).length} reports missing geographical data.
                                        Please mark their exact location to help city officers reach the site faster.
                                    </p>
                                </div>
                            </div>
                            <Link
                                to={`/complaint/${complaints.find(c => !c.latitude || !c.longitude || (Number(c.latitude) === 0 && Number(c.longitude) === 0))?.id}?editLocation=true`}
                                className="group inline-flex items-center gap-3 rounded-2xl bg-amber-600 px-6 py-4 text-sm font-black text-white shadow-lg shadow-amber-600/20 hover:bg-amber-700 transition-all hover:translate-x-1 active:translate-x-0"
                            >
                                Process Next Entry <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
}
