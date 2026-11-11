export type DemoProduct = {
  id: string
  name: string
  category: 'Home' | 'Accessories' | 'Beauty'
  price: number
  stock: number
  sold: number
  accent: 'sage' | 'peach' | 'butter' | 'blue'
  kind: 'mug' | 'tote' | 'bottle' | 'jar' | 'pouch'
}

export type DemoOrder = {
  id: string
  customer: string
  initials: string
  product: string
  date: string
  payment: 'Paid' | 'Pending' | 'Refunded'
  fulfillment: 'Shipped' | 'Processing' | 'Ready' | 'Cancelled'
  total: number
}

export const demoProducts: DemoProduct[] = [
  { id: 'mug', name: 'Stoneware Daily Mug', category: 'Home', price: 28, stock: 34, sold: 3, accent: 'sage', kind: 'mug' },
  { id: 'tote', name: 'Market Day Canvas Tote', category: 'Accessories', price: 36, stock: 8, sold: 1, accent: 'peach', kind: 'tote' },
  { id: 'wash', name: 'Citrus Hand Wash', category: 'Beauty', price: 22, stock: 5, sold: 2, accent: 'butter', kind: 'bottle' },
  { id: 'jar', name: 'Sunday Ceramic Jar', category: 'Home', price: 42, stock: 21, sold: 1, accent: 'blue', kind: 'jar' },
  { id: 'pouch', name: 'Everyday Zip Pouch', category: 'Accessories', price: 24, stock: 16, sold: 1, accent: 'sage', kind: 'pouch' },
]

export const demoOrders: DemoOrder[] = [
  { id: '#1048', customer: 'Olivia Chen', initials: 'OC', product: 'Stoneware Daily Mug · 2 items', date: 'Nov 8, 10:42 AM', payment: 'Paid', fulfillment: 'Processing', total: 56 },
  { id: '#1047', customer: 'Noah Williams', initials: 'NW', product: 'Market Day Canvas Tote', date: 'Nov 8, 9:18 AM', payment: 'Pending', fulfillment: 'Ready', total: 36 },
  { id: '#1046', customer: 'Ava Patel', initials: 'AP', product: 'Citrus Hand Wash · 2 items', date: 'Nov 7, 4:32 PM', payment: 'Paid', fulfillment: 'Shipped', total: 44 },
  { id: '#1045', customer: 'Ethan Brooks', initials: 'EB', product: 'Sunday Ceramic Jar', date: 'Nov 7, 1:05 PM', payment: 'Paid', fulfillment: 'Processing', total: 42 },
  { id: '#1044', customer: 'Mia Thompson', initials: 'MT', product: 'Everyday Zip Pouch', date: 'Nov 6, 11:24 AM', payment: 'Refunded', fulfillment: 'Cancelled', total: 24 },
  { id: '#1043', customer: 'Leo Garcia', initials: 'LG', product: 'Stoneware Daily Mug', date: 'Nov 6, 8:16 AM', payment: 'Paid', fulfillment: 'Shipped', total: 28 },
]

export type SalesRange = '7d' | '30d' | 'year'

export const salesRanges: Record<SalesRange, { label: string; bars: { label: string; value: number; amount: number }[]; total: number; orders: number }> = {
  '7d': {
    label: 'Last 7 days',
    bars: [
      { label: 'Mon 2', value: 0, amount: 0 }, { label: 'Tue 3', value: 0, amount: 0 }, { label: 'Wed 4', value: 0, amount: 0 },
      { label: 'Thu 5', value: 0, amount: 0 }, { label: 'Fri 6', value: 57, amount: 52 }, { label: 'Sat 7', value: 93, amount: 86 }, { label: 'Sun 8', value: 100, amount: 92 },
    ],
    total: 230,
    orders: 6,
  },
  '30d': {
    label: 'Last 30 days',
    bars: [
      { label: 'Wk 1', value: 62, amount: 230 }, { label: 'Wk 2', value: 70, amount: 260 }, { label: 'Wk 3', value: 81, amount: 300 },
      { label: 'Wk 4', value: 100, amount: 370 },
    ],
    total: 1160,
    orders: 14,
  },
  year: {
    label: 'This year',
    bars: [
      { label: 'Jan', value: 50, amount: 350 }, { label: 'Feb', value: 54, amount: 380 }, { label: 'Mar', value: 60, amount: 420 },
      { label: 'Apr', value: 64, amount: 450 }, { label: 'May', value: 69, amount: 480 }, { label: 'Jun', value: 71, amount: 500 },
      { label: 'Jul', value: 76, amount: 530 }, { label: 'Aug', value: 79, amount: 550 }, { label: 'Sep', value: 81, amount: 570 },
      { label: 'Oct', value: 89, amount: 620 }, { label: 'Nov', value: 100, amount: 700 },
    ],
    total: 5550,
    orders: 82,
  },
}

export const trafficSources = [
  { name: 'Direct', value: 42, color: 'var(--shop-orange)' },
  { name: 'Social', value: 31, color: 'var(--shop-sage)' },
  { name: 'Search', value: 27, color: 'var(--shop-blue)' },
]

export const workflowExamples = [
  { name: 'New order confirmation', detail: 'Order placed -> confirmation email', state: 'Active' },
  { name: 'Low-stock reminder', detail: 'Stock below 10 -> review alert', state: 'Active' },
  { name: 'Fulfillment follow-up', detail: 'Order shipped -> delivery check-in', state: 'Draft' },
]
