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

  describe('clients namespace', () => {
    it('both locales have address field keys', () => {
      for (const locale of locales) {
        const { clients } = translations[locale]
        expect(clients).toHaveProperty('street')
        expect(clients).toHaveProperty('city')
        expect(clients).toHaveProperty('zip')
        expect(clients).toHaveProperty('country')
      }
    })

    it('et has Estonian address labels', () => {
      const { clients } = translations.et
      expect(clients.street).toBe('Tänav, maja, korter')
      expect(clients.city).toBe('Linn')
      expect(clients.zip).toBe('Sihtnumber')
      expect(clients.country).toBe('Riik')
    })

    it('en has English address labels', () => {
      const { clients } = translations.en
      expect(clients.street).toBe('Street, building, apartment')
      expect(clients.city).toBe('City')
      expect(clients.zip).toBe('Postal code')
      expect(clients.country).toBe('Country')
    })

    it('both locales have core client keys', () => {
      for (const locale of locales) {
        const { clients } = translations[locale]
        expect(clients).toHaveProperty('name')
        expect(clients).toHaveProperty('regCode')
        expect(clients).toHaveProperty('addClient')
        expect(clients).toHaveProperty('editClient')
        expect(clients).toHaveProperty('deleteTitle')
      }
    })
  })
})
