import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { X } from '@/components/slab'
import type { Funnel } from '@/data/funnels'
import type { GraphicDesign } from '@/data/graphics-design'
import type { CarouselItem } from './FunnelBarrel'

/**
 * The in-page funnel preview: a browser-chrome dialog that iframes the real
 * page so a visitor never leaves the portfolio.
 *
 * It lives here rather than inside Funnels because two surfaces open it now -
 * the Projects view's full section and the reel on Home. One dialog, one focus
 * contract, one scroll lock.
 */
export function fullSrc(funnel: Funnel) {
  return `/${funnel.dir ?? 'funnels'}/${funnel.file}`
}

export function useFunnelModal() {
  const [preview, setPreview] = useState<
    { type: 'funnel'; item: Funnel } | { type: 'design'; item: GraphicDesign } | null
  >(null)
  // Track what opened the dialog so focus goes back there on close, instead of
  // dumping keyboard users at the top of the document.
  const lastTriggerRef = useRef<HTMLElement | null>(null)
  const closeRef = useRef<HTMLButtonElement | null>(null)

  const openFull = useCallback((next: Funnel, trigger?: HTMLElement | null) => {
    lastTriggerRef.current = trigger ?? (document.activeElement as HTMLElement | null)
    setPreview({ type: 'funnel', item: next })
  }, [])

  const openDesign = useCallback((next: GraphicDesign, trigger?: HTMLElement | null) => {
    lastTriggerRef.current = trigger ?? (document.activeElement as HTMLElement | null)
    setPreview({ type: 'design', item: next })
  }, [])

  const close = useCallback(() => {
    setPreview(null)
    requestAnimationFrame(() => lastTriggerRef.current?.focus())
  }, [])

  // Escape to dismiss, scroll locked while open, focus moved into the dialog.
  useEffect(() => {
    if (!preview) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    requestAnimationFrame(() => closeRef.current?.focus())
    return () => {
      document.removeEventListener('keydown', onKey)
      // Always clear to default - never restore a possibly stale 'hidden'.
      document.body.style.overflow = ''
    }
  }, [preview, close])

  const isDesign = preview?.type === 'design'
  const item = preview?.item
  const title = item?.label ?? ''

  const modal =
    preview &&
    createPortal(
      <div
        className={`funnels__modal${isDesign ? ' funnels__modal--design' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={`${title} preview`}
        onClick={(e) => {
          if (e.target === e.currentTarget) close()
        }}
      >
        <div className="funnels__modal-shell">
          <div className="funnels__modal-bar">
            <div className="funnels__modal-lights" aria-hidden="true">
              <span className="funnels__modal-light funnels__modal-light--red" />
              <span className="funnels__modal-light funnels__modal-light--amber" />
              <span className="funnels__modal-light funnels__modal-light--green" />
            </div>
            <div className="funnels__modal-url" aria-hidden="true">
              <span className="funnels__modal-url-scheme">yoursite.com</span>
              <span className="funnels__modal-url-path">
                {isDesign && preview.type === 'design'
                  ? preview.item.imageSrc
                  : preview.type === 'funnel'
                    ? fullSrc(preview.item)
                    : ''}
              </span>
            </div>
            <div className="funnels__modal-actions">
              <button
                ref={closeRef}
                type="button"
                className="funnels__modal-close"
                onClick={close}
                aria-label="Close preview"
              >
                <X weight="bold" size={18} aria-hidden="true" />
              </button>
            </div>
          </div>
          {preview.type === 'design' ? (
            <div className="graphics-preview">
              <img
                className="graphics-preview__image"
                src={preview.item.imageSrc}
                alt={preview.item.label}
              />
              <div className="graphics-preview__copy">
                <span className="graphics-preview__tag">{preview.item.tag}</span>
                <h2 className="graphics-preview__title">{preview.item.label}</h2>
                <p className="graphics-preview__desc">{preview.item.desc}</p>
              </div>
            </div>
          ) : preview.type === 'funnel' ? (
            <iframe
              className="funnels__modal-iframe"
              src={fullSrc(preview.item)}
              title={preview.item.label}
              sandbox="allow-same-origin allow-forms allow-scripts allow-popups"
            />
          ) : null}
        </div>
      </div>,
      document.body,
    )

  const openItem = useCallback((next: CarouselItem, trigger?: HTMLElement | null) => {
    if ('imageSrc' in next) openDesign(next, trigger)
    else openFull(next, trigger)
  }, [openDesign, openFull])

  return { openFull, openItem, modal }
}
