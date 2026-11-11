const PEARL_WHITE_IMAGE = '/projects/pearl-white.png'

export default function WorkflowSamples() {
  return (
    <section className="wfs" id="workflow-samples" aria-labelledby="wfs-title">
      <figure className="wfs__project">
        <div className="wfs__image-wrap">
          <img
            className="wfs__image"
            src={PEARL_WHITE_IMAGE}
            alt="Pearl White Airbnb website preview"
            decoding="async"
          />
        </div>
        <figcaption className="wfs__details">
          <span className="wfs__eyebrow">Hospitality website</span>
          <h2 className="wfs__title" id="wfs-title">Pearl White</h2>
          <p className="wfs__description">
            A premium Airbnb website and booking experience designed to showcase the property
            and create a polished guest journey.
          </p>
        </figcaption>
      </figure>
    </section>
  )
}
