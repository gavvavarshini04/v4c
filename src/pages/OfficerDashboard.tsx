import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import ComplaintStatusBadge from '@/components/ComplaintStatusBadge';
import MapPicker from '@/components/MapPicker';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ClipboardList, Eye, AlertTriangle, Search, HardHat, Droplets, Zap, Trash2, ShieldAlert, HelpCircle, Calendar, User, Tag, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

const categoryIcons: Record<string, any> = {
  road_infrastructure: HardHat,
  water_supply: Droplets,
  electricity: Zap,
  waste_management: Trash2,
  public_safety: ShieldAlert,
  other: HelpCircle,
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
  description: string;
  category: string;
  status: string;
  latitude: number | null;
  longitude: number | null;
  image_url: string | null;
  remarks: string | null;
  priority: string | null;
  created_at: string;
}

export default function OfficerDashboard() {
  const { user, profile } = useAuth();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [selected, setSelected] = useState<Complaint | null>(null);
  const [newStatus, setNewStatus] = useState('');
  const [remarks, setRemarks] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [updating, setUpdating] = useState(false);

  const fetchComplaints = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('complaints')
      .select('*')
      .eq('assigned_officer', user.id)
      .order('created_at', { ascending: false });
    setComplaints((data as any[]) || []);
  };

  const activeCriticalComplaints = complaints.filter(
    c => c.priority === 'critical' && c.status !== 'resolved'
  );

  const filteredComplaints = complaints.filter(c =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => { fetchComplaints(); }, [user]);

  const handleUpdate = async () => {
    if (!selected || !newStatus) return;
    setUpdating(true);
    const updates: any = { status: newStatus };
    if (remarks.trim()) updates.remarks = remarks.trim();
    const { error } = await supabase.from('complaints').update(updates).eq('id', selected.id);
    setUpdating(false);
    if (error) {
      toast.error('Failed to update');
    } else {
      toast.success('Complaint updated');
      setSelected(null);
      setNewStatus('');
      setRemarks('');
      fetchComplaints();
    }
  };

  return (
    <div className="min-h-screen bg-background pt-24">
      <Navbar />
      <div className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="mb-2 font-heading text-2xl font-bold">Officer Dashboard</h1>
        <p className="mb-8 text-muted-foreground">Welcome, {profile?.name || 'Officer'}</p>

        {/* Emergency Alert Banner */}
        <AnimatePresence>
          {activeCriticalComplaints.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-8 overflow-hidden"
            >
              <div className="flex items-center gap-4 rounded-xl border-2 border-red-500 bg-red-50 p-4 shadow-lg animate-flash-red">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-600 text-white animate-pulse">
                  <AlertTriangle className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-red-700">🚨 EMERGENCY ATTENTION REQUIRED</h3>
                  <p className="text-red-600">
                    You have {activeCriticalComplaints.length} active emergency {activeCriticalComplaints.length === 1 ? 'complaint' : 'complaints'} that {activeCriticalComplaints.length === 1 ? 'needs' : 'need'} immediate action.
                  </p>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    const firstCritical = activeCriticalComplaints[0];
                    setSelected(firstCritical);
                    setNewStatus(firstCritical.status);
                    setRemarks(firstCritical.remarks || '');
                    window.scrollTo({ top: 300, behavior: 'smooth' });
                  }}
                  className="font-bold uppercase tracking-tight"
                >
                  Action Now
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Complaint List */}
          <Card className="flex flex-col border-none bg-transparent shadow-none lg:h-[calc(100vh-250px)]">
            <div className="mb-4 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h2 className="flex items-center gap-2 font-heading text-xl font-semibold">
                  <ClipboardList className="h-5 w-5 text-primary" />
                  Assigned ({filteredComplaints.length})
                </h2>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search complaints..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-10 pl-9 shadow-sm transition-all focus:ring-2 focus:ring-primary/20 hover:border-primary/50"
                />
              </div>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto pr-2 custom-scrollbar">
              {filteredComplaints.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground opacity-60">
                  <Search className="mb-2 h-10 w-10" />
                  <p>No complaints found</p>
                </div>
              ) : (
                <AnimatePresence mode="popLayout">
                  {filteredComplaints.map((c) => {
                    const CategoryIcon = categoryIcons[c.category] || HelpCircle;
                    const isSelected = selected?.id === c.id;
                    const isCritical = c.priority === 'critical' && c.status !== 'resolved';

                    return (
                      <motion.button
                        layout
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        key={c.id}
                        onClick={() => { setSelected(c); setNewStatus(c.status); setRemarks(c.remarks || ''); }}
                        className={`group relative w-full overflow-hidden rounded-xl border p-4 text-left transition-all hover:shadow-md ${isCritical
                          ? 'border-red-400 bg-red-50/50 hover:bg-red-50'
                          : isSelected
                            ? 'border-primary bg-primary/5 shadow-sm ring-1 ring-primary/20'
                            : 'bg-card hover:border-primary/30 hover:bg-muted/50'
                          }`}
                      >
                        {isSelected && !isCritical && <div className="absolute left-0 top-0 h-full w-1 bg-primary" />}
                        {isCritical && <div className="absolute left-0 top-0 h-full w-1 bg-red-500 animate-pulse" />}

                        <div className="flex items-start gap-4">
                          <div className={`mt-1 hidden shrink-0 rounded-lg p-2 sm:flex ${isCritical ? 'bg-red-100 text-red-600' : isSelected ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors'
                            }`}>
                            <CategoryIcon className="h-5 w-5" />
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="mb-1 flex items-center justify-between gap-2">
                              <p className={`truncate font-semibold ${isSelected || isCritical ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground'}`}>
                                {c.title}
                              </p>
                              <div className="flex shrink-0 items-center gap-1.5">
                                {isCritical && (
                                  <Badge variant="destructive" className="h-5 px-1.5 text-[10px] uppercase font-black animate-pulse">Critical</Badge>
                                )}
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {format(new Date(c.created_at), 'MMM d, yyyy')}
                              </span>
                              <span className="flex items-center gap-1 capitalize">
                                <Tag className="h-3 w-3" />
                                {c.category.replace('_', ' ')}
                              </span>
                            </div>
                          </div>
                          <div className="shrink-0 flex items-center">
                            <ComplaintStatusBadge status={c.status} />
                          </div>
                        </div>
                      </motion.button>
                    );
                  })}
                </AnimatePresence>
              )}
            </div>
          </Card>

          {/* Detail / Update */}
          <div className="lg:h-[calc(100vh-250px)] lg:overflow-y-auto lg:pr-2 custom-scrollbar">
            <AnimatePresence mode="wait">
              {selected ? (
                <motion.div
                  key={selected.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card className="border-none shadow-elevated overflow-hidden ring-1 ring-border/50">
                    <div className={`h-2 w-full ${selected.priority === 'critical' ? 'bg-red-500' : 'bg-primary'}`} />
                    <CardHeader className="pb-4">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="space-y-1.5">
                          <CardTitle className="font-heading text-2xl tracking-tight">{selected.title}</CardTitle>
                          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1">
                              <Tag className="h-3.5 w-3.5" /> {categoryLabels[selected.category] || selected.category}
                            </span>
                            <span className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1">
                              <Calendar className="h-3.5 w-3.5" /> {format(new Date(selected.created_at), 'PPP')}
                            </span>
                            <span className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1">
                              <User className="h-3.5 w-3.5" /> ID: {selected.id.slice(0, 8).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <ComplaintStatusBadge status={selected.status} />
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-6">
                      <div className="rounded-xl bg-muted/30 p-4 border border-border/50">
                        <h3 className="mb-2 text-sm font-semibold text-foreground uppercase tracking-wider">Description</h3>
                        <p className="text-sm leading-relaxed text-muted-foreground">{selected.description}</p>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        {selected.image_url && (
                          <div className="space-y-2">
                            <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                              <Eye className="h-4 w-4" /> Evidence
                            </h3>
                            <div className="group relative overflow-hidden rounded-xl border aspect-video shadow-sm transition-all hover:shadow-md cursor-zoom-in">
                              <img src={selected.image_url} alt="Issue evidence" className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <span className="bg-background/80 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold">Zoom</span>
                              </div>
                            </div>
                          </div>
                        )}

                        {selected.latitude && selected.longitude && (
                          <div className="space-y-2">
                            <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                              <MapPin className="h-4 w-4" /> Location
                            </h3>
                            <div className="overflow-hidden rounded-xl border shadow-sm aspect-video h-auto">
                              <MapPicker position={[selected.latitude, selected.longitude]} onPositionChange={() => { }} readonly />
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="rounded-2xl border-2 border-primary/10 bg-primary/5 p-6 shadow-sm">
                        <h3 className="mb-4 font-heading text-lg font-bold text-primary flex items-center gap-2">
                          <Zap className="h-5 w-5" /> Take Action
                        </h3>
                        <div className="space-y-4">
                          <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                              <Label className="text-xs font-bold uppercase text-muted-foreground">Update Status</Label>
                              <Select value={newStatus} onValueChange={setNewStatus}>
                                <SelectTrigger className="h-11 bg-background shadow-sm"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="under_review">Under Review</SelectItem>
                                  <SelectItem value="in_progress">In Progress</SelectItem>
                                  <SelectItem value="resolved">Resolved</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label className="text-xs font-bold uppercase text-muted-foreground">Remarks (Optional)</Label>
                              <Input
                                value={remarks}
                                onChange={(e) => setRemarks(e.target.value)}
                                placeholder="Brief update note..."
                                className="h-11 bg-background shadow-sm"
                              />
                            </div>
                          </div>
                          <Button onClick={handleUpdate} disabled={updating} className="w-full h-11 text-base font-bold shadow-md transition-all hover:scale-[1.01]">
                            {updating ? (
                              <div className="flex items-center gap-2"><div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> Updating...</div>
                            ) : (
                              'Update Complaint status'
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex h-full flex-col items-center justify-center text-muted-foreground"
                >
                  <div className="rounded-full bg-muted p-8 mb-4 border border-dashed border-border/50">
                    <Eye className="h-12 w-12 opacity-20" />
                  </div>
                  <h3 className="font-heading text-xl font-semibold mb-2">Review Case Details</h3>
                  <p className="max-w-[280px] text-center text-sm leading-relaxed">
                    Select a complaint from the list on the left to view evidence, location, and update status.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
