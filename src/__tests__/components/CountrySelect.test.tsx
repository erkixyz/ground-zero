import { render, screen } from '@testing-library/react'
import { vi } from 'vitest'

vi.mock('react-country-flag', () => ({
  default: ({ countryCode }: { countryCode: string }) => (
    <span data-testid={`flag-${countryCode}`} />
  ),
}))

import CountrySelect from '@/app/clients/components/CountrySelect'

describe('CountrySelect', () => {
  it('renders without crashing', () => {
    render(<CountrySelect label="Riik" locale="en" />)
    expect(screen.getByRole('combobox')).toBeInTheDocument()
  })

  it('renders with the given label', () => {
    render(<CountrySelect label="Riik" locale="et" />)
    expect(screen.getByLabelText(/riik/i)).toBeInTheDocument()
  })

  it('hidden input has empty value when no default', () => {
    const { container } = render(<CountrySelect label="Riik" locale="en" />)
    const hidden = container.querySelector('input[name="country"]') as HTMLInputElement
    expect(hidden).toBeInTheDocument()
    expect(hidden.value).toBe('')
  })

  it('hidden input reflects the default country code', () => {
    const { container } = render(<CountrySelect label="Riik" locale="en" defaultValue="EE" />)
    const hidden = container.querySelector('input[name="country"]') as HTMLInputElement
    expect(hidden.value).toBe('EE')
  })

  it('shows Estonia as display name for EE in English locale', () => {
    render(<CountrySelect label="Country" locale="en" defaultValue="EE" />)
    const combobox = screen.getByRole('combobox') as HTMLInputElement
    expect(combobox.value).toBe('Estonia')
  })

  it('shows Eesti as display name for EE in Estonian locale', () => {
    render(<CountrySelect label="Riik" locale="et" defaultValue="EE" />)
    const combobox = screen.getByRole('combobox') as HTMLInputElement
    expect(combobox.value).toBe('Eesti')
  })

  it('shows flag for the selected country', () => {
    render(<CountrySelect label="Riik" locale="en" defaultValue="EE" />)
    expect(screen.getByTestId('flag-EE')).toBeInTheDocument()
  })

  it('renders with no default (null) without errors', () => {
    const { container } = render(<CountrySelect label="Riik" locale="en" defaultValue={null} />)
    const hidden = container.querySelector('input[name="country"]') as HTMLInputElement
    expect(hidden.value).toBe('')
    expect(screen.queryByTestId(/^flag-/)).toBeNull()
  })

  it('supports different country codes', () => {
    const { container } = render(<CountrySelect label="Riik" locale="en" defaultValue="FI" />)
    const hidden = container.querySelector('input[name="country"]') as HTMLInputElement
    expect(hidden.value).toBe('FI')

    const combobox = screen.getByRole('combobox') as HTMLInputElement
    expect(combobox.value).toBe('Finland')
  })
})
