import { renderHook, act } from '@testing-library/react'
import { LanguageProvider, useLanguage } from '@/context/LanguageContext'
import { translations } from '@/i18n'

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <LanguageProvider>{children}</LanguageProvider>
)

describe('LanguageContext', () => {
  beforeEach(() => {
    localStorage.clear()
    document.cookie = ''
  })

  describe('useLanguage', () => {
    it('throws when used outside LanguageProvider', () => {
      expect(() => {
        renderHook(() => useLanguage())
      }).toThrow('useLanguage must be used within LanguageProvider')
    })

    it('defaults to et locale', () => {
      const { result } = renderHook(() => useLanguage(), { wrapper })
      expect(result.current.locale).toBe('et')
    })

    it('provides et translations by default', () => {
      const { result } = renderHook(() => useLanguage(), { wrapper })
      expect(result.current.t.nav.notes).toBe(translations.et.nav.notes)
      expect(result.current.t.notes.addNote).toBe(translations.et.notes.addNote)
    })

    it('switches to en locale and provides en translations', () => {
      const { result } = renderHook(() => useLanguage(), { wrapper })

      act(() => {
        result.current.setLocale('en')
      })

      expect(result.current.locale).toBe('en')
      expect(result.current.t.nav.notes).toBe(translations.en.nav.notes)
    })

    it('persists locale choice in localStorage', () => {
      const { result } = renderHook(() => useLanguage(), { wrapper })

      act(() => {
        result.current.setLocale('en')
      })

      expect(localStorage.getItem('gz-locale')).toBe('en')
    })

    it('sets locale cookie on change', () => {
      const { result } = renderHook(() => useLanguage(), { wrapper })

      act(() => {
        result.current.setLocale('en')
      })

      expect(document.cookie).toContain('gz-locale=en')
    })

    it('restores locale from localStorage on mount', () => {
      localStorage.setItem('gz-locale', 'en')

      const { result } = renderHook(() => useLanguage(), { wrapper })

      // useEffect runs asynchronously, so we check after act
      act(() => {})

      expect(result.current.locale).toBe('en')
    })

    it('ignores invalid locale values in localStorage', () => {
      localStorage.setItem('gz-locale', 'fr')

      const { result } = renderHook(() => useLanguage(), { wrapper })
      act(() => {})

      expect(result.current.locale).toBe('et')
    })
  })
})
