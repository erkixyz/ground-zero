import { translations } from '@/i18n'

describe('translations', () => {
  const locales = ['et', 'en'] as const

  it.each(locales)('%s locale has all required top-level keys', (locale) => {
    const t = translations[locale]
    expect(t).toHaveProperty('nav')
    expect(t).toHaveProperty('notes')
    expect(t).toHaveProperty('login')
    expect(t).toHaveProperty('register')
    expect(t).toHaveProperty('users')
    expect(t).toHaveProperty('search')
    expect(t).toHaveProperty('common')
  })

  it('et and en have identical key structure', () => {
    const getKeys = (obj: Record<string, unknown>, prefix = ''): string[] => {
      return Object.entries(obj).flatMap(([k, v]) => {
        const full = prefix ? `${prefix}.${k}` : k
        return v && typeof v === 'object' ? getKeys(v as Record<string, unknown>, full) : [full]
      })
    }
    const etKeys = getKeys(translations.et as unknown as Record<string, unknown>).sort()
    const enKeys = getKeys(translations.en as unknown as Record<string, unknown>).sort()
    expect(etKeys).toEqual(enKeys)
  })

  describe('notes namespace', () => {
    it('et has all note category labels', () => {
      const { categories } = translations.et.notes
      expect(categories.isiklik).toBe('Isiklik')
      expect(categories.too).toBe('Töö')
      expect(categories.ideed).toBe('Ideed')
      expect(categories.muu).toBe('Muu')
    })

    it('en has all note category labels', () => {
      const { categories } = translations.en.notes
      expect(categories.isiklik).toBe('Personal')
      expect(categories.too).toBe('Work')
      expect(categories.ideed).toBe('Ideas')
      expect(categories.muu).toBe('Other')
    })
  })

  describe('common namespace', () => {
    it('et uses et-EE locale code', () => {
      expect(translations.et.common.localeCode).toBe('et-EE')
    })

    it('en uses en-US locale code', () => {
      expect(translations.en.common.localeCode).toBe('en-US')
    })
  })

  describe('nav namespace', () => {
    it('all nav items are non-empty strings', () => {
      for (const locale of locales) {
        for (const [key, value] of Object.entries(translations[locale].nav)) {
          expect(typeof value).toBe('string')
          expect((value as string).length).toBeGreaterThan(0)
        }
      }
    })
  })
})
