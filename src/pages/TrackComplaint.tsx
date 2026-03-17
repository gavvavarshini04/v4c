import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ComplaintStatusBadge from '@/components/ComplaintStatusBadge';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { Plus, Search, ChevronRight, FileText } from 'lucide-react';
import { motion } from 'framer-motion';

interface Complaint {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  created_at: string;
}

const categoryLabels: Record<string, string> = {
  road_infrastructure: 'Road & Infrastructure',
  water_supply: 'Water Supply',
  electricity: 'Electricity',
  waste_management: 'Waste Management',
  public_safety: 'Public Safety',
  other: 'Other',
};

const statusColors: Record<string, string> = {
  pending: 'from-amber-500/10 to-amber-500/5 border-amber-200',
  in_progress: 'from-blue-500/10 to-blue-500/5 border-blue-200',
  resolved: 'from-emerald-500/10 to-emerald-500/5 border-emerald-200',
  rejected: 'from-red-500/10 to-red-500/5 border-red-200',
};

export default function TrackComplaint() {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!user) return;
    supabase
      .from('complaints')
      .select('id, title, description, category, status, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setComplaints((data as any[]) || []);
        setLoading(false);
      });
  }, [user]);

  const filtered = complaints.filter(c =>
    c.title.toLowerCase().includes(search.toLowerCase()) ||
    (categoryLabels[c.category] || c.category).toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="mx-auto max-w-5xl px-4 py-8">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex items-start justify-between gap-4"
        >
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">My Complaints</p>
            <h1 className="font-heading text-3xl font-bold">Track Complaints</h1>
            <p className="mt-1 text-muted-foreground">
              {complaints.length > 0 ? `${complaints.length} complaint${complaints.length !== 1 ? 's' : ''} submitted` : 'No complaints yet'}
            </p>
          </div>
          <Button asChild className="gap-2 shrink-0">
            <Link to="/submit"><Plus className="h-4 w-4" /> New</Link>
          </Button>
        </motion.div>

        {/* Search */}
        {complaints.length > 0 && (
          <div className="relative mb-5">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by title or category..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 h-11"
            />
          </div>
        )}

        {/* List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-primary border-t-transparent" />
          </div>
        ) : complaints.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center py-16 text-center">
              <div className="mb-4 rounded-full bg-muted p-5">
                <FileText className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-heading font-semibold mb-2">No complaints yet</h3>
              <p className="mb-6 text-sm text-muted-foreground max-w-xs">
                You haven't submitted any civic complaints. Be the first to report an issue in your area.
              </p>
              <Button asChild>
                <Link to="/submit"><Plus className="h-4 w-4 mr-2" /> Submit Your First Complaint</Link>
              </Button>
            </CardContent>
          </Card>
        ) : filtered.length === 0 ? (
          <p className="py-10 text-center text-muted-foreground">No complaints match your search.</p>
        ) : (
          <div className="space-y-3">
            {filtered.map((c, i) => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link to={`/complaint/${c.id}`}>
                  <Card className={`shadow-card transition-all hover:shadow-elevated hover:border-primary/30 cursor-pointer bg-gradient-to-r ${statusColors[c.status] || ''}`}>
                    <CardContent className="flex items-center gap-4 p-4">
                      <div className="min-w-0 flex-1">
                        <p className="font-heading font-semibold text-sm">{c.title}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground truncate">
                          #{c.id.slice(0, 8).toUpperCase()} · {categoryLabels[c.category] || c.category}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        <div className="text-right hidden sm:block">
                          <p className="text-xs text-muted-foreground">{format(new Date(c.created_at), 'MMM d, yyyy')}</p>
                        </div>
                        <ComplaintStatusBadge status={c.status} />
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
