import { render, screen, fireEvent } from '@testing-library/react'
import { vi } from 'vitest'
import { translations } from '@/i18n'

const t = translations.et

// useActionState controls state shown in the dialog; hoisted so it can be changed per test
const mockUseActionState = vi.hoisted(() => vi.fn())

vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react')>()
  return { ...actual, useActionState: mockUseActionState }
})

vi.mock('@/context/LanguageContext', () => ({
  useLanguage: () => ({ locale: 'et', t, setLocale: vi.fn() }),
}))

vi.mock('@/app/clients/actions', () => ({
  createClient: vi.fn(),
  updateClient: vi.fn(),
}))

vi.mock('@/app/clients/components/CountrySelect', () => ({
  default: ({ defaultValue }: { defaultValue?: string }) => (
    <input name="country" defaultValue={defaultValue ?? ''} data-testid="country-select" readOnly />
  ),
}))

vi.mock('@/config', () => ({ DEFAULT_COUNTRY: 'EE' }))

import ClientFormDialog, { type ClientRow } from '@/app/clients/components/ClientFormDialog'

const mockClient: ClientRow = {
  id: 'client-1',
  name: 'Acme OÜ',
  regCode: '12345678',
  street: 'Pärnu mnt 1',
  city: 'Tallinn',
  zip: '10148',
  country: 'EE',
  createdAt: '2026-01-01T00:00:00.000Z',
}

describe('ClientFormDialog', () => {
  const onClose = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mockUseActionState.mockReturnValue([null, vi.fn(), false])
  })

  describe('create mode (client=null)', () => {
    it('renders dialog with correct title', () => {
      render(<ClientFormDialog open={true} client={null} onClose={onClose} />)
      expect(screen.getByText(t.clients.addClient2)).toBeInTheDocument()
    })

    it('renders all form fields', () => {
      render(<ClientFormDialog open={true} client={null} onClose={onClose} />)
      expect(screen.getByLabelText(new RegExp(t.clients.name, 'i'))).toBeInTheDocument()
      expect(screen.getByLabelText(new RegExp(t.clients.regCode, 'i'))).toBeInTheDocument()
      expect(screen.getByLabelText(new RegExp(t.clients.street, 'i'))).toBeInTheDocument()
      expect(screen.getByLabelText(new RegExp(t.clients.zip, 'i'))).toBeInTheDocument()
      expect(screen.getByLabelText(new RegExp(t.clients.city, 'i'))).toBeInTheDocument()
      expect(screen.getByTestId('country-select')).toBeInTheDocument()
    })

    it('name field is empty by default', () => {
      render(<ClientFormDialog open={true} client={null} onClose={onClose} />)
      const nameField = screen.getByLabelText(new RegExp(t.clients.name, 'i')) as HTMLInputElement
      expect(nameField.value).toBe('')
    })

    it('uses DEFAULT_COUNTRY for country field', () => {
      render(<ClientFormDialog open={true} client={null} onClose={onClose} />)
      const countryInput = screen.getByTestId('country-select') as HTMLInputElement
      expect(countryInput.value).toBe('EE')
    })

    it('renders add button', () => {
      render(<ClientFormDialog open={true} client={null} onClose={onClose} />)
      expect(screen.getByRole('button', { name: t.clients.add })).toBeInTheDocument()
    })
  })

  describe('edit mode', () => {
    it('shows edit title', () => {
      render(<ClientFormDialog open={true} client={mockClient} onClose={onClose} />)
      expect(screen.getByText(t.clients.editClient)).toBeInTheDocument()
    })

    it('pre-fills name field', () => {
      render(<ClientFormDialog open={true} client={mockClient} onClose={onClose} />)
      const nameField = screen.getByLabelText(new RegExp(t.clients.name, 'i')) as HTMLInputElement
      expect(nameField.value).toBe('Acme OÜ')
    })

    it('pre-fills regCode field', () => {
      render(<ClientFormDialog open={true} client={mockClient} onClose={onClose} />)
      const regField = screen.getByLabelText(new RegExp(t.clients.regCode, 'i')) as HTMLInputElement
      expect(regField.value).toBe('12345678')
    })

    it('pre-fills street field', () => {
      render(<ClientFormDialog open={true} client={mockClient} onClose={onClose} />)
      const streetField = screen.getByLabelText(new RegExp(t.clients.street, 'i')) as HTMLInputElement
      expect(streetField.value).toBe('Pärnu mnt 1')
    })

    it('pre-fills zip and city fields', () => {
      render(<ClientFormDialog open={true} client={mockClient} onClose={onClose} />)
      const zipField = screen.getByLabelText(new RegExp(t.clients.zip, 'i')) as HTMLInputElement
      const cityField = screen.getByLabelText(new RegExp(t.clients.city, 'i')) as HTMLInputElement
      expect(zipField.value).toBe('10148')
      expect(cityField.value).toBe('Tallinn')
    })

    it('pre-fills country via CountrySelect', () => {
      render(<ClientFormDialog open={true} client={mockClient} onClose={onClose} />)
      const countryInput = screen.getByTestId('country-select') as HTMLInputElement
      expect(countryInput.value).toBe('EE')
    })

    it('renders save button', () => {
      render(<ClientFormDialog open={true} client={mockClient} onClose={onClose} />)
      expect(screen.getByRole('button', { name: t.clients.save })).toBeInTheDocument()
    })
  })

  describe('error state', () => {
    it('shows error alert when state has error', () => {
      mockUseActionState.mockReturnValue([{ error: 'Nimi on kohustuslik' }, vi.fn(), false])
      render(<ClientFormDialog open={true} client={null} onClose={onClose} />)
      expect(screen.getByRole('alert')).toBeInTheDocument()
      expect(screen.getByText('Nimi on kohustuslik')).toBeInTheDocument()
    })

    it('does not show alert when state is null', () => {
      render(<ClientFormDialog open={true} client={null} onClose={onClose} />)
      expect(screen.queryByRole('alert')).toBeNull()
    })
  })

  describe('cancel button', () => {
    it('calls onClose when cancel is clicked', () => {
      render(<ClientFormDialog open={true} client={null} onClose={onClose} />)
      fireEvent.click(screen.getByRole('button', { name: t.clients.cancel }))
      expect(onClose).toHaveBeenCalledOnce()
    })

    it('cancel button is not disabled when not pending', () => {
      render(<ClientFormDialog open={true} client={null} onClose={onClose} />)
      expect(screen.getByRole('button', { name: t.clients.cancel })).not.toBeDisabled()
    })

    it('cancel button is disabled when pending', () => {
      mockUseActionState.mockReturnValue([null, vi.fn(), true])
      render(<ClientFormDialog open={true} client={null} onClose={onClose} />)
      expect(screen.getByRole('button', { name: t.clients.cancel })).toBeDisabled()
    })
  })

  it('is not visible when open=false', () => {
    render(<ClientFormDialog open={false} client={null} onClose={onClose} />)
    expect(screen.queryByRole('dialog')).toBeNull()
  })
})
