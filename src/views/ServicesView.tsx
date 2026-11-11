import ServicesGrid from '@/components/ServicesGrid'

/**
 * Services is one glass sheet like Projects: the three-step method, the four
 * services with their marks, and the booking workflow. No ViewShell: the
 * grid supplies its own head and there is no footer to scroll to.
 */
export default function ServicesView() {
  return <ServicesGrid />
}
