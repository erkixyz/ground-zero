import { vi } from 'vitest'

// Mock Next.js server modules before importing actions
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

vi.mock('next/headers', () => ({
  headers: vi.fn().mockResolvedValue({ get: vi.fn().mockReturnValue(null) }),
}))

import { createNote, deleteNote, sendNote } from '@/app/actions'

describe('createNote', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = vi.fn()
  })

  it('returns error when title is empty', async () => {
    const formData = new FormData()
    formData.append('title', '')
    formData.append('content', 'Sisu')

    const result = await createNote(null, formData)

    expect(result).toEqual({ error: 'Pealkiri on kohustuslik' })
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('returns error when content is empty', async () => {
    const formData = new FormData()
    formData.append('title', 'Pealkiri')
    formData.append('content', '')

    const result = await createNote(null, formData)

    expect(result).toEqual({ error: 'Sisu on kohustuslik' })
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('returns error when title is only whitespace', async () => {
    const formData = new FormData()
    formData.append('title', '   ')
    formData.append('content', 'Sisu')

    const result = await createNote(null, formData)

    expect(result).toEqual({ error: 'Pealkiri on kohustuslik' })
  })

  it('returns noteId on successful creation', async () => {
    const formData = new FormData()
    formData.append('title', 'Uus märge')
    formData.append('content', 'Märke sisu')

    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ id: 42 }),
    })

    const result = await createNote(null, formData)

    expect(result).toEqual({ noteId: 42 })
  })

  it('returns error when fetch fails with network error', async () => {
    const formData = new FormData()
    formData.append('title', 'Märge')
    formData.append('content', 'Sisu')

    ;(global.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Network error'))

    const result = await createNote(null, formData)

    expect(result).toEqual({ error: 'API ei vasta — kontrolli ühendust' })
  })

  it('returns error when API returns non-ok status', async () => {
    const formData = new FormData()
    formData.append('title', 'Märge')
    formData.append('content', 'Sisu')

    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ message: 'Sisemine viga' }),
    })

    const result = await createNote(null, formData)

    expect(result).toEqual({ error: 'Sisemine viga' })
  })

  it('passes pinned state correctly', async () => {
    const formData = new FormData()
    formData.append('title', 'Märge')
    formData.append('content', 'Sisu')
    formData.append('pinned', 'on')
    formData.append('category', 'too')

    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ id: 1 }),
    })

    await createNote(null, formData)

    const call = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0]
    const body = JSON.parse(call[1].body)
    expect(body.pinned).toBe(true)
    expect(body.category).toBe('too')
  })
})

describe('sendNote', () => {
  beforeEach(() => {
    global.fetch = vi.fn()
  })

  it('returns null on success', async () => {
    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
    })

    const result = await sendNote(1, 'saaja@test.ee')

    expect(result).toBeNull()
  })

  it('returns error when API fails', async () => {
    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({ message: 'Märget ei leitud' }),
    })

    const result = await sendNote(1, 'saaja@test.ee')

    expect(result).toEqual({ error: 'Märget ei leitud' })
  })

  it('returns error on network failure', async () => {
    ;(global.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Network error'))

    const result = await sendNote(1, 'saaja@test.ee')

    expect(result).toEqual({ error: 'API ei vasta — kontrolli ühendust' })
  })

  it('sends correct request to API', async () => {
    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: true })

    await sendNote(5, 'saaja@test.ee')

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/notes/5/send'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ email: 'saaja@test.ee' }),
      }),
    )
  })
})
