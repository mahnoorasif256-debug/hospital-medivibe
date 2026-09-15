// Mock data (plain globals, ES6+ syntax)
const PROVIDERS = [
  {
    id: 'prov-1',
    name: 'Dr. Elena Rostova',
    role: 'Senior Product Strategist',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=250',
    email: 'elena.rostova@example.com',
    bio: 'Product architecture, UX strategy, and high-growth advisory with 12+ years of industry experience.',
    rating: 4.9,
    specialties: ['Product Strategy', 'Design Review', 'Growth Scaling'],
  },
  {
    id: 'prov-2',
    name: 'Marcus Vance',
    role: 'Lead Cloud Architect',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
    email: 'marcus.vance@example.com',
    bio: 'Specializing in full-stack cloud systems, high-availability infrastructure, and security compliance.',
    rating: 4.95,
    specialties: ['Cloud Infrastructure', 'Tech Advisory', 'System Design'],
  },
  {
    id: 'prov-3',
    name: 'Aria Chen',
    role: 'Design System Principal',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=250',
    email: 'aria.chen@example.com',
    bio: 'Crafting mathematical design tokens, accessible component hierarchies, and interactive brand experiences.',
    rating: 4.88,
    specialties: ['UI/UX Audit', 'Design Tokens', 'Accessibility'],
  },
];

const SERVICES = [
  {
    id: 'srv-1',
    name: 'Discovery & Consultation',
    description: 'Initial 30-minute scoping session to map out goals, constraints, and project timeline.',
    durationMinutes: 30,
    price: 0,
    category: 'Consultation',
  },
  {
    id: 'srv-2',
    name: 'Product Strategy & Roadmap',
    description: 'In-depth analysis of user experience, feature priorities, and quarterly milestones.',
    durationMinutes: 45,
    price: 120,
    category: 'Strategy',
  },
  {
    id: 'srv-3',
    name: 'Technical Architecture Review',
    description: 'Comprehensive code and infrastructure review with actionable performance recommendations.',
    durationMinutes: 60,
    price: 180,
    category: 'Review',
  },
  {
    id: 'srv-4',
    name: 'Quick 15-Min Touchpoint',
    description: 'Fast-paced Q&A for existing clients needing quick technical or design guidance.',
    durationMinutes: 15,
    price: 45,
    category: 'Support',
  },
];

const TIMEZONES = [
  { value: 'America/New_York', label: 'Eastern Time (ET, UTC-4)', offset: -4 },
  { value: 'America/Chicago', label: 'Central Time (CT, UTC-5)', offset: -5 },
  { value: 'America/Denver', label: 'Mountain Time (MT, UTC-6)', offset: -6 },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT, UTC-7)', offset: -7 },
  { value: 'Europe/London', label: 'Greenwich Mean Time (GMT, UTC+1)', offset: 1 },
  { value: 'Europe/Paris', label: 'Central European Time (CET, UTC+2)', offset: 2 },
  { value: 'Asia/Tokyo', label: 'Japan Standard Time (JST, UTC+9)', offset: 9 },
  { value: 'Asia/Kolkata', label: 'India Standard Time (IST, UTC+5:30)', offset: 5.5 },
];
