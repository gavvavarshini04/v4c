import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import ComplaintStatusBadge from '@/components/ComplaintStatusBadge';
import FeedbackForm from '@/components/FeedbackForm';
import MapPicker from '@/components/MapPicker';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { ArrowLeft, MapPin, Calendar, Tag, User, MessageSquare, Image as ImageIcon, CheckCircle, Clock, AlertCircle, FileSearch, CircleDot, ThumbsUp, Sparkles, AlertTriangle, Trash2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

const categoryLabels: Record<string, string> = {
  road_infrastructure: 'Road & Infrastructure',
  water_supply: 'Water Supply',
  electricity: 'Electricity',
  waste_management: 'Waste Management',
  public_safety: 'Public Safety',
  other: 'Other',
};

const statusIcons: Record<string, typeof CheckCircle> = {
  submitted: CircleDot,
  under_review: FileSearch,
  assigned: User,
  in_progress: Clock,
  resolved: CheckCircle,
};

interface HistoryEntry {
  id: string;
  status: string;
  remarks: string | null;
  created_at: string;
  changed_by: string | null;
}

interface Complaint {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  latitude: number | null;
  longitude: number | null;
  image_url: string | null;
  user_id: string;
  department_id: string | null;
  assigned_officer: string | null;
  remarks: string | null;
  created_at: string;
}

export default function ComplaintDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [departmentName, setDepartmentName] = useState<string | null>(null);
  const [officerName, setOfficerName] = useState<string | null>(null);
  const [feedbackGiven, setFeedbackGiven] = useState(false);
  const [loading, setLoading] = useState(true);
  const [voteCount, setVoteCount] = useState(0);
  const [hasVoted, setHasVoted] = useState(false);
  const [voting, setVoting] = useState(false);
  const [isEditingLocation, setIsEditingLocation] = useState(false);
  const [tempPosition, setTempPosition] = useState<[number, number] | null>(null);
  const [savingLocation, setSavingLocation] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const loc = useLocation();

  const fetchData = async () => {
    if (!id || !user) return;

    const [compRes, histRes] = await Promise.all([
      supabase.from('complaints').select('*').eq('id', id).single(),
      supabase.from('complaint_status_history').select('*').eq('complaint_id', id).order('created_at', { ascending: true }),
    ]);

    if (compRes.data) {
      const c = compRes.data as any;
      setComplaint(c);

      // Fetch department name
      if (c.department_id) {
        const { data: dept } = await supabase.from('departments').select('name').eq('id', c.department_id).single();
        if (dept) setDepartmentName(dept.name);
      }

      // Fetch officer name
      if (c.assigned_officer) {
        const { data: officer } = await supabase.from('profiles').select('name').eq('id', c.assigned_officer).single();
        if (officer) setOfficerName(officer.name);
      }

      // Check if feedback already given
      const { data: fb } = await supabase.from('feedback').select('id').eq('complaint_id', id).eq('user_id', user.id).single();
      if (fb) setFeedbackGiven(true);

      // Fetch vote count and user vote (cast to any until migration updates types)
      const db = supabase as any;
      const [{ count }, userVote] = await Promise.all([
        db.from('complaint_votes').select('*', { count: 'exact', head: true }).eq('complaint_id', id),
        db.from('complaint_votes').select('id').eq('complaint_id', id).eq('user_id', user.id).single(),
      ]);
      setVoteCount(count || 0);
      setHasVoted(!!userVote.data);
    }

    setHistory((histRes.data as any[]) || []);
    setLoading(false);

    // Check if we should start in edit mode
    const params = new URLSearchParams(loc.search);
    if (params.get('editLocation') === 'true' && compRes.data) {
      setIsEditingLocation(true);
      if (compRes.data.latitude && compRes.data.longitude) {
        setTempPosition([compRes.data.latitude, compRes.data.longitude]);
      } else {
        setTempPosition([13.6288, 79.4192]); // Default to Tirupati
      }
    }
  };

  const handleVote = async () => {
    if (!user || !id) return;
    setVoting(true);
    const db = supabase as any;
    if (hasVoted) {
      await db.from('complaint_votes').delete().eq('complaint_id', id).eq('user_id', user.id);
      setHasVoted(false);
      setVoteCount(v => Math.max(0, v - 1));
    } else {
      await db.from('complaint_votes').insert({ complaint_id: id, user_id: user.id });
      setHasVoted(true);
      setVoteCount(v => v + 1);
    }
    setVoting(false);
  };

  const handleSaveLocation = async () => {
    if (!id || !tempPosition) return;
    setSavingLocation(true);
    try {
      const { error } = await supabase
        .from('complaints')
        .update({
          latitude: tempPosition[0],
          longitude: tempPosition[1]
        })
        .eq('id', id);

      if (error) throw error;
      toast.success('Location updated successfully!');
      setIsEditingLocation(false);
      fetchData();
    } catch (err: any) {
      toast.error('Failed to update location: ' + err.message);
    } finally {
      setSavingLocation(false);
    }
  };

  const handleDelete = async () => {
    if (!id || !user) return;
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('complaints')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Complaint deleted successfully');
      navigate('/track');
    } catch (err: any) {
      toast.error('Failed to delete complaint: ' + err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  useEffect(() => { fetchData(); }, [id, user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </div>
    );
  }

  if (!complaint) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="mx-auto max-w-3xl px-4 py-20 text-center">
          <AlertCircle className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <h2 className="mb-2 font-heading text-xl font-bold">Complaint Not Found</h2>
          <p className="mb-6 text-muted-foreground">This complaint doesn't exist or you don't have access.</p>
          <Button onClick={() => navigate('/track')}>Back to Complaints</Button>
        </div>
      </div>
    );
  }

  const allStatuses = ['submitted', 'under_review', 'assigned', 'in_progress', 'resolved'];
  const currentIndex = allStatuses.indexOf(complaint.status);

  return (
    <div className="min-h-screen bg-background pt-24">
      <Navbar />
      <div className="mx-auto max-w-5xl px-4 py-8">
        {/* Back button */}
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4 gap-2 text-muted-foreground">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>

        {/* Header Section */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="font-heading text-2xl font-bold sm:text-3xl">{complaint.title}</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                ID: {complaint.id.slice(0, 8).toUpperCase()} · Filed on {format(new Date(complaint.created_at), 'MMMM d, yyyy')}
              </p>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <ComplaintStatusBadge status={complaint.status} />

              {/* Community Vote Button */}
              <button
                onClick={handleVote}
                disabled={voting}
                className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-all ${hasVoted ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-background hover:border-primary/40 hover:bg-primary/5'}`}
              >
                <ThumbsUp className={`h-4 w-4 ${hasVoted ? 'fill-primary' : ''}`} />
                <span>{voteCount}</span>
              </button>

              {/* Owner Actions (Delete) */}
              {user && complaint.user_id === user.id && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-9 w-9 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="rounded-3xl border-none shadow-cinematic">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="font-heading text-xl">Delete Complaint?</AlertDialogTitle>
                      <AlertDialogDescription className="text-muted-foreground">
                        This action cannot be undone. This will permanently delete your report
                        "<b>{complaint.title}</b>" from our servers.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-6 flex gap-3">
                      <AlertDialogCancel className="rounded-xl border-none bg-slate-100 font-bold hover:bg-slate-200">
                        Cancel
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDelete}
                        className="rounded-xl bg-destructive font-bold text-white shadow-lg shadow-destructive/20 hover:bg-destructive/90"
                      >
                        {isDeleting ? "Deleting..." : "Confirm Delete"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </div>

          {/* AI Summary and Priority Badges */}
          {((complaint as any).ai_summary || (complaint as any).priority) && (
            <div className="mt-3 flex flex-wrap gap-2">
              {(complaint as any).priority && (complaint as any).priority !== 'medium' && (
                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold border ${(complaint as any).priority === 'critical' ? 'bg-red-50 text-red-700 border-red-200' :
                  (complaint as any).priority === 'high' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                    'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}>
                  {(complaint as any).priority === 'critical' ? <AlertTriangle className="h-3 w-3" /> : <Sparkles className="h-3 w-3" />}
                  {(complaint as any).priority === 'critical' ? '🚨 Critical Priority' : `${(complaint as any).priority} priority`}
                </span>
              )}
              {(complaint as any).ai_summary && (
                <span className="inline-flex items-center gap-1 rounded-full border bg-primary/5 px-2.5 py-1 text-xs text-muted-foreground">
                  <Sparkles className="h-3 w-3 text-primary" /> AI: {(complaint as any).ai_summary}
                </span>
              )}
              {(complaint as any).image_issue_type && (
                <span className="inline-flex items-center gap-1 rounded-full border bg-emerald-50 px-2.5 py-1 text-xs text-emerald-700">
                  📷 Detected: {(complaint as any).image_issue_type}
                </span>
              )}
            </div>
          )}
        </motion.div>

        {/* Progress Bar */}
        <Card className="mb-6 shadow-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              {allStatuses.map((s, i) => {
                const Icon = statusIcons[s] || CircleDot;
                const isActive = i <= currentIndex;
                const isCurrent = s === complaint.status;
                return (
                  <div key={s} className="flex flex-1 flex-col items-center">
                    <div className="relative flex items-center justify-center">
                      {i > 0 && (
                        <div className={`absolute right-full h-0.5 w-full ${i <= currentIndex ? 'bg-primary' : 'bg-border'}`}
                          style={{ width: 'calc(100% + 1rem)', right: '50%', transform: 'translateX(-50%)' }}
                        />
                      )}
                      <div className={`relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors ${isCurrent ? 'border-primary bg-primary text-primary-foreground' :
                        isActive ? 'border-primary bg-primary/10 text-primary' :
                          'border-border bg-muted text-muted-foreground'
                        }`}>
                        <Icon className="h-5 w-5" />
                      </div>
                    </div>
                    <span className={`mt-2 text-center text-xs font-medium ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                      {s.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main content */}
          <div className="space-y-6 lg:col-span-2">
            {/* Description */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="font-heading text-lg">Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed">{complaint.description}</p>
              </CardContent>
            </Card>

            {/* Image */}
            {complaint.image_url && (
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 font-heading text-lg">
                    <ImageIcon className="h-5 w-5" /> Attached Image
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <img src={complaint.image_url} alt="Complaint" className="w-full rounded-lg object-cover" style={{ maxHeight: '400px' }} />
                </CardContent>
              </Card>
            )}

            {/* Map Section */}
            <Card className={`shadow-cinematic border-none overflow-hidden transition-all ${isEditingLocation ? 'ring-2 ring-primary bg-primary/5' : ''}`}>
              <CardHeader className="flex flex-row items-center justify-between bg-white border-b py-4">
                <CardTitle className="flex items-center gap-2 font-heading text-lg">
                  <MapPin className="h-5 w-5 text-primary" /> {isEditingLocation ? 'Mark Incident Location' : 'Incident Location'}
                </CardTitle>
                {!isEditingLocation ? (
                  <Button variant="outline" size="sm" onClick={() => {
                    setIsEditingLocation(true);
                    setTempPosition(complaint.latitude && complaint.longitude ? [complaint.latitude, complaint.longitude] : [13.6288, 79.4192]);
                  }} className="h-8 gap-1.5 font-bold">
                    Mark Location
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setIsEditingLocation(false)} disabled={savingLocation} className="h-8 font-bold">
                      Cancel
                    </Button>
                    <Button size="sm" onClick={handleSaveLocation} disabled={savingLocation} className="h-8 font-bold shadow-lg">
                      {savingLocation ? <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" /> : null}
                      Save Position
                    </Button>
                  </div>
                )}
              </CardHeader>
              <CardContent className="p-0 relative">
                <div className="h-[450px]">
                  <MapPicker
                    position={isEditingLocation ? tempPosition : (complaint.latitude && complaint.longitude ? [complaint.latitude, complaint.longitude] : null)}
                    onPositionChange={(lat, lng) => setTempPosition([lat, lng])}
                    readonly={!isEditingLocation}
                  />
                  {isEditingLocation && (
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] glass-dark text-white px-4 py-2 rounded-full text-xs font-black shadow-2xl flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                      DRAG MAP OR CLICK TO PLACE MARKER
                    </div>
                  )}
                </div>
                {!isEditingLocation && (
                  <div className="bg-white p-4 flex items-center justify-between border-t">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                      Geographical Reference
                    </p>
                    <p className="text-xs font-mono font-bold text-primary">
                      {complaint.latitude && complaint.longitude ? `${complaint.latitude.toFixed(6)}, ${complaint.longitude.toFixed(6)}` : 'Coordinates missing'}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Feedback */}
            {complaint.status === 'resolved' && !feedbackGiven && (
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="font-heading text-lg">Your Feedback</CardTitle>
                </CardHeader>
                <CardContent>
                  <FeedbackForm complaintId={complaint.id} onSubmitted={() => setFeedbackGiven(true)} />
                </CardContent>
              </Card>
            )}
            {feedbackGiven && (
              <Card className="shadow-card">
                <CardContent className="flex items-center gap-3 pt-6">
                  <CheckCircle className="h-5 w-5 text-success" />
                  <p className="text-sm font-medium">Thank you! Your feedback has been recorded.</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Sidebar Details */}
            <Card className="shadow-cinematic border-none overflow-hidden bg-white">
              <CardHeader className="bg-slate-50 border-b py-4">
                <CardTitle className="font-heading text-lg font-bold text-slate-900">Resource Details</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-5">
                {[
                  { icon: Tag, label: 'Category', value: categoryLabels[complaint.category] || complaint.category, color: 'text-indigo-600' },
                  { icon: Calendar, label: 'Filed On', value: format(new Date(complaint.created_at), 'MMM d, yyyy · h:mm a'), color: 'text-slate-600' },
                  { icon: User, label: 'Department', value: departmentName, color: 'text-emerald-600', hide: !departmentName },
                  { icon: User, label: 'Assigned Officer', value: officerName, color: 'text-blue-600', hide: !officerName },
                ].map((item, idx) => !item.hide && (
                  <div key={idx} className="flex items-center gap-4 group">
                    <div className={`h-8 w-8 flex items-center justify-center rounded-lg bg-slate-100 ${item.color} group-hover:scale-110 transition-transform`}>
                      <item.icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{item.label}</p>
                      <p className="text-sm font-bold text-slate-800">{item.value}</p>
                    </div>
                  </div>
                ))}

                {complaint.remarks && (
                  <div className="pt-4 border-t">
                    <div className="flex items-start gap-4">
                      <MessageSquare className="mt-1 h-4 w-4 text-primary" />
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Officer Remarks</p>
                        <p className="mt-1 text-sm leading-relaxed text-slate-700 italic font-medium">"{complaint.remarks}"</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Redesigned Timeline */}
            <Card className="shadow-cinematic border-none overflow-hidden bg-white">
              <CardHeader className="bg-slate-50 border-b py-4">
                <CardTitle className="font-heading text-lg font-bold text-slate-900">Lifecycle Tracking</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {history.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No history available.</p>
                ) : (
                  <div className="relative space-y-0">
                    {history.map((h, i) => {
                      const Icon = statusIcons[h.status] || CircleDot;
                      const isLast = i === history.length - 1;
                      return (
                        <motion.div
                          key={h.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.1 }}
                          className="relative flex gap-3 pb-6"
                        >
                          {/* Timeline line */}
                          {!isLast && (
                            <div className="absolute left-[15px] top-8 h-full w-0.5 bg-border" />
                          )}
                          {/* Icon */}
                          <div className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${isLast ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                            }`}>
                            <Icon className="h-4 w-4" />
                          </div>
                          {/* Content */}
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold">
                              {h.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(h.created_at), 'MMM d, yyyy · h:mm a')}
                            </p>
                            {h.remarks && (
                              <p className="mt-1 text-xs text-muted-foreground italic">"{h.remarks}"</p>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div >
    </div >
  );
}
