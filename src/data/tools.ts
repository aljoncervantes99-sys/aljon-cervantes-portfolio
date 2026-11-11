export type Tool = {
  name: string
  iconPath: string
}

export type ToolCategory = {
  name: string
  tools: Tool[]
}

export const toolCategories: ToolCategory[] = [
  {
    name: 'Commerce & CRM',
    tools: [
      { name: 'Shopify', iconPath: '/icons/shopify.svg' },
      { name: 'Salesforce', iconPath: '/icons/salesforce.svg' },
      { name: 'GoHighLevel', iconPath: '/icons/gohighlevel.svg' },
    ],
  },
  {
    name: 'Productivity',
    tools: [
      { name: 'Canva', iconPath: '/icons/canva.svg' },
      { name: 'Excel', iconPath: '/icons/excel.svg' },
      { name: 'Google Sheets', iconPath: '/icons/googlesheets.svg' },
    ],
  },
  {
    name: 'Development',
    tools: [
      { name: 'React', iconPath: '/icons/react.svg' },
      { name: 'JavaScript', iconPath: '/icons/javascript.svg' },
      { name: 'HTML5', iconPath: '/icons/html5.svg' },
      { name: 'CSS3', iconPath: '/icons/css3.svg' },
      { name: 'GitHub', iconPath: '/icons/github.svg' },
      { name: 'Vercel', iconPath: '/icons/vercel.svg' },
    ],
  },
  {
    name: 'AI & Automation',
    tools: [
      { name: 'ChatGPT', iconPath: '/icons/openai.svg' },
      { name: 'Claude', iconPath: '/icons/anthropic.svg' },
      { name: 'Zapier', iconPath: '/icons/zapier.svg' },
      { name: 'n8n', iconPath: '/icons/n8n.svg' },
    ],
  },
]
