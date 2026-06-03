import { describe, expect, it, beforeEach, vi, afterEach } from 'vitest'
import { showToast } from './toast.js'

beforeEach(() => {
  document.body.innerHTML = ''
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('toast accessibility', () => {
  it('has a close button with accessible aria-label', () => {
    showToast('Message')
    const closeBtn = document.querySelector('.md-toast__close')
    expect(closeBtn).not.toBeNull()
    expect(closeBtn!.getAttribute('aria-label')).toBeTruthy()
    expect(closeBtn!.getAttribute('aria-label')!.length).toBeGreaterThan(0)
  })

  it('close button is a <button> for keyboard accessibility', () => {
    showToast('Message')
    const closeBtn = document.querySelector('.md-toast__close')
    expect(closeBtn!.tagName).toBe('BUTTON')
  })

  it('action button is a <button> for keyboard accessibility', () => {
    showToast('Message', { action: 'Undo' })
    const actionBtn = document.querySelector('.md-toast__action')
    expect(actionBtn!.tagName).toBe('BUTTON')
  })

  it('icon uses md-icon element for accessible icon rendering', () => {
    showToast('With icon', { icon: 'check_circle' })
    const icon = document.querySelector('.md-toast__icon')
    expect(icon).not.toBeNull()
    expect(icon!.tagName).toBe('MD-ICON')
  })

  it('toast role is not specified (default div) — interactive content inside handles their own roles', () => {
    const toast = showToast('Message')
    expect(toast.getAttribute('role')).toBeNull()
  })

  it('multiple toasts can coexist without id conflicts', () => {
    showToast('First')
    showToast('Second')
    showToast('Third')
    const toasts = document.querySelectorAll('.md-toast')
    expect(toasts.length).toBe(3)
    const ids = Array.from(toasts).map(t => t.id).filter(Boolean)
    expect(ids.length).toBe(0)
  })
})
