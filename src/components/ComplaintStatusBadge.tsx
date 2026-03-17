import { Badge } from '@/components/ui/badge';

const statusConfig: Record<string, { label: string; className: string }> = {
  submitted: { label: 'Submitted', className: 'bg-info text-info-foreground' },
  under_review: { label: 'Under Review', className: 'bg-warning text-warning-foreground' },
  assigned: { label: 'Assigned', className: 'bg-secondary text-secondary-foreground' },
  in_progress: { label: 'In Progress', className: 'bg-primary text-primary-foreground' },
  resolved: { label: 'Resolved', className: 'bg-success text-success-foreground' },
};

export default function ComplaintStatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] || { label: status, className: '' };
  return <Badge className={config.className}>{config.label}</Badge>;
}
