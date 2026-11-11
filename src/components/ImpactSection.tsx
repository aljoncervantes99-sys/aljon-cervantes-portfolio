import { useEffect, useRef, useState, type CSSProperties } from 'react'

const IMPACT_CARDS = [
  {
    number: '01',
    title: 'UNDERSTAND THE BUSINESS',
    description: 'Identify operational needs, customer expectations, and business priorities.',
    tags: ['Business Needs', 'Research', 'Analysis'],
  },
  {
    number: '02',
    title: 'BUILD THE FOUNDATION',
    description: 'Organize digital platforms, product information, and business processes.',
    tags: ['Shopify', 'CRM', 'Data Management'],
  },
  {
    number: '03',
    title: 'MANAGE THE DETAILS',
    description: 'Keep products, orders, inventory, and daily business tasks organized.',
    tags: ['Ecommerce', 'Order Management', 'Accuracy'],
  },
  {
    number: '04',
    title: 'CONNECT THE EXPERIENCE',
    description: 'Support customers and coordinate communication across business channels.',
    tags: ['Customer Experience', 'Email', 'Coordination'],
  },
  {
    number: '05',
    title: 'MAKE WORK VISIBLE',
    description: 'Maintain accurate records, monitor activities, and communicate progress.',
    tags: ['Reporting', 'Documentation', 'Tracking'],
  },
  {
    number: '06',
    title: 'MAKE SYSTEMS BETTER',
    description: 'Improve digital workflows, simplify repetitive tasks, and explore automation.',
    tags: ['Process Improvement', 'AI Tools', 'Automation'],
  },
]

function measureWorkflowPaths(grid: HTMLOListElement) {
  const gridRect = grid.getBoundingClientRect()
  const cards = Array.from(grid.querySelectorAll<HTMLElement>('.impact__card'))
  const paths: string[] = []

  for (let index = 0; index < cards.length - 1; index += 1) {
    const current = cards[index].getBoundingClientRect()
    const next = cards[index + 1].getBoundingClientRect()
    const sameRow = Math.abs(current.top - next.top) < 1

    if (sameRow) {
      const startX = current.right - gridRect.left
      const endX = next.left - gridRect.left
      const centerY = (current.top + current.bottom) / 2 - gridRect.top
      paths.push(`M ${startX} ${centerY} H ${endX}`)
      continue
    }

    const startX = (current.left + current.right) / 2 - gridRect.left
    const endX = (next.left + next.right) / 2 - gridRect.left
    const startY = current.bottom - gridRect.top
    const endY = next.top - gridRect.top
    const turnY = (startY + endY) / 2
    const direction = Math.sign(endX - startX)
    const radius = Math.min(5, Math.abs(endX - startX) / 2, Math.abs(endY - startY) / 2)

    if (direction === 0) {
      paths.push(`M ${startX} ${startY} V ${endY}`)
    } else {
      paths.push(
        `M ${startX} ${startY} V ${turnY - radius} Q ${startX} ${turnY} ${startX + direction * radius} ${turnY} H ${endX - direction * radius} Q ${endX} ${turnY} ${endX} ${turnY + radius} V ${endY}`,
      )
    }
  }

  return paths
}

export default function ImpactSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const gridRef = useRef<HTMLOListElement>(null)
  const [workflowPaths, setWorkflowPaths] = useState<string[]>([])
  const [isInView, setIsInView] = useState(false)

  useEffect(() => {
    const section = sectionRef.current
    const grid = gridRef.current
    if (!section || !grid) return

    const measure = () => {
      const paths = measureWorkflowPaths(grid)
      setWorkflowPaths((current) =>
        current.length === paths.length && current.every((path, index) => path === paths[index])
          ? current
          : paths,
      )
    }

    measure()
    const resizeObserver = new ResizeObserver(measure)
    resizeObserver.observe(grid)
    grid.querySelectorAll('.impact__card').forEach((card) => resizeObserver.observe(card))

    const intersectionObserver = new IntersectionObserver(
      ([entry]) => setIsInView(entry.isIntersecting),
      { threshold: 0 },
    )
    intersectionObserver.observe(section)

    return () => {
      resizeObserver.disconnect()
      intersectionObserver.disconnect()
    }
  }, [])

  return (
    <section ref={sectionRef} className={`impact${isInView ? ' is-in-view' : ''}`} aria-labelledby="impact-title">
      <header className="impact__head">
        <p className="impact__eyebrow">MY APPROACH · OPERATIONS &amp; TECHNOLOGY</p>
        <h2 className="impact__section-title" id="impact-title">
          THE WAY I CREATE IMPACT
        </h2>
        <h3 className="impact__title">Turning business challenges into smarter digital workflows.</h3>
        <p className="impact__lede">
          A practical approach to managing operations, improving digital experiences, and helping
          businesses move forward.
        </p>
      </header>

      <div className="impact__flow">
        <svg className="impact__connectors" aria-hidden="true" focusable="false">
          {workflowPaths.map((path, index) => (
            <g key={index} style={{ '--impact-delay': `${index * 3}s` } as CSSProperties}>
              <path className="impact__connector-halo" d={path} />
              <path className="impact__connector" d={path} />
              <path className="impact__connector-runner" d={path} pathLength="100" />
            </g>
          ))}
        </svg>
        <ol className="impact__grid" ref={gridRef}>
          {IMPACT_CARDS.map(({ number, title, description, tags }, index) => (
            <li
              className="impact__card"
              key={number}
              style={{ '--impact-delay': `${index * 3}s` } as CSSProperties}
            >
              <span className="impact__number">{number}</span>
              <h3 className="impact__card-title">{title}</h3>
              <p className="impact__description">{description}</p>
              <ul className="impact__tags" aria-label={`${title} skills`}>
                {tags.map((tag) => (
                  <li className="impact__tag" key={tag}>{tag}</li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
