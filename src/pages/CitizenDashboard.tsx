import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Navbar from '@/components/Navbar';
import ComplaintStatusBadge from '@/components/ComplaintStatusBadge';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/i18n/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { FileText, Clock, CheckCircle, Plus, ChevronRight, MapPin, Search, AlertCircle, Sparkles, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, isWithinInterval, subDays } from 'date-fns';

const categoryLabels: Record<string, string> = {
  road_infrastructure: 'Road & Infrastructure',
  water_supply: 'Water Supply',
  electricity: 'Electricity',
  waste_management: 'Waste Management',
  public_safety: 'Public Safety',
  other: 'Other',
};

export default function CitizenDashboard() {
  const { user, profile } = useAuth();
  const { t } = useLanguage();

  const [allComplaints, setAllComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  const fetchData = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('complaints')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    setAllComplaints((data as any[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [user]);

  // Search and Filter Logic
  const filteredComplaints = useMemo(() => {
    return allComplaints.filter(c => {
      const matchesSearch = c.title.toLowerCase().includes(search.toLowerCase()) ||
        (categoryLabels[c.category] || c.category).toLowerCase().includes(search.toLowerCase());
      const matchesTab = activeTab === 'all' ||
        (activeTab === 'pending' && c.status !== 'resolved' && c.status !== 'rejected') ||
        (activeTab === 'resolved' && c.status === 'resolved');
      return matchesSearch && matchesTab;
    });
  }, [allComplaints, search, activeTab]);

  // Duplicate/Overlap Detection Logic
  // Find complaints in the same category within the last 3 days
  const overlaps = useMemo(() => {
    const results: Record<string, any[]> = {};
    allComplaints.forEach(c => {
      const date = new Date(c.created_at);
      const window = { start: subDays(date, 3), end: date };

      const matched = allComplaints.filter(other =>
        other.id !== c.id &&
        other.category === c.category &&
        isWithinInterval(new Date(other.created_at), window)
      );

      if (matched.length > 0) results[c.id] = matched;
    });
    return results;
  }, [allComplaints]);

  const stats = {
    total: allComplaints.length,
    resolved: allComplaints.filter(c => c.status === 'resolved').length,
    pending: allComplaints.filter(c => c.status !== 'resolved' && c.status !== 'rejected').length,
  };

  const statCards = [
    {
      icon: FileText,
      label: t('dash_total'),
      value: stats.total,
      color: 'from-blue-600 to-indigo-600',
      bg: 'bg-blue-50/50',
    },
    {
      icon: Clock,
      label: 'Active Reports',
      value: stats.pending,
      color: 'from-amber-500 to-orange-600',
      bg: 'bg-amber-50/50',
    },
    {
      icon: CheckCircle,
      label: 'Success Rate',
      value: stats.total > 0 ? Math.round((stats.resolved / stats.total) * 100) + '%' : '0%',
      color: 'from-emerald-500 to-teal-600',
      bg: 'bg-emerald-50/50',
    },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] pt-24">
      <Navbar />
      <div className="mx-auto max-w-5xl px-4 py-8">

        {/* Header */}
        <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <h1 className="font-heading text-4xl font-black tracking-tight text-slate-900">
              Citizen <span className="text-primary italic">Hub</span>
            </h1>
            <p className="mt-2 text-slate-500 font-medium">
              Hello, {profile?.name?.split(' ')[0] || 'Citizen'} · Viewing {allComplaints.length} localized reports
            </p>
          </motion.div>

          <div className="flex gap-3">
            <Button asChild className="h-12 px-6 rounded-2xl shadow-lg shadow-primary/20 gap-2 font-bold transition-all active:scale-95">
              <Link to="/submit"><Plus className="h-5 w-5" /> New Report</Link>
            </Button>
          </div>
        </div>

        {/* Premium Stats Grid */}
        <div className="mb-10 grid gap-6 sm:grid-cols-3">
          {statCards.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -4 }}
            >
              <Card className="border-none shadow-cinematic overflow-hidden bg-white/80 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`rounded-2xl bg-gradient-to-br ${s.color} p-3 shadow-lg shadow-indigo-500/10`}>
                      <s.icon className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{s.label}</span>
                  </div>
                  <p className="font-heading text-4xl font-black text-slate-900 leading-none">
                    {loading ? <span className="animate-pulse opacity-20">...</span> : s.value}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Integrated Search & Management Hub */}
        <div className="space-y-6">
          <Card className="border-none shadow-cinematic bg-white/80 backdrop-blur-sm overflow-hidden">
            <CardHeader className="border-b bg-slate-50/30 px-6 py-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-1.5 rounded-full bg-primary" />
                  <CardTitle className="font-heading text-xl font-bold">Manage Submissions</CardTitle>
                </div>

                <div className="relative w-full md:w-80">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search by title or category..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="pl-9 h-10 rounded-xl border-slate-200 bg-white/50 focus:bg-white transition-all"
                  />
                </div>
              </div>

              {/* Advanced Tab Filters */}
              <div className="mt-6 flex gap-2">
                {['all', 'pending', 'resolved'].map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === tab
                      ? 'bg-slate-900 text-white shadow-lg'
                      : 'bg-slate-100/50 text-slate-500 hover:bg-slate-200/50'
                      }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </CardHeader>

            <CardContent className="px-0">
              <div className="min-h-[400px]">
                {loading ? (
                  <div className="flex items-center justify-center py-20">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                  </div>
                ) : filteredComplaints.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-24 text-center">
                    <div className="h-20 w-20 rounded-full bg-slate-50 flex items-center justify-center mb-6">
                      <Filter className="h-8 w-8 text-slate-200" />
                    </div>
                    <h3 className="font-heading text-lg font-bold text-slate-900">No reports found</h3>
                    <p className="text-sm text-slate-500 max-w-xs mt-2 font-medium">
                      Try adjusting your search criteria or filing a new civic report.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    <AnimatePresence mode="popLayout">
                      {filteredComplaints.map((c, i) => {
                        const hasOverlap = overlaps[c.id];
                        return (
                          <motion.div
                            key={c.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="group relative"
                          >
                            <Link
                              to={`/complaint/${c.id}`}
                              className="flex items-center justify-between p-6 transition-all hover:bg-slate-50/50"
                            >
                              <div className="flex items-start gap-4 min-w-0 pr-4">
                                <div className="mt-1 h-3 w-3 rounded-full border-2 border-white shadow-sm ring-2 ring-primary bg-primary/20 shrink-0" />
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <p className="font-bold text-slate-900 truncate">{c.title}</p>
                                    {hasOverlap && (
                                      <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-black text-indigo-600 border border-indigo-100">
                                        <Sparkles className="h-3 w-3" /> OVERLAPPING ISSUE
                                      </span>
                                    )}
                                  </div>
                                  <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-bold text-slate-400">
                                    <span className="flex items-center gap-1">
                                      <FileText className="h-3 w-3" /> #{c.id.slice(0, 8).toUpperCase()}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <MapPin className="h-3 w-3" /> {categoryLabels[c.category] || c.category}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      {format(new Date(c.created_at), 'MMM d, yyyy')}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-4 shrink-0">
                                <ComplaintStatusBadge status={c.status} />
                                <div className="h-8 w-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-all shadow-sm">
                                  <ChevronRight className="h-4 w-4" />
                                </div>
                              </div>
                            </Link>

                            {/* Overlap Summary Hint */}
                            {hasOverlap && (
                              <div className="mx-6 mb-6 mt-[-1rem] rounded-xl bg-indigo-50/30 border border-indigo-100/50 p-4">
                                <div className="flex items-center gap-2 mb-1.5">
                                  <AlertCircle className="h-3.5 w-3.5 text-indigo-500" />
                                  <p className="text-[10px] font-black uppercase tracking-widest text-indigo-600">Similar Reports Detected</p>
                                </div>
                                <p className="text-xs text-slate-500 italic font-medium">
                                  Multiple reports in {categoryLabels[c.category]} category were filed within a 3-day window of this entry.
                                </p>
                              </div>
                            )}
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
