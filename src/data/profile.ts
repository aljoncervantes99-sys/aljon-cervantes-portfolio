import { Briefcase, SealCheck, Clock, type Icon } from '@/components/slab'

export type SocialLink = {
  label: string
  href: string
  iconPath: string
}

export type Stat = {
  value: string
  label: string
  Icon: Icon
}

export type Profile = {
  name: string
  firstName: string
  handle: string
  role: string
  avatarSrc: string
  verifiedLabel: string
  email: string
  location: string
  upworkProfileUrl: string
  stats: Stat[]
  displayName: { line1: string; line2: string }
  hero: {
    body: string
    portraitSrc: string
    portraitAlt: string
  }
  socials: SocialLink[]
}

export const profile: Profile = {
  name: 'Aljon Cervantes',

  firstName: 'Aljon',

  handle: '@aljoncervantes',

  role:
    'Ecommerce & Shopify Specialist | Technical Virtual Assistant | Web Developer | Digital Operations Specialist',

  avatarSrc: '/profile.jpg',

  verifiedLabel: 'Verified profile',

  email: 'aljoncervantes99@gmail.com',

  location: 'Philippines',

  upworkProfileUrl: '',

  stats: [
    {
      value: 'Ecommerce',
      label: 'Operations',
      Icon: Briefcase,
    },
    {
      value: 'Automation',
      label: 'Workflows',
      Icon: SealCheck,
    },
    {
      value: 'Tech',
      label: 'Solutions',
      Icon: Clock,
    },
  ],

  displayName: {
    line1: 'Operations Meets',
    line2: 'Technology.',
  },

  hero: {
    body:
      'Helping businesses streamline ecommerce operations, optimize Shopify stores, and build seamless digital experiences.',

    portraitSrc: '/profile.jpg',

    portraitAlt: 'Portrait of Aljon Cervantes',
  },

  socials: [
    {
      label: 'LinkedIn profile',
      href: 'https://www.linkedin.com/in/aljoncervantes08261999',
      iconPath: '/icons/linkedin.svg',
    },
    {
      label: 'Facebook profile',
      href: '#',
      iconPath: '/icons/facebook.svg',
    },
  ],
}