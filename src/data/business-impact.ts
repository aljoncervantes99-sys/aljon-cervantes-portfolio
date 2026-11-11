export type BusinessProject = {
  id: 'ecommerce' | 'website' | 'automation'
  tab: string
  eyebrow: string
  title: string
  description: string
  tools: string[]
  capabilities: string[]
  screenshots: {
    src: string
    alt: string
    caption: string
  }[]
  link: {
    label: string
    href: string
    appRoute?: boolean
  }
}

export const businessProjects: BusinessProject[] = [
  {
    id: 'ecommerce',
    tab: 'Ecommerce Operations',
    eyebrow: 'STORE OPERATIONS',
    title: 'Ecommerce Operations & Shopify Management',
    description:
      'A practical operations showcase covering product catalog updates, inventory visibility, order processing, and customer support workflows. The dashboard preview uses illustrative sample records and is not connected to a live Shopify store.',
    tools: ['Shopify', 'Google Sheets', 'Salesforce'],
    capabilities: [
      'Product catalog and listing maintenance',
      'Inventory and order status tracking',
      'Customer experience and fulfillment coordination',
    ],
    screenshots: [
      {
        src: '/projects/ecommerce/ecommerce-showcase.png',
        alt: 'Shopify product administration screen with catalog and inventory columns',
        caption: 'Product catalog management',
      },
      {
        src: '/projects/ecommerce/ecommerce-showcase2.png.png',
        alt: 'Illustrative ecommerce operations dashboard with sales and order summary panels',
        caption: 'Operations dashboard · sample data',
      },
    ],
    link: {
      label: 'Explore the interactive dashboard',
      href: '/projects/ecommerce-dashboard',
      appRoute: true,
    },
  },
  {
    id: 'website',
    tab: 'Website Development',
    eyebrow: 'HOSPITALITY WEBSITE',
    title: 'Pearl White — Website Development',
    description:
      'A responsive hospitality website that presents the accommodation, amenities, and guest experience, with clear pathways for booking inquiries.',
    tools: ['Responsive web design', 'Booking inquiry forms', 'GoHighLevel'],
    capabilities: [
      'Responsive page layout and visual presentation',
      'Guest inquiry and booking information flow',
      'Accommodation pricing guidance',
    ],
    screenshots: [
      {
        src: '/projects/pearl-white.png',
        alt: 'Pearl White hospitality website preview showing accommodation details and booking calls to action',
        caption: 'Pearl White website preview',
      },
    ],
    link: {
      label: 'View the Pearl White case study',
      href: '/projects/pearl-white-case-study.html',
    },
  },
  {
    id: 'automation',
    tab: 'Automation & CRM',
    eyebrow: 'BOOKING WORKFLOW',
    title: 'Pearl White — Booking Automation',
    description:
      'The Pearl White case study describes a booking inquiry experience supported by a pricing calculator and GoHighLevel workflow integration. The image is the public website preview; it does not depict a CRM screen.',
    tools: ['GoHighLevel', 'CRM workflows', 'Booking inquiry forms'],
    capabilities: [
      'Collect booking details through inquiry forms',
      'Organize inquiries for CRM follow-up',
      'Coordinate booking notifications and workflow steps',
    ],
    screenshots: [
      {
        src: '/projects/pearl-white.png',
        alt: 'Pearl White public website preview; the CRM workflow is described in the linked case study',
        caption: 'Public website preview · workflow details in case study',
      },
    ],
    link: {
      label: 'View workflow case study',
      href: '/projects/pearl-white-case-study.html',
    },
  },
]

export const servicePackages = [
  {
    id: 'starter',
    name: 'Starter',
    subtitle: 'Business Support',
    description: 'Dependable day-to-day assistance to keep essential business tasks organized.',
    includes: [
      'Ecommerce support',
      'Product listing management',
      'Customer service assistance',
      'Data entry and inventory updates',
      'Email and calendar management',
      'Basic website updates',
      'Administrative support',
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    subtitle: 'Digital Operations',
    description: 'A broader operations partnership for connected platforms, workflows, and ongoing digital support.',
    includes: [
      'Shopify store management',
      'Website development',
      'GoHighLevel automation',
      'CRM and workflow management',
      'Reporting and analytics',
      'Logistics and supply chain coordination',
      'Process optimization',
      'Advanced operational support',
    ],
  },
] as const
