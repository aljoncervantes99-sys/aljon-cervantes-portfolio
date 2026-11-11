export type QA = { q: string; a: string }

/**
 * The questions people ask before they email. One list, used by the FAQ
 * accordion on the Contact view (and the legacy long-scroll FAQ section).
 * Five questions and answers: the accordion sits in a
 * fixed panel and more than that pushes the email row off the plate.
 */
export const FAQS: QA[] = [
  {
    q: 'What services do you offer?',
    a: 'I provide Ecommerce VA support, Shopify store management, website development, graphics design, and logistics and supply chain support.',
  },
  {
    q: 'What platforms and tools do you work with?',
    a: 'I work with tools such as Shopify, Salesforce, GoHighLevel, Excel, Google Sheets, Canva, and other digital productivity and business tools.',
  },
  {
    q: 'Can you work with international clients?',
    a: 'Yes. I can collaborate remotely with businesses and clients across different locations and time zones.',
  },
  {
    q: 'How do you manage projects and communication?',
    a: 'I use organized workflows, clear communication, and digital collaboration tools to keep tasks and project updates organized.',
  },
  {
    q: 'How can we get started?',
    a: "Send me a message through the contact form with your project requirements. I'll review your inquiry and discuss the next steps.",
  },
]
