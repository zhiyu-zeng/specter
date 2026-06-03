import { describe, expect, it } from 'vitest'
import { getPresetColors, presetClosestTo } from './color-utils.js'

describe('getPresetColors', () => {
  it('returns colors for a known preset (blue)', () => {
    const colors = getPresetColors('blue', false)
    expect(colors).not.toBeNull()
    expect(colors!['--md-sys-color-primary']).toBeDefined()
    expect(colors!['--md-sys-color-on-primary']).toBeDefined()
  })

  it('returns colors for dark mode', () => {
    const light = getPresetColors('red', false)
    const dark = getPresetColors('red', true)
    expect(light).not.toBeNull()
    expect(dark).not.toBeNull()
    expect(light!['--md-sys-color-primary']).not.toBe(dark!['--md-sys-color-primary'])
  })

  it('returns null for unknown preset', () => {
    expect(getPresetColors('nonexistent', false)).toBeNull()
  })

  it('returns colors for all known presets', () => {
    const presets = ['blue', 'red', 'green', 'yellow', 'purple', 'orange', 'pink', 'cyan', 'grey']
    for (const p of presets) {
      expect(getPresetColors(p, true)).not.toBeNull()
      expect(getPresetColors(p, false)).not.toBeNull()
    }
  })
})

describe('presetClosestTo', () => {
  it('returns blue for blue-ish seed', () => {
    expect(presetClosestTo('#1157CE')).toBe('blue')
  })

  it('returns red for red-ish seed', () => {
    expect(presetClosestTo('#B3251E')).toBe('red')
  })

  it('returns green for green-ish seed', () => {
    expect(presetClosestTo('#006C35')).toBe('green')
  })

  it('returns blue for low-saturation seed (grey fallback)', () => {
    expect(presetClosestTo('#AAAAAA')).toBe('blue')
  })
})
