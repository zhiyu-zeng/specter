import { describe, expect, it, beforeEach, vi } from 'vitest'
import { showToast, closeToast } from './toast.js'

beforeEach(() => {
  document.body.innerHTML = ''
  vi.useFakeTimers()
})

describe('showToast', () => {
  it('creates a toast element and appends to body', () => {
    const toast = showToast('Hello world')
    expect(toast).toBeInstanceOf(HTMLElement)
    expect(document.body.contains(toast)).toBe(true)
  })

  it('displays the message text', () => {
    const toast = showToast('Test message')
    expect(toast.textContent).toContain('Test message')
  })

  it('adds type class when type is provided', () => {
    const toast = showToast('Error!', { type: 'error' })
    expect(toast.classList.contains('md-toast--error')).toBe(true)
  })

  it('adds icon when provided', () => {
    const toast = showToast('With icon', { icon: 'check' })
    expect(toast.querySelector('md-icon')).not.toBeNull()
  })

  it('adds action button when action text provided', () => {
    const toast = showToast('Action!', { action: 'Undo' })
    const btn = toast.querySelector('.md-toast__action')
    expect(btn).not.toBeNull()
    expect(btn!.textContent).toBe('Undo')
  })

  it('calls onActionClick when action button clicked', () => {
    const onClick = vi.fn()
    showToast('Action!', { action: 'Undo', onActionClick: onClick })
    const btn = document.querySelector('.md-toast__action') as HTMLButtonElement
    btn.click()
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('auto-closes after autoCloseDelay', () => {
    showToast('Auto close', { autoCloseDelay: 1000 })
    expect(document.querySelector('.md-toast')).not.toBeNull()
    vi.advanceTimersByTime(1000)
    vi.advanceTimersByTime(300)
    expect(document.querySelector('.md-toast')).toBeNull()
  })

  it('does not auto-close when autoCloseDelay is 0', () => {
    showToast('Sticky', { autoCloseDelay: 0 })
    vi.advanceTimersByTime(10000)
    expect(document.querySelector('.md-toast')).not.toBeNull()
  })

  it('closeToast removes the toast', () => {
    const toast = showToast('Close me')
    closeToast(toast)
    vi.advanceTimersByTime(300)
    expect(document.body.contains(toast)).toBe(false)
  })

  it('has close button that removes the toast', () => {
    showToast('Dismiss me')
    const closeBtn = document.querySelector('.md-toast__close') as HTMLButtonElement
    closeBtn.click()
    vi.advanceTimersByTime(300)
    expect(document.querySelector('.md-toast')).toBeNull()
  })
})
