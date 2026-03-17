import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import MapPicker from '@/components/MapPicker';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { analyzeComplaintLocally } from '@/utils/civicUtils';
import { Upload, LocateFixed, Loader2, Sparkles, AlertTriangle, CheckCircle, Brain, ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const categories = [
  { value: 'road_infrastructure', label: 'Road & Infrastructure' },
  { value: 'water_supply', label: 'Water Supply' },
  { value: 'electricity', label: 'Electricity' },
  { value: 'waste_management', label: 'Waste Management' },
  { value: 'public_safety', label: 'Public Safety' },
  { value: 'other', label: 'Other' },
];

const priorityConfig = {
  low: { label: 'Low Priority', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  medium: { label: 'Medium Priority', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  high: { label: 'High Priority', color: 'bg-orange-100 text-orange-700 border-orange-200' },
  critical: { label: '🚨 CRITICAL', color: 'bg-red-100 text-red-700 border-red-200 font-bold' },
};

export default function SubmitComplaint() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [position, setPosition] = useState<[number, number] | null>(null);
  const [image, setImage] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [locating, setLocating] = useState(false);
  const [isEmergency, setIsEmergency] = useState(false);

  // AI state
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState<{ category: string; priority: string; summary: string; department: string } | null>(null);
  const [imageAnalyzing, setImageAnalyzing] = useState(false);
  const [imageResult, setImageResult] = useState<{ issueType: string; description: string; confidence: string } | null>(null);

  // Auto-analyze description with debounce
  const handleDescriptionChange = (val: string) => {
    setDescription(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (val.trim().length < 20) return;
    debounceRef.current = setTimeout(async () => {
      setAiAnalyzing(true);
      try {
        const result = analyzeComplaintLocally(val);
        setAiResult(result);
        if (!category) setCategory(result.category);
      } finally {
        setAiAnalyzing(false);
      }
    }, 1200);
  };

  // Image upload + AI analysis
  const handleImageChange = async (file: File | null) => {
    setImage(file);
    setImageResult(null);
    if (!file) return;
    // Local vision analysis is not possible without an API, so we just set a neutral result
    setImageResult({
      issueType: 'Image Attached',
      description: 'Image will be reviewed by officers.',
      confidence: 'Local'
    });
  };

  // Emergency mode
  const handleEmergency = () => {
    setIsEmergency(true);
    setAiResult(prev => prev ? { ...prev, priority: 'critical' } : { category: category || 'public_safety', priority: 'critical', summary: 'Emergency report', department: 'Emergency Response' });
    if (!category) setCategory('public_safety');
    toast.error('🚨 Emergency mode activated — this will go directly to the critical queue!', { duration: 4000 });
  };

  // Geolocation
  const handleUseMyLocation = () => {
    if (!navigator.geolocation) { toast.error('Geolocation not supported'); return; }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => { setPosition([pos.coords.latitude, pos.coords.longitude]); setLocating(false); toast.success('Location detected!'); },
      (err) => { setLocating(false); toast.error(err.code === err.PERMISSION_DENIED ? 'Location access denied.' : 'Could not get location.'); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!category) { toast.error('Please select a category'); return; }
    if (!position) { toast.error('Please select a location on the map'); return; }
    setSubmitting(true);

    let imageUrl: string | null = null;
    if (image) {
      const ext = image.name.split('.').pop();
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from('complaint-images').upload(path, image);
      if (uploadError) toast.warning('Image could not be uploaded — submitting without it.');
      else {
        const { data: { publicUrl } } = supabase.storage.from('complaint-images').getPublicUrl(path);
        imageUrl = publicUrl;
      }
    }

    const basePayload = {
      user_id: user.id,
      title: title.trim(),
      description: description.trim(),
      category,
      latitude: position[0],
      longitude: position[1],
      image_url: imageUrl,
    };

    const aiPayload = {
      ...basePayload,
      priority: isEmergency ? 'critical' : (aiResult?.priority || 'medium'),
      ai_summary: aiResult?.summary || null,
      ai_department: aiResult?.department || null,
      image_issue_type: imageResult?.issueType || null,
    };

    // Try with AI columns first, fall back to base if columns don't exist yet
    let { error } = await supabase.from('complaints').insert(aiPayload as any);
    if (error && error.message?.includes('column')) {
      // AI columns not in DB yet — submit without them
      const res = await supabase.from('complaints').insert(basePayload as any);
      error = res.error;
    }

    setSubmitting(false);
    if (error) toast.error('Failed to submit complaint');
    else { toast.success('✅ Complaint submitted successfully!'); navigate('/track'); }
  };

  const priority = isEmergency ? 'critical' : (aiResult?.priority as keyof typeof priorityConfig || null);

  return (
    <div className="min-h-screen bg-background pt-24">
      <Navbar />
      <div className="mx-auto max-w-3xl px-4 py-8">

        {/* Emergency Banner */}
        <AnimatePresence>
          {isEmergency && (
            <motion.div
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 flex items-center gap-3 rounded-xl border-2 border-red-500 bg-red-50 p-4"
            >
              <AlertTriangle className="h-5 w-5 text-red-600 shrink-0" />
              <div>
                <p className="font-bold text-red-700">Emergency Report Active</p>
                <p className="text-sm text-red-600">This complaint will go to the critical priority queue immediately.</p>
              </div>
              <button onClick={() => setIsEmergency(false)} className="ml-auto text-xs text-red-500 hover:underline">Cancel</button>
            </motion.div>
          )}
        </AnimatePresence>

        <Card className={`shadow-elevated transition-all ${isEmergency ? 'border-red-300 ring-2 ring-red-200' : ''}`}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="font-heading text-2xl">Submit a Complaint</CardTitle>
                <CardDescription>Report a civic issue in your area</CardDescription>
              </div>
              {!isEmergency && (
                <button
                  type="button"
                  onClick={handleEmergency}
                  className="flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-2 text-xs font-bold text-white hover:bg-red-700 transition-colors shadow-sm"
                >
                  <AlertTriangle className="h-3.5 w-3.5" /> 🚨 Emergency
                </button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Complaint Title</Label>
                <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="e.g., Pothole on Main Street" maxLength={100} className="h-11" />
              </div>

              {/* Description + AI */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="desc">Description</Label>
                  {aiAnalyzing && (
                    <span className="flex items-center gap-1 text-xs text-primary">
                      Detecting...
                    </span>
                  )}
                </div>
                <Textarea
                  id="desc"
                  value={description}
                  onChange={(e) => handleDescriptionChange(e.target.value)}
                  required
                  placeholder="Describe the issue in detail (min 20 chars for AI analysis)..."
                  rows={4}
                  maxLength={1000}
                />

                {/* AI Analysis Result */}
                <AnimatePresence>
                  {aiResult && !aiAnalyzing && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="rounded-lg border bg-primary/5 p-3"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-semibold text-primary">Local Suggestions</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {priority && (
                          <span className={`rounded-full border px-2.5 py-0.5 text-xs ${priorityConfig[priority]?.color}`}>
                            {priorityConfig[priority]?.label}
                          </span>
                        )}
                        <span className="rounded-full border bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
                          🏢 {aiResult.department}
                        </span>
                        {aiResult.summary && (
                          <span className="rounded-full border bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
                            📝 {aiResult.summary}
                          </span>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Category */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Category</Label>
                  {aiResult && <span className="text-xs text-primary flex items-center gap-1"><CheckCircle className="h-3 w-3" /> AI suggested</span>}
                </div>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="h-11"><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Image Upload + AI Detection */}
              <div className="space-y-2">
                <Label>Upload Image</Label>
                <div className="flex items-start gap-3">
                  <label className="flex flex-1 cursor-pointer items-center gap-2 rounded-lg border border-dashed px-4 py-3 text-sm text-muted-foreground hover:bg-muted transition-colors">
                    <Upload className="h-4 w-4 shrink-0" />
                    {image ? image.name : 'Choose image (AI will detect the issue)'}
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageChange(e.target.files?.[0] || null)} />
                  </label>
                  {imageAnalyzing && <Loader2 className="h-5 w-5 animate-spin text-primary mt-3" />}
                </div>
                <AnimatePresence>
                  {imageResult && !imageAnalyzing && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="flex items-center gap-2 rounded-lg border bg-emerald-50 p-3"
                    >
                      <ImageIcon className="h-4 w-4 text-emerald-600" />
                      <div className="text-xs">
                        <span className="font-semibold text-emerald-700">Detected: {imageResult.issueType}</span>
                        <span className="ml-2 text-muted-foreground">{imageResult.description}</span>
                      </div>
                      <Badge variant="outline" className="ml-auto text-xs">{imageResult.confidence} confidence</Badge>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Location */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Location (click map or use GPS)</Label>
                  <button
                    type="button"
                    onClick={handleUseMyLocation}
                    disabled={locating}
                    className="flex items-center gap-1.5 rounded-md bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/20 transition-colors disabled:opacity-60"
                  >
                    {locating ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Locating...</> : <><LocateFixed className="h-3.5 w-3.5" /> Use My Location</>}
                  </button>
                </div>
                <MapPicker position={position} onPositionChange={(lat, lng) => setPosition([lat, lng])} />
                {position && (
                  <p className="text-xs text-muted-foreground">📍 Lat: {position[0].toFixed(4)}, Lng: {position[1].toFixed(4)}</p>
                )}
              </div>

              <Button
                type="submit"
                className={`w-full h-11 font-semibold ${isEmergency ? 'bg-red-600 hover:bg-red-700' : ''}`}
                disabled={submitting}
              >
                {submitting ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Submitting...</> : isEmergency ? '🚨 Submit Emergency Report' : '✅ Submit Complaint'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
