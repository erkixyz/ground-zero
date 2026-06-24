import { render, screen } from '@testing-library/react'
import { vi } from 'vitest'
import NoteCard, { type Note } from '@/app/components/NoteCard'
import { translations } from '@/i18n'

const t = translations.et

vi.mock('@/context/LanguageContext', () => ({
  useLanguage: () => ({ locale: 'et', t, setLocale: vi.fn() }),
}))

vi.mock('@/app/components/DeleteButton', () => ({
  default: () => <button>Kustuta</button>,
}))

vi.mock('@/app/components/SendNoteButton', () => ({
  default: () => <button>Saada</button>,
}))

vi.mock('@/app/components/NoteFileChip', () => ({
  default: ({ filename }: { filename: string }) => <span>{filename}</span>,
}))

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: any) => <a href={href} {...props}>{children}</a>,
}))

const baseNote: Note = {
  id: 1,
  title: 'Testmärge',
  content: 'Sisu tekst siin',
  category: null,
  pinned: false,
  createdAt: '2025-01-15T10:00:00.000Z',
  files: [],
  author: null,
}

describe('NoteCard', () => {
  it('renders note title', () => {
    render(<NoteCard note={baseNote} />)
    expect(screen.getByText('Testmärge')).toBeInTheDocument()
  })

  it('renders note content', () => {
    render(<NoteCard note={baseNote} />)
    expect(screen.getByText('Sisu tekst siin')).toBeInTheDocument()
  })

  it('links to note detail page', () => {
    render(<NoteCard note={baseNote} />)
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/notes/1')
  })

  it('shows Anonymous when author is null', () => {
    render(<NoteCard note={baseNote} />)
    expect(screen.getByText(t.notes.anonymous)).toBeInTheDocument()
  })

  it('shows author name when provided', () => {
    const note: Note = { ...baseNote, author: { firstName: 'Erki', lastName: 'K' } }
    render(<NoteCard note={note} />)
    expect(screen.getByText('Erki K')).toBeInTheDocument()
  })

  it('shows category chip when category set', () => {
    const note: Note = { ...baseNote, category: 'too' }
    render(<NoteCard note={note} />)
    expect(screen.getByText(t.notes.categories.too)).toBeInTheDocument()
  })

  it('does not show category chip when category is null', () => {
    render(<NoteCard note={baseNote} />)
    expect(screen.queryByText(t.notes.categories.too)).not.toBeInTheDocument()
  })

  it('renders file chips for attached files', () => {
    const note: Note = {
      ...baseNote,
      files: [
        { id: 1, filename: 'doc.pdf', key: 'notes/1/doc.pdf', size: 100, mimeType: 'application/pdf', url: 'https://s3/doc.pdf' },
        { id: 2, filename: 'img.jpg', key: 'notes/1/img.jpg', size: 200, mimeType: 'image/jpeg', url: 'https://s3/img.jpg' },
      ],
    }
    render(<NoteCard note={note} />)
    expect(screen.getByText('doc.pdf')).toBeInTheDocument()
    expect(screen.getByText('img.jpg')).toBeInTheDocument()
  })
})
