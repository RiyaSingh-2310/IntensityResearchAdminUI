/** Stops wheel / ArrowUp / ArrowDown from changing focused number inputs. */
export function installNumberInputLock() {
  const onWheel = (event: WheelEvent) => {
    const target = event.target
    if (!(target instanceof HTMLInputElement)) return
    if (target.type !== 'number') return
    if (document.activeElement !== target) return
    event.preventDefault()
  }

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return
    const target = event.target
    if (!(target instanceof HTMLInputElement)) return
    if (target.type !== 'number') return
    event.preventDefault()
  }

  document.addEventListener('wheel', onWheel, { passive: false, capture: true })
  document.addEventListener('keydown', onKeyDown, true)

  return () => {
    document.removeEventListener('wheel', onWheel, true)
    document.removeEventListener('keydown', onKeyDown, true)
  }
}
