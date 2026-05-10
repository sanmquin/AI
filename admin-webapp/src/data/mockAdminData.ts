export type MetricCard = {
  label: string;
  value: string;
  delta: string;
  tone: 'success' | 'info' | 'warning' | 'danger';
};

export type QueueItem = {
  id: string;
  title: string;
  owner: string;
  status: 'Ready' | 'Review' | 'Blocked' | 'Running';
  updated: string;
};

export type AuditEvent = {
  id: number;
  actor: string;
  action: string;
  time: string;
};

export const metricCards: MetricCard[] = [
  { label: 'Active channels', value: '128', delta: '+12 this week', tone: 'success' },
  { label: 'Queued analyses', value: '34', delta: '8 high priority', tone: 'warning' },
  { label: 'Model health', value: '98.2%', delta: '+1.8% vs last run', tone: 'info' },
  { label: 'Alerts', value: '3', delta: '2 require review', tone: 'danger' },
];

export const queueItems: QueueItem[] = [
  { id: 'JOB-1482', title: 'Rebuild semantic engagement indexes', owner: 'Operations', status: 'Running', updated: '2 min ago' },
  { id: 'JOB-1481', title: 'Approve creator recommendation export', owner: 'Growth', status: 'Review', updated: '14 min ago' },
  { id: 'JOB-1480', title: 'Refresh channel clustering projection', owner: 'Data science', status: 'Ready', updated: '28 min ago' },
  { id: 'JOB-1479', title: 'Backfill missing performance metrics', owner: 'Platform', status: 'Blocked', updated: '1 hr ago' },
];

export const auditEvents: AuditEvent[] = [
  { id: 1, actor: 'Avery Stone', action: 'changed the prediction threshold to 0.72', time: '09:42' },
  { id: 2, actor: 'Riley Chen', action: 'exported recommendations for 18 channels', time: '09:18' },
  { id: 3, actor: 'Morgan Lee', action: 'resolved alert CLUSTER-22', time: '08:55' },
  { id: 4, actor: 'System', action: 'completed nightly dimension interpretation build', time: '08:10' },
];
