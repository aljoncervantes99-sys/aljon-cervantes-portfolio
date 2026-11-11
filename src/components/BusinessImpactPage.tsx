import { useRef, useState, type KeyboardEvent } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight, CheckCircle } from '@/components/slab'
import { businessProjects, servicePackages, type BusinessProject } from '@/data/business-impact'

type CalculatorValues = {
  hoursPerWeek: number
  ownerHourlyValue: number
  assistantHourlyRate: number
  delegatedPercent: number
  workingWeeks: number
}

const INITIAL_VALUES: CalculatorValues = {
  hoursPerWeek: 20,
  ownerHourlyValue: 45,
  assistantHourlyRate: 8,
  delegatedPercent: 70,
  workingWeeks: 50,
}

const CALCULATOR_FIELDS: {
  key: keyof CalculatorValues
  label: string
  min: number
  max: number
  step: number
  display: (value: number) => string
}[] = [
  { key: 'hoursPerWeek', label: 'Hours of work delegated per week', min: 1, max: 40, step: 1, display: (value) => `${value} ${value === 1 ? 'hr' : 'hrs'}` },
  { key: 'ownerHourlyValue', label: 'Estimated hourly value of your time', min: 10, max: 100, step: 1, display: (value) => `$${value}/hr` },
  { key: 'assistantHourlyRate', label: 'Virtual assistant hourly rate', min: 5, max: 20, step: 1, display: (value) => `$${value}/hr` },
  { key: 'delegatedPercent', label: 'Percentage of tasks delegated', min: 10, max: 100, step: 5, display: (value) => `${value}%` },
  { key: 'workingWeeks', label: 'Working weeks per year', min: 1, max: 52, step: 1, display: (value) => `${value} ${value === 1 ? 'week' : 'weeks'}` },
]

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value)
}

function formatHours(value: number) {
  const formatted = new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 }).format(value)
  return `${formatted} ${value === 1 ? 'hr' : 'hrs'}`
}

function RangeControl({
  field,
  value,
  onChange,
}: {
  field: (typeof CALCULATOR_FIELDS)[number]
  value: number
  onChange: (value: number) => void
}) {
  const controlId = `business-value-${field.key}`
  return (
    <div className="bi-range">
      <label className="bi-range__label" htmlFor={controlId}>
        <span>{field.label}</span>
        <output htmlFor={controlId}>{field.display(value)}</output>
      </label>
      <input
        id={controlId}
        type="range"
        min={field.min}
        max={field.max}
        step={field.step}
        value={value}
        onChange={(event) => onChange(Number(event.currentTarget.value))}
        aria-valuetext={field.display(value)}
      />
      <div className="bi-range__limits" aria-hidden="true">
        <span>{field.display(field.min)}</span>
        <span>{field.display(field.max)}</span>
      </div>
    </div>
  )
}

