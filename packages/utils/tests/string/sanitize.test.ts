import { sanitizeHtml, truncate } from '../../src/string/sanitize'

describe('string/sanitize', () => {
  describe('sanitizeHtml', () => {
    it('should escape script-like content', () => {
      expect(sanitizeHtml('<script>alert("xss")</script>')).toBe(
        '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
      )
    })

    it('should escape ampersand', () => {
      expect(sanitizeHtml('Tom & Jerry')).toBe('Tom &amp; Jerry')
    })

    it('should escape single quote', () => {
      expect(sanitizeHtml("it's")).toBe('it&#39;s')
    })

    it('should return empty string for empty input', () => {
      expect(sanitizeHtml('')).toBe('')
    })

    it('should keep plain text unchanged', () => {
      expect(sanitizeHtml('plain text')).toBe('plain text')
    })
  })

  describe('truncate', () => {
    it('should truncate long text with default suffix', () => {
      expect(truncate('這是一段很長的文字', 6)).toBe('這是一...')
    })

    it('should not truncate short text', () => {
      expect(truncate('短', 10)).toBe('短')
    })

    it('should truncate english text correctly', () => {
      expect(truncate('Hello World', 8)).toBe('Hello...')
    })

    it('should return original when length equals maxLength', () => {
      expect(truncate('Hello', 5)).toBe('Hello')
    })

    it('should support custom suffix', () => {
      expect(truncate('Hello World', 8, '…')).toBe('Hello W…')
    })

    it('should return empty string for empty input', () => {
      expect(truncate('', 5)).toBe('')
    })

    it('should return sliced suffix when maxLength <= suffix length', () => {
      expect(truncate('Hello World', 2)).toBe('..')
      expect(truncate('Hello World', 3)).toBe('...')
    })
  })
})
