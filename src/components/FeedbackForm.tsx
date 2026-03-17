import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Star } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface Props {
  complaintId: string;
  onSubmitted?: () => void;
}

export default function FeedbackForm({ complaintId, onSubmitted }: Props) {
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comments, setComments] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!user || rating === 0) return;
    setSubmitting(true);
    const { error } = await supabase.from('feedback').insert({
      complaint_id: complaintId,
      user_id: user.id,
      rating,
      comments: comments.trim() || null,
    } as any);
    setSubmitting(false);
    if (error) {
      toast.error('Failed to submit feedback');
    } else {
      toast.success('Feedback submitted!');
      onSubmitted?.();
    }
  };

  return (
    <div className="space-y-3 rounded-lg border bg-card p-4">
      <h4 className="font-heading font-semibold">Rate this resolution</h4>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <button
            key={i}
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(0)}
            onClick={() => setRating(i)}
            className="transition-transform hover:scale-110"
          >
            <Star
              className={`h-6 w-6 ${i <= (hover || rating) ? 'fill-warning text-warning' : 'text-muted-foreground'}`}
            />
          </button>
        ))}
      </div>
      <Textarea
        placeholder="Additional comments (optional)"
        value={comments}
        onChange={(e) => setComments(e.target.value)}
        rows={3}
      />
      <Button onClick={handleSubmit} disabled={rating === 0 || submitting} size="sm">
        {submitting ? 'Submitting...' : 'Submit Feedback'}
      </Button>
    </div>
  );
}
