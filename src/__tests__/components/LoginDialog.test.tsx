import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import LoginDialog from '@/app/components/LoginDialog'
import { translations } from '@/i18n'

const t = translations.et

const mockLogin = vi.fn()
const mockSignUp = vi.fn()

vi.mock('@/app/components/AuthProvider', () => ({
  useAuth: () => ({ login: mockLogin, signUp: mockSignUp, user: null, loading: false, logout: vi.fn() }),
}))

vi.mock('@/context/LanguageContext', () => ({
  useLanguage: () => ({ locale: 'et', t, setLocale: vi.fn() }),
}))

vi.mock('@/app/auth-client', () => ({
  authClient: {
    signIn: {
      social: vi.fn().mockResolvedValue({}),
    },
    requestPasswordReset: vi.fn().mockResolvedValue({ error: null }),
  },
}))

describe('LoginDialog', () => {
  const onClose = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mockLogin.mockResolvedValue(null)
    mockSignUp.mockResolvedValue(null)
  })

  describe('login view', () => {
    it('renders login dialog with email and password fields', () => {
      render(<LoginDialog open={true} onClose={onClose} />)
      expect(screen.getByRole('heading', { name: t.login.title })).toBeInTheDocument()
      expect(screen.getByLabelText(new RegExp(t.login.email, 'i'))).toBeInTheDocument()
      expect(screen.getByLabelText(new RegExp(t.login.password, 'i'))).toBeInTheDocument()
    })

    it('renders cancel and submit buttons', () => {
      render(<LoginDialog open={true} onClose={onClose} />)
      expect(screen.getByRole('button', { name: t.login.cancel })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: t.login.submit })).toBeInTheDocument()
    })

    it('is not visible when open=false', () => {
      render(<LoginDialog open={false} onClose={onClose} />)
      // When closed, dialog should not be accessible via role (MUI sets aria-hidden)
      expect(screen.queryByRole('dialog')).toBeNull()
    })

    it('calls onClose when cancel button clicked', () => {
      render(<LoginDialog open={true} onClose={onClose} />)
      fireEvent.click(screen.getByRole('button', { name: t.login.cancel }))
      expect(onClose).toHaveBeenCalled()
    })

    it('calls login with email and password on submit', async () => {
      render(<LoginDialog open={true} onClose={onClose} />)
      fireEvent.change(screen.getByLabelText(new RegExp(t.login.email, 'i')), {
        target: { value: 'kasutaja@test.ee' },
      })
      fireEvent.change(screen.getByLabelText(new RegExp(t.login.password, 'i')), {
        target: { value: 'parool123' },
      })
      fireEvent.submit(screen.getByRole('button', { name: t.login.submit }).closest('form')!)

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith('kasutaja@test.ee', 'parool123')
      })
    })

    it('shows error message on failed login', async () => {
      mockLogin.mockResolvedValue('Vale e-posti aadress või parool')
      render(<LoginDialog open={true} onClose={onClose} />)
      fireEvent.change(screen.getByLabelText(new RegExp(t.login.email, 'i')), {
        target: { value: 'vale@test.ee' },
      })
      fireEvent.change(screen.getByLabelText(new RegExp(t.login.password, 'i')), {
        target: { value: 'valeParool' },
      })
      fireEvent.submit(screen.getByRole('button', { name: t.login.submit }).closest('form')!)

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument()
      })
    })

    it('closes on successful login', async () => {
      mockLogin.mockResolvedValue(null)
      render(<LoginDialog open={true} onClose={onClose} />)
      fireEvent.change(screen.getByLabelText(new RegExp(t.login.email, 'i')), {
        target: { value: 'kasutaja@test.ee' },
      })
      fireEvent.change(screen.getByLabelText(new RegExp(t.login.password, 'i')), {
        target: { value: 'parool123' },
      })
      fireEvent.submit(screen.getByRole('button', { name: t.login.submit }).closest('form')!)

      await waitFor(() => {
        expect(onClose).toHaveBeenCalled()
      })
    })

    it('switches to forgot password view', () => {
      render(<LoginDialog open={true} onClose={onClose} />)
      fireEvent.click(screen.getByText(t.login.forgotPassword))
      expect(screen.getByText(t.login.forgotTitle)).toBeInTheDocument()
    })

    it('switches to register view', () => {
      render(<LoginDialog open={true} onClose={onClose} />)
      fireEvent.click(screen.getByText(t.login.createAccount))
      expect(screen.getByRole('heading', { name: t.register.title })).toBeInTheDocument()
    })
  })

  describe('register view', () => {
    const switchToRegister = () => {
      render(<LoginDialog open={true} onClose={onClose} />)
      fireEvent.click(screen.getByText(t.login.createAccount))
    }

    it('shows password mismatch error', async () => {
      switchToRegister()
      fireEvent.change(screen.getByLabelText(new RegExp(t.register.firstName, 'i')), { target: { value: 'Erki' } })
      fireEvent.change(screen.getByLabelText(new RegExp(t.register.lastName, 'i')), { target: { value: 'K' } })
      fireEvent.change(screen.getByLabelText(new RegExp(t.register.email, 'i')), { target: { value: 'e@test.ee' } })

      // Get all password fields
      const pwFields = screen.getAllByLabelText(/parool/i)
      fireEvent.change(pwFields[0], { target: { value: 'parool123' } })
      fireEvent.change(pwFields[1], { target: { value: 'teineparool' } })

      fireEvent.submit(screen.getByRole('button', { name: t.register.submit }).closest('form')!)

      await waitFor(() => {
        expect(screen.getByText(t.register.passwordMismatch)).toBeInTheDocument()
      })
    })

    it('shows password too short error', async () => {
      switchToRegister()
      fireEvent.change(screen.getByLabelText(new RegExp(t.register.firstName, 'i')), { target: { value: 'Erki' } })
      fireEvent.change(screen.getByLabelText(new RegExp(t.register.lastName, 'i')), { target: { value: 'K' } })
      fireEvent.change(screen.getByLabelText(new RegExp(t.register.email, 'i')), { target: { value: 'e@test.ee' } })

      const pwFields = screen.getAllByLabelText(/parool/i)
      fireEvent.change(pwFields[0], { target: { value: '123' } })
      fireEvent.change(pwFields[1], { target: { value: '123' } })

      fireEvent.submit(screen.getByRole('button', { name: t.register.submit }).closest('form')!)

      await waitFor(() => {
        expect(screen.getByText(t.register.passwordTooShort)).toBeInTheDocument()
      })
    })

    it('calls signUp with correct data on valid submit', async () => {
      switchToRegister()
      fireEvent.change(screen.getByLabelText(new RegExp(t.register.firstName, 'i')), { target: { value: 'Erki' } })
      fireEvent.change(screen.getByLabelText(new RegExp(t.register.lastName, 'i')), { target: { value: 'K' } })
      fireEvent.change(screen.getByLabelText(new RegExp(t.register.email, 'i')), { target: { value: 'erki@test.ee' } })

      const pwFields = screen.getAllByLabelText(/parool/i)
      fireEvent.change(pwFields[0], { target: { value: 'parool123' } })
      fireEvent.change(pwFields[1], { target: { value: 'parool123' } })

      fireEvent.submit(screen.getByRole('button', { name: t.register.submit }).closest('form')!)

      await waitFor(() => {
        expect(mockSignUp).toHaveBeenCalledWith('erki@test.ee', 'parool123', 'Erki', 'K')
      })
    })

    it('switches back to login view', () => {
      switchToRegister()
      fireEvent.click(screen.getByText(t.register.signIn))
      expect(screen.getByRole('heading', { name: t.login.title })).toBeInTheDocument()
    })
  })
})
