import ProjectsGrid from '@/components/ProjectsGrid'
import ImpactSection from '@/components/ImpactSection'

/**
 * The featured work stays first, followed by the approach section before the
 * separate About route in the portfolio's content sequence.
 */
export default function ProjectsView() {
  return (
    <>
      <ProjectsGrid />
      <ImpactSection />
    </>
  )
}
