import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ComplaintStatusBadge from '@/components/ComplaintStatusBadge';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { FileText, CheckCircle, Clock, AlertTriangle, Plus, Eye, ImageIcon, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const categoryLabels: Record<string, string> = {
  road_infrastructure: 'Road & Infra',
  water_supply: 'Water',
  electricity: 'Electricity',
  waste_management: 'Waste',
  public_safety: 'Safety',
  other: 'Other',
};

const COLORS = ['hsl(215,70%,38%)', 'hsl(160,55%,40%)', 'hsl(38,92%,50%)', 'hsl(0,72%,51%)', 'hsl(200,80%,50%)', 'hsl(270,50%,50%)'];

export default function AdminDashboard() {
  const { profile } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [complaints, setComplaints] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [officers, setOfficers] = useState<any[]>([]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [newDeptName, setNewDeptName] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    const [cRes, dRes, oRes] = await Promise.all([
      supabase.from('complaints').select('*').order('created_at', { ascending: false }),
      supabase.from('departments').select('*'),
      supabase.from('user_roles').select('user_id, role').eq('role', 'officer'),
    ]);
    setComplaints((cRes.data as any[]) || []);
    setDepartments((dRes.data as any[]) || []);

    if (oRes.error) {
      toast.error('Failed to load officers: ' + oRes.error.message);
      setLoading(false);
      return;
    }

    if (oRes.data && oRes.data.length > 0) {
      const ids = oRes.data.map((o: any) => o.user_id);
      const { data: profiles, error: pError } = await supabase.from('profiles').select('id, name, email, department_id').in('id', ids);
      if (pError) toast.error('Failed to load profiles');
      setOfficers(profiles || []);
    } else {
      setOfficers([]);
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = complaints.filter((c) => {
    if (filterStatus !== 'all' && c.status !== filterStatus) return false;
    if (filterCategory !== 'all' && c.category !== filterCategory) return false;
    return true;
  });

  const activeCriticalComplaints = complaints.filter(
    c => c.priority === 'critical' && c.status !== 'resolved'
  );

  const stats = {
    total: complaints.length,
    resolved: complaints.filter(c => c.status === 'resolved').length,
    pending: complaints.filter(c => c.status !== 'resolved').length,
  };

  const categoryData = Object.entries(
    complaints.reduce((acc: Record<string, number>, c) => {
      acc[c.category] = (acc[c.category] || 0) + 1;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name: categoryLabels[name] || name, value }));

  const statusData = Object.entries(
    complaints.reduce((acc: Record<string, number>, c) => {
      acc[c.status] = (acc[c.status] || 0) + 1;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name: name.replace('_', ' '), value }));

  const assignOfficer = async (complaintId: string, officerId: string) => {
    const { error } = await supabase.from('complaints').update({ assigned_officer: officerId, status: 'assigned' } as any).eq('id', complaintId);
    if (error) toast.error('Failed to assign');
    else { toast.success('Officer assigned'); fetchData(); }
  };

  const assignDepartment = async (complaintId: string, deptId: string) => {
    const { error } = await supabase.from('complaints').update({ department_id: deptId } as any).eq('id', complaintId);
    if (error) toast.error('Failed to assign department');
    else { toast.success('Department assigned'); fetchData(); }
  };

  const createDepartment = async () => {
    if (!newDeptName.trim()) return;
    const { error } = await supabase.from('departments').insert({ name: newDeptName.trim() } as any);
    if (error) toast.error(error.message);
    else { toast.success('Department created'); setNewDeptName(''); fetchData(); }
  };

  const updateOfficerDepartment = async (officerId: string, deptId: string) => {
    const { error } = await supabase.from('profiles').update({ department_id: deptId === 'none' ? null : deptId } as any).eq('id', officerId);
    if (error) toast.error('Failed to update officer');
    else { toast.success("Officer's department updated"); fetchData(); }
  };

  const statCards = [
    { icon: FileText, label: 'Total', value: stats.total, color: 'text-primary' },
    { icon: Clock, label: 'Pending', value: stats.pending, color: 'text-warning' },
    { icon: CheckCircle, label: 'Resolved', value: stats.resolved, color: 'text-success' },
  ];

  if (loading) return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="flex justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background pt-24">
      <Navbar />
      <div className="mx-auto max-w-7xl px-4 py-8">
        <h1 className="mb-2 font-heading text-2xl font-bold">Admin Dashboard</h1>
        <p className="mb-8 text-muted-foreground">Welcome, {profile?.name || 'Admin'}</p>

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
                    There are {activeCriticalComplaints.length} active emergency {activeCriticalComplaints.length === 1 ? 'complaint' : 'complaints'} awaiting resolution.
                  </p>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    const el = document.getElementById('complaint-tabs-list');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                    setSearchParams({ tab: 'complaints' });
                  }}
                  className="font-bold uppercase tracking-tight"
                >
                  View All
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stats */}
        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          {statCards.map((s) => (
            <Card key={s.label} className="shadow-card">
              <CardContent className="flex items-center gap-4 pt-6">
                <div className={`rounded-lg bg-muted p-3 ${s.color}`}><s.icon className="h-6 w-6" /></div>
                <div>
                  <p className="text-2xl font-bold">{s.value}</p>
                  <p className="text-sm text-muted-foreground">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs value={searchParams.get('tab') || 'complaints'} onValueChange={(v) => setSearchParams({ tab: v })}>
          <TabsList className="mb-6">
            <TabsTrigger value="complaints">Complaints</TabsTrigger>
            <TabsTrigger value="departments">Departments</TabsTrigger>
            <TabsTrigger value="officers">Officers</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="complaints">
            {/* Filters */}
            <div className="mb-4 flex flex-wrap gap-3">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="under_review">Under Review</SelectItem>
                  <SelectItem value="assigned">Assigned</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-44"><SelectValue placeholder="Category" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="road_infrastructure">Road & Infra</SelectItem>
                  <SelectItem value="water_supply">Water Supply</SelectItem>
                  <SelectItem value="electricity">Electricity</SelectItem>
                  <SelectItem value="waste_management">Waste Mgmt</SelectItem>
                  <SelectItem value="public_safety">Public Safety</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div id="complaint-tabs-list" className="space-y-3">
              {filtered.map((c) => (
                <Card
                  key={c.id}
                  className={`transition-all ${c.priority === 'critical' && c.status !== 'resolved'
                    ? 'border-red-400 bg-red-50/50 shadow-md ring-1 ring-red-200'
                    : 'shadow-card hover:shadow-elevated'
                    }`}
                >
                  <CardContent className="p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <p className="font-heading font-semibold">{c.title}</p>
                          {c.priority && c.priority !== 'medium' && (
                            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold border ${c.priority === 'critical' ? 'bg-red-50 text-red-700 border-red-200' :
                              c.priority === 'high' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                                'bg-emerald-50 text-emerald-700 border-emerald-200'
                              }`}>
                              {c.priority === 'critical' && <AlertTriangle className="h-3 w-3" />}
                              {c.priority}
                            </span>
                          )}
                          {c.image_url && (
                            <span className="inline-flex items-center gap-1 rounded-full border bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                              <ImageIcon className="h-3 w-3" /> Photo
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">
                          #{c.id.slice(0, 8).toUpperCase()} · {categoryLabels[c.category] || c.category} · {format(new Date(c.created_at), 'MMM d, yyyy')}
                        </p>
                        {c.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">{c.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <ComplaintStatusBadge status={c.status} />
                        <Link
                          to={`/complaint/${c.id}`}
                          className="flex items-center gap-1 rounded-md border bg-muted px-2.5 py-1.5 text-xs font-medium hover:bg-primary/10 hover:border-primary/40 hover:text-primary transition-colors"
                        >
                          <Eye className="h-3.5 w-3.5" /> View
                        </Link>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 pt-3 border-t">
                      <Select onValueChange={(v) => assignDepartment(c.id, v)} value={c.department_id || ''}>
                        <SelectTrigger className="h-8 w-40 text-xs"><SelectValue placeholder="Assign Dept." /></SelectTrigger>
                        <SelectContent>
                          {departments.map((d) => (
                            <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select
                        onValueChange={(v) => assignOfficer(c.id, v)}
                        value={c.assigned_officer || ''}
                      >
                        <SelectTrigger className="h-8 w-40 text-xs">
                          <SelectValue placeholder="Assign Officer" />
                        </SelectTrigger>
                        <SelectContent>
                          {officers
                            .filter(o => !c.department_id || o.department_id === c.department_id)
                            .map((o) => (
                              <SelectItem key={o.id} value={o.id}>
                                {o.name || o.email}
                                {o.department_id && !c.department_id && ` (${departments.find(d => d.id === o.department_id)?.name})`}
                              </SelectItem>
                            ))}
                          {officers.filter(o => !c.department_id || o.department_id === c.department_id).length === 0 && (
                            <>
                              <SelectItem disabled value="none" className="text-[10px] opacity-50">No officers in this dept.</SelectItem>
                              <div className="border-t my-1" />
                              <SelectItem disabled value="all_header" className="text-[10px] font-bold uppercase tracking-widest px-2">Global Officers</SelectItem>
                              {officers.map(o => (
                                <SelectItem key={o.id + '_all'} value={o.id}>
                                  {o.name || o.email} ({departments.find(d => d.id === o.department_id)?.name || 'Global'})
                                </SelectItem>
                              ))}
                            </>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {filtered.length === 0 && (
                <p className="py-8 text-center text-muted-foreground">No complaints match filters.</p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="officers">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="font-heading">Manage Officers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {officers.map((o) => (
                    <div key={o.id} className="flex flex-wrap items-center justify-between gap-4 rounded-lg border p-4">
                      <div>
                        <p className="font-semibold text-foreground">{o.name || 'Unnamed'}</p>
                        <p className="text-sm text-muted-foreground">{o.email}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Label className="text-xs text-muted-foreground">Department:</Label>
                        <Select onValueChange={(v) => updateOfficerDepartment(o.id, v)} value={o.department_id || 'none'}>
                          <SelectTrigger className="h-9 w-48 text-sm"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">No Department</SelectItem>
                            {departments.map((d) => (
                              <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  ))}
                  {officers.length === 0 && <p className="py-8 text-center text-muted-foreground">No officers found.</p>}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="departments">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="font-heading">Manage Departments</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input value={newDeptName} onChange={(e) => setNewDeptName(e.target.value)} placeholder="New department name" />
                  <Button onClick={createDepartment} className="gap-2"><Plus className="h-4 w-4" /> Add</Button>
                </div>
                <div className="space-y-2">
                  {departments.map((d) => (
                    <div key={d.id} className="flex items-center justify-between rounded-lg border p-3">
                      <span className="font-medium">{d.name}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="shadow-card">
                <CardHeader><CardTitle className="font-heading">Complaints by Category</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={categoryData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" fill="hsl(215,70%,38%)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              <Card className="shadow-card">
                <CardHeader><CardTitle className="font-heading">Complaints by Status</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie data={statusData} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                        {statusData.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
