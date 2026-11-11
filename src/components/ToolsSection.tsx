import { toolCategories } from '@/data/tools'

export default function ToolsSection() {
  const tools = toolCategories.flatMap((category) => category.tools)
  const sequence = [0, 1]

  return (
    <div className="tools-marquee" aria-label="Tools I work with">
      <div className="tools-marquee__viewport">
        <div className="tools-marquee__track">
          {sequence.map((copy) => (
            <ul className="tools-marquee__group" key={copy} aria-hidden={copy === 1}>
              {tools.map((tool) => (
                <li className="tools-marquee__item" key={`${copy}-${tool.name}`}>
                  <span className="tools-marquee__logo">
                    <img
                      src={tool.iconPath}
                      alt=""
                      aria-hidden="true"
                      width={28}
                      height={28}
                      loading="lazy"
                      decoding="async"
                    />
                  </span>
                  <span className="tools-marquee__label">{tool.name}</span>
                </li>
              ))}
            </ul>
          ))}
        </div>
      </div>
    </div>
  )
}