function BusinessValueCalculator() {
  const [values, setValues] = useState(INITIAL_VALUES)
  const hoursReturned = values.hoursPerWeek * (values.delegatedPercent / 100) * values.workingWeeks
  const annualTimeValue = hoursReturned * values.ownerHourlyValue
  const annualAssistantCost = hoursReturned * values.assistantHourlyRate
  const annualPotentialSavings = annualTimeValue - annualAssistantCost

  const setValue = (key: keyof CalculatorValues, value: number) => {
    setValues((current) => ({ ...current, [key]: value }))
  }

  return (
    <section className="bi-panel bi-calculator" aria-labelledby="bi-calculator-title">
      <header className="bi-panel__heading">
        <span className="bi-eyebrow">01 / BUSINESS VALUE</span>
        <h2 id="bi-calculator-title">What could I free up for your business?</h2>
        <p>Discover how much time and operational effort you could save by delegating tasks to a skilled virtual assistant.</p>
      </header>

      <div className="bi-calculator__grid">
        <div className="bi-calculator__controls" aria-label="Illustrative calculator inputs">
          {CALCULATOR_FIELDS.map((field) => (
            <RangeControl
              key={field.key}
              field={field}
              value={values[field.key]}
              onChange={(value) => setValue(field.key, value)}
            />
          ))}
        </div>

        <aside className="bi-results" aria-labelledby="bi-results-title" aria-live="polite">
          <div className="bi-results__top">
            <span className="bi-eyebrow">ILLUSTRATIVE ESTIMATE</span>
            <h3 id="bi-results-title">Your time, back in focus.</h3>
            <strong className={annualPotentialSavings < 0 ? 'is-negative' : ''}>
              {formatCurrency(annualPotentialSavings)}
            </strong>
            <span>Estimated annual potential savings</span>
          </div>
          <dl className="bi-results__list">
            <div><dt>Estimated annual value of time freed up</dt><dd>{formatCurrency(annualTimeValue)}</dd></div>
            <div><dt>Estimated annual VA cost</dt><dd>{formatCurrency(annualAssistantCost)}</dd></div>
            <div><dt>Hours returned per year</dt><dd>{formatHours(hoursReturned)}</dd></div>
          </dl>
          <div className="bi-results__formula">
            <strong>How it is calculated</strong>
            <p>Hours returned = hours delegated/week × task share × working weeks.</p>
            <p>Annual time value = hours returned × your hourly value.</p>
            <p>Annual VA cost = hours returned × VA hourly rate.</p>
            <p>Potential savings = annual time value − estimated VA cost.</p>
          </div>
        </aside>
      </div>
      <p className="bi-disclaimer">Illustrative estimates only. Actual time, costs, and business outcomes vary; savings are not guaranteed.</p>
    </section>
  )
}

function ServicePackageCard({ packageInfo, featured = false }: {
  packageInfo: (typeof servicePackages)[number]
  featured?: boolean
}) {
  return (
    <article className={`bi-package${featured ? ' bi-package--featured' : ''}`}>
      <div className="bi-package__top">
        <span className="bi-eyebrow">{packageInfo.subtitle}</span>
        {featured && <span className="bi-package__badge">Expanded support</span>}
      </div>
      <h3>{packageInfo.name}</h3>
      <p className="bi-package__description">{packageInfo.description}</p>
      {featured && <p className="bi-package__included">Everything in Starter, plus:</p>}
      <ul>
        {packageInfo.includes.map((item) => (
          <li key={item}><CheckCircle size={16} weight="fill" aria-hidden="true" />{item}</li>
        ))}
      </ul>
      <Link className="bi-button bi-button--outline" to="/contact">
        Request a Quote <ArrowUpRight size={16} aria-hidden="true" />
      </Link>
    </article>
  )
}

function ServicePackages() {
  return (
    <section className="bi-section" aria-labelledby="bi-packages-title">
      <header className="bi-section__heading">
        <span className="bi-eyebrow">02 / SERVICE PACKAGES</span>
        <h2 id="bi-packages-title">Support that fits the way you work.</h2>
        <p>Choose a focused starting point or bring more of your digital operations together.</p>
      </header>
      <div className="bi-package-grid">
        {servicePackages.map((packageInfo) => (
          <ServicePackageCard
            key={packageInfo.id}
            packageInfo={packageInfo}
            featured={packageInfo.id === 'premium'}
          />
        ))}
      </div>
    </section>
  )
}

function ProjectPanel({ project, active }: { project: BusinessProject; active: boolean }) {
  return (
    <div
      className="bi-project-panel"
      role="tabpanel"
      id={`bi-panel-${project.id}`}
      aria-labelledby={`bi-tab-${project.id}`}
      hidden={!active}
      tabIndex={0}
    >
      <div className={`bi-project-gallery${project.screenshots.length > 1 ? ' bi-project-gallery--multiple' : ''}`}>
        {project.screenshots.map((screenshot) => (
          <figure className="bi-project-shot" key={screenshot.src}>
            <a href={screenshot.src} target="_blank" rel="noreferrer" aria-label={`Open full image: ${screenshot.caption}`}>
              <img src={screenshot.src} alt={screenshot.alt} loading="lazy" decoding="async" />
              <span className="bi-project-shot__open"><ArrowUpRight size={16} aria-hidden="true" /></span>
            </a>
            <figcaption>{screenshot.caption}</figcaption>
          </figure>
        ))}
      </div>

      <div className="bi-project-copy">
        <span className="bi-eyebrow">{project.eyebrow}</span>
        <h3>{project.title}</h3>
        <p>{project.description}</p>
        <div className="bi-project-meta">
          <h4>Tools and platforms</h4>
          <ul className="bi-tags">{project.tools.map((tool) => <li key={tool}>{tool}</li>)}</ul>
        </div>
        <div className="bi-project-meta">
          <h4>Capabilities demonstrated</h4>
          <ul className="bi-capabilities">
            {project.capabilities.map((capability) => (
              <li key={capability}><CheckCircle size={15} weight="fill" aria-hidden="true" />{capability}</li>
            ))}
          </ul>
        </div>
        {project.link.appRoute ? (
          <Link className="bi-button bi-button--text" to={project.link.href}>
            {project.link.label} <ArrowUpRight size={16} aria-hidden="true" />
          </Link>
        ) : (
          <a className="bi-button bi-button--text" href={project.link.href}>
            {project.link.label} <ArrowUpRight size={16} aria-hidden="true" />
          </a>
        )}
      </div>
    </div>
  )
}

