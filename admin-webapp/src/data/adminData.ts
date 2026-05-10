export type StatusTone = 'success' | 'warning' | 'danger' | 'info';

export type Metric = {
  label: string;
  value: string;
  delta: string;
  tone: StatusTone;
};

export type QueueItem = {
  id: string;
  title: string;
  owner: string;
  status: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  updatedAt: string;
};

export type AuditEvent = {
  id: number;
  actor: string;
  action: string;
  target: string;
  time: string;
};

export type Service = {
  name: string;
  health: number;
  latency: string;
  tone: StatusTone;
};

export const metrics: Metric[] = [
  { label: 'Active users', value: '18,420', delta: '+12.8% week over week', tone: 'success' },
  { label: 'Open reviews', value: '247', delta: '31 due today', tone: 'warning' },
  { label: 'System uptime', value: '99.98%', delta: 'Last 30 days', tone: 'info' },
  { label: 'Incidents', value: '3', delta: '-4 from yesterday', tone: 'danger' },
];

export const queueItems: QueueItem[] = [
  {
    id: 'REV-1048',
    title: 'Approve enterprise workspace migration',
    owner: 'Mina Patel',
    status: 'Security review',
    priority: 'Critical',
    updatedAt: '8 min ago',
  },
  {
    id: 'REV-1047',
    title: 'Validate billing anomaly report',
    owner: 'Noah Kim',
    status: 'Finance approval',
    priority: 'High',
    updatedAt: '21 min ago',
  },
  {
    id: 'REV-1046',
    title: 'Refresh production feature flags',
    owner: 'Ava Johnson',
    status: 'Ready to run',
    priority: 'Medium',
    updatedAt: '47 min ago',
  },
  {
    id: 'REV-1045',
    title: 'Archive inactive sandbox tenants',
    owner: 'Leo Garcia',
    status: 'Scheduled',
    priority: 'Low',
    updatedAt: '2 hr ago',
  },
];

export const auditEvents: AuditEvent[] = [
  { id: 1, actor: 'Mina Patel', action: 'created an escalation policy for', target: 'Payments API', time: '09:42' },
  { id: 2, actor: 'Ops Bot', action: 'rotated credentials for', target: 'Analytics warehouse', time: '09:17' },
  { id: 3, actor: 'Noah Kim', action: 'approved a quota increase for', target: 'Acme Labs', time: '08:54' },
  { id: 4, actor: 'Ava Johnson', action: 'disabled stale access for', target: 'Legacy exporters', time: '08:25' },
];

export const services: Service[] = [
  { name: 'Authentication', health: 99, latency: '42 ms', tone: 'success' },
  { name: 'Billing', health: 94, latency: '88 ms', tone: 'info' },
  { name: 'Jobs Queue', health: 82, latency: '210 ms', tone: 'warning' },
  { name: 'Search', health: 76, latency: '320 ms', tone: 'danger' },
];
