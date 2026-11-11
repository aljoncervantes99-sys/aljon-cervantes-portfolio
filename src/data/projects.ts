export type AppStat = { value: string; label: string }

export type AppProject = {
  name: string
  tagline: string
  description: string
  /** Optional - omit for gradient placeholder cards */
  imageSrc?: string
  /** CSS object-position override. Defaults to 'top center'. */
  imagePosition?: string
  /** External brand color - not a site token. Passed via --app-color inline prop. */
  accentColor: string
  stats: AppStat[]
  badge: string
}

/** @deprecated use AppProject */
export type MobileApp = AppProject

/**
 * Your apps. Every value is a PLACEHOLDER. Screenshots live in
 * public/placeholders/ - swap in your own (960x514 works well).
 */
const STATS: AppStat[] = [
  { value: '0', label: 'Stat one' },
  { value: '0', label: 'Stat two' },
  { value: '0', label: 'Stat three' },
]

const DESC = 'PLACEHOLDER - tell me what to put here: what the app does, who it is for, and where it is published.'

export const mobileApps: MobileApp[] = [
  {
    name: 'App Name One',
    tagline: 'PLACEHOLDER - one-line tagline.',
    description: DESC,
    imageSrc: '/placeholders/app-1.jpg',
    imagePosition: '50% 30%',
    accentColor: '#2563EB',
    stats: STATS,
    badge: 'Badge',
  },
  {
    name: 'App Name Two',
    tagline: 'PLACEHOLDER - one-line tagline.',
    description: DESC,
    imageSrc: '/placeholders/app-2.jpg',
    accentColor: '#7C3AED',
    stats: STATS,
    badge: 'Badge',
  },
  {
    name: 'App Name Three',
    tagline: 'PLACEHOLDER - one-line tagline.',
    description: DESC,
    imageSrc: '/placeholders/app-3.jpg',
    accentColor: '#16A34A',
    stats: STATS,
    badge: 'Badge',
  },
]

export const webApps: AppProject[] = [
  {
    name: 'Pearl White',
    tagline: 'Premium Airbnb website and booking experience.',
    description:
      'A premium hospitality website designed to showcase the property, streamline booking inquiries, and create a polished guest experience.',
    accentColor: '#6B8E78',
    stats: [
      { value: 'Website', label: 'Hospitality' },
      { value: 'Booking', label: 'Experience' },
      { value: 'Automation', label: 'Workflow' },
    ],
    badge: 'Airbnb Website',
  },
  {
    name: 'Craftee Staff',
    tagline: 'Virtual staffing website for growing ecommerce brands.',
    description:
      'A professional website concept for a virtual staffing business focused on ecommerce, apparel, customer support, and operational assistance.',
    accentColor: '#8B6F5A',
    stats: [
      { value: 'Ecommerce', label: 'Support' },
      { value: 'Virtual', label: 'Staffing' },
      { value: 'Operations', label: 'Support' },
    ],
    badge: 'Business Website',
  },
  {
    name: 'GoHighLevel Automation',
    tagline: 'CRM, booking, notifications, and follow-up automation.',
    description:
      'An automated workflow connecting lead capture, CRM pipelines, booking forms, notifications, and customer follow-ups to reduce repetitive manual work.',
    accentColor: '#5B6FB5',
    stats: [
      { value: 'CRM', label: 'Automation' },
      { value: 'Booking', label: 'Workflow' },
      { value: 'Follow-up', label: 'Automation' },
    ],
    badge: 'AI Automation',
  },
  {
    name: 'Shopify Ecommerce Operations',
    tagline: 'Ecommerce management built around efficient operations.',
    description:
      'Ecommerce support covering product listings, inventory updates, order management, customer support, fulfillment coordination, and store administration.',
    accentColor: '#6E9F72',
    stats: [
      { value: 'Shopify', label: 'Management' },
      { value: 'Orders', label: 'Operations' },
      { value: 'Support', label: 'Customers' },
    ],
    badge: 'Ecommerce',
  },
]
