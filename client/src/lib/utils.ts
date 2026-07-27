export function formatDate(dateStr: string): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatDateTime(dateStr: string): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    pass: 'badge-success',
    passed: 'badge-success',
    completed: 'badge-success',
    confirmed: 'badge-info',
    available: 'badge-success',
    scheduled: 'badge-info',
    in_progress: 'badge-warning',
    analyzing: 'badge-warning',
    pending: 'badge-warning',
    almost_full: 'badge-warning',
    fail: 'badge-danger',
    failed: 'badge-danger',
    full: 'badge-danger',
    cancelled: 'badge-neutral',
    not_applied: 'badge-neutral',
    upheld: 'badge-info',
    modified: 'badge-warning',
    reassessment: 'badge-danger',
    video_uploaded: 'badge-info',
    ai_analyzed: 'badge-info',
    rto_evaluated: 'badge-info',
    test_scheduled: 'badge-info',
    test_completed: 'badge-info',
    in_review: 'badge-warning',
    applied: 'badge-info',
  };
  return colors[status] || 'badge-neutral';
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pass: 'PASS',
    passed: 'Passed',
    fail: 'FAIL',
    failed: 'Failed',
    completed: 'Completed',
    confirmed: 'Confirmed',
    scheduled: 'Scheduled',
    in_progress: 'In Progress',
    analyzing: 'Analyzing',
    pending: 'Pending',
    available: 'Available',
    almost_full: 'Almost Full',
    full: 'Full',
    cancelled: 'Cancelled',
    not_applied: 'Not Applied',
    upheld: 'Upheld',
    modified: 'Modified',
    reassessment: 'Reassessment',
    video_uploaded: 'Video Uploaded',
    ai_analyzed: 'AI Analyzed',
    rto_evaluated: 'RTO Evaluated',
    test_scheduled: 'Test Scheduled',
    test_completed: 'Test Completed',
    in_review: 'In Review',
    applied: 'Applied',
  };
  return labels[status] || status;
}

export function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(' ');
}
