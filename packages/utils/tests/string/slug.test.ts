import { toSlug } from '../../src/string/slug'

describe('string/slug', () => {
  it('should convert english text to slug', () => {
    expect(toSlug('Hello World')).toBe('hello-world')
  })

  it('should trim surrounding spaces and merge internal spaces', () => {
    expect(toSlug('  spaces  around  ')).toBe('spaces-around')
  })

  it('should keep CJK characters and numbers', () => {
    expect(toSlug('寶可夢 卡片 001')).toBe('寶可夢-卡片-001')
  })

  it('should merge consecutive hyphens', () => {
    expect(toSlug('PKM---001')).toBe('pkm-001')
  })

  it('should remove unsafe special characters', () => {
    expect(toSlug('Hello@World#2026!')).toBe('helloworld2026')
  })

  it('should return empty string for empty input', () => {
    expect(toSlug('')).toBe('')
  })

  it('should return empty string when only hyphens remain', () => {
    expect(toSlug('---')).toBe('')
  })
})