function ProjectShowcase() {
  const [activeProject, setActiveProject] = useState(businessProjects[0].id)
  const tabsRef = useRef<Array<HTMLButtonElement | null>>([])

  const onTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    let nextIndex: number | null = null
    if (event.key === 'ArrowRight') nextIndex = (index + 1) % businessProjects.length
    if (event.key === 'ArrowLeft') nextIndex = (index - 1 + businessProjects.length) % businessProjects.length
    if (event.key === 'Home') nextIndex = 0
    if (event.key === 'End') nextIndex = businessProjects.length - 1
    if (nextIndex === null) return
    event.preventDefault()
    setActiveProject(businessProjects[nextIndex].id)
    tabsRef.current[nextIndex]?.focus()
  }

  return (
    <section className="bi-section" aria-labelledby="bi-projects-title">
      <header className="bi-section__heading">
        <span className="bi-eyebrow">03 / SELECTED WORK</span>
        <h2 id="bi-projects-title">A closer look at the work.</h2>
        <p>Browse real portfolio work and the operational capabilities behind each project.</p>
      </header>
      <div className="bi-project-showcase">
        <div className="bi-tabs" role="tablist" aria-label="Project categories">
          {businessProjects.map((item, index) => (
            <button
              key={item.id}
              ref={(element) => { tabsRef.current[index] = element }}
              id={`bi-tab-${item.id}`}
              className={`bi-tab${item.id === activeProject ? ' is-active' : ''}`}
              type="button"
              role="tab"
              aria-selected={item.id === activeProject}
              aria-controls={`bi-panel-${item.id}`}
              tabIndex={item.id === activeProject ? 0 : -1}
              onClick={() => setActiveProject(item.id)}
              onKeyDown={(event) => onTabKeyDown(event, index)}
            >
              <span>{String(index + 1).padStart(2, '0')}</span>{item.tab}
            </button>
          ))}
        </div>
        {businessProjects.map((item) => (
          <ProjectPanel key={item.id} project={item} active={item.id === activeProject} />
        ))}
      </div>
      <p className="bi-project-disclaimer">Project previews describe portfolio work only; sample dashboard figures are illustrative and do not represent client results.</p>
    </section>
  )
}

export default function BusinessImpactPage() {
  return (
    <section className="pgrid business-impact-page" aria-labelledby="bi-page-title">
      <header className="pgrid__head">
        <span className="pgrid__eyebrow">Business Support &amp; Digital Operations</span>
        <h1 className="pgrid__title" id="bi-page-title">Make room for the work that moves you forward.</h1>
        <p className="pgrid__lede">Explore an illustrative value estimate, flexible support packages, and selected ecommerce, web, and automation work.</p>
      </header>
      <div className="business-impact-content">
        <BusinessValueCalculator />
        <ServicePackages />
        <ProjectShowcase />
        <footer className="bi-page-footer">
          <span>Have a specific workflow in mind?</span>
          <Link className="bi-button bi-button--primary" to="/contact">
            Let&apos;s discuss it <ArrowUpRight size={16} aria-hidden="true" />
          </Link>
        </footer>
      </div>
    </section>
  )
}
