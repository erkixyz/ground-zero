import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import DeleteButton from '@/app/components/DeleteButton'
import { translations } from '@/i18n'

const mockShowToast = vi.fn()
const mockDeleteNote = vi.fn().mockResolvedValue(undefined)

vi.mock('@/app/components/ToastProvider', () => ({
  useToast: () => ({ showToast: mockShowToast }),
}))

vi.mock('@/context/LanguageContext', () => ({
  useLanguage: () => ({ locale: 'et', t: translations.et, setLocale: vi.fn() }),
}))

vi.mock('@/app/actions', () => ({
  deleteNote: (...args: unknown[]) => mockDeleteNote(...args),
}))

describe('DeleteButton', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockDeleteNote.mockResolvedValue(undefined)
  })

  it('renders delete icon button', () => {
    render(<DeleteButton id={1} />)
    const button = screen.getByRole('button')
    expect(button).toBeInTheDocument()
  })

  it('has correct aria-label from translations', () => {
    render(<DeleteButton id={1} />)
    const button = screen.getByRole('button', { name: translations.et.users.delete })
    expect(button).toBeInTheDocument()
  })

  it('is not disabled initially', () => {
    render(<DeleteButton id={1} />)
    expect(screen.getByRole('button')).not.toBeDisabled()
  })

  it('calls deleteNote with correct id on click', async () => {
    render(<DeleteButton id={42} />)
    fireEvent.click(screen.getByRole('button'))

    await waitFor(() => {
      expect(mockDeleteNote).toHaveBeenCalledWith(42)
    })
  })

  it('shows toast notification after successful delete', async () => {
    render(<DeleteButton id={1} />)
    fireEvent.click(screen.getByRole('button'))

    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith(translations.et.notes.deleted, 'error')
    })
  })
})
