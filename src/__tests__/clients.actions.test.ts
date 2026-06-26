import { vi } from 'vitest'

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))
vi.mock('next/headers', () => ({
  headers: vi.fn().mockResolvedValue({ get: vi.fn().mockReturnValue(null) }),
}))

import { createClient, updateClient } from '@/app/clients/actions'

const okResponse = { ok: true, json: async () => ({}) }
const mockFetch = () => (global.fetch as ReturnType<typeof vi.fn>)

describe('createClient', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = vi.fn()
  })

  it('returns error when name is empty', async () => {
    const fd = new FormData()
    fd.append('name', '')
    expect(await createClient(null, fd)).toEqual({ error: 'Nimi on kohustuslik' })
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('returns error when name is only whitespace', async () => {
    const fd = new FormData()
    fd.append('name', '   ')
    expect(await createClient(null, fd)).toEqual({ error: 'Nimi on kohustuslik' })
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('returns error when country is empty', async () => {
    const fd = new FormData()
    fd.append('name', 'Acme OÜ')
    expect(await createClient(null, fd)).toEqual({ error: 'Riik on kohustuslik' })
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('returns { ok: true } on success', async () => {
    mockFetch().mockResolvedValue(okResponse)
    const fd = new FormData()
    fd.append('name', 'Acme OÜ')
    fd.append('country', 'EE')
    expect(await createClient(null, fd)).toEqual({ ok: true })
  })

  it('sends all address fields to the API', async () => {
    mockFetch().mockResolvedValue(okResponse)
    const fd = new FormData()
    fd.append('name', 'Acme OÜ')
    fd.append('regCode', '12345678')
    fd.append('street', 'Pärnu mnt 1')
    fd.append('city', 'Tallinn')
    fd.append('zip', '10148')
    fd.append('country', 'EE')

    await createClient(null, fd)

    const body = JSON.parse(mockFetch().mock.calls[0][1].body)
    expect(body).toMatchObject({
      name: 'Acme OÜ',
      regCode: '12345678',
      street: 'Pärnu mnt 1',
      city: 'Tallinn',
      zip: '10148',
      country: 'EE',
    })
  })

  it('trims whitespace from all fields', async () => {
    mockFetch().mockResolvedValue(okResponse)
    const fd = new FormData()
    fd.append('name', '  Acme OÜ  ')
    fd.append('street', '  Pärnu mnt 1  ')
    fd.append('city', '  Tallinn  ')
    fd.append('country', 'EE')

    await createClient(null, fd)

    const body = JSON.parse(mockFetch().mock.calls[0][1].body)
    expect(body.name).toBe('Acme OÜ')
    expect(body.street).toBe('Pärnu mnt 1')
    expect(body.city).toBe('Tallinn')
  })

  it('sends undefined for empty optional fields', async () => {
    mockFetch().mockResolvedValue(okResponse)
    const fd = new FormData()
    fd.append('name', 'Acme OÜ')
    fd.append('country', 'EE')

    await createClient(null, fd)

    const body = JSON.parse(mockFetch().mock.calls[0][1].body)
    expect(body.regCode).toBeUndefined()
    expect(body.street).toBeUndefined()
    expect(body.city).toBeUndefined()
    expect(body.zip).toBeUndefined()
  })

  it('returns error on network failure', async () => {
    mockFetch().mockRejectedValue(new Error('Network error'))
    const fd = new FormData()
    fd.append('name', 'Acme OÜ')
    fd.append('country', 'EE')
    expect(await createClient(null, fd)).toEqual({ error: 'API ei vasta — kontrolli ühendust' })
  })

  it('returns API error message on non-ok response', async () => {
    mockFetch().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ message: 'Vigane päring' }),
    })
    const fd = new FormData()
    fd.append('name', 'Acme OÜ')
    fd.append('country', 'EE')
    expect(await createClient(null, fd)).toEqual({ error: 'Vigane päring' })
  })

  it('falls back to status code message when API returns no message', async () => {
    mockFetch().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({}),
    })
    const fd = new FormData()
    fd.append('name', 'Acme OÜ')
    fd.append('country', 'EE')
    const result = await createClient(null, fd)
    expect(result).toHaveProperty('error')
    expect((result as { error: string }).error).toContain('500')
  })
})

describe('updateClient', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = vi.fn()
  })

  it('returns error when name is empty', async () => {
    const fd = new FormData()
    fd.append('name', '')
    expect(await updateClient('abc123', null, fd)).toEqual({ error: 'Nimi on kohustuslik' })
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('returns error when country is empty', async () => {
    const fd = new FormData()
    fd.append('name', 'Acme OÜ')
    expect(await updateClient('abc123', null, fd)).toEqual({ error: 'Riik on kohustuslik' })
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('returns { ok: true } on success', async () => {
    mockFetch().mockResolvedValue(okResponse)
    const fd = new FormData()
    fd.append('name', 'Uus Nimi OÜ')
    fd.append('country', 'EE')
    expect(await updateClient('abc123', null, fd)).toEqual({ ok: true })
  })

  it('sends all address fields to the correct endpoint', async () => {
    mockFetch().mockResolvedValue(okResponse)
    const fd = new FormData()
    fd.append('name', 'Acme OÜ')
    fd.append('street', 'Viru 2')
    fd.append('city', 'Tallinn')
    fd.append('zip', '10111')
    fd.append('country', 'EE')

    await updateClient('abc123', null, fd)

    const [url, opts] = mockFetch().mock.calls[0]
    expect(url).toContain('/api/clients/abc123')
    expect(opts.method).toBe('PATCH')

    const body = JSON.parse(opts.body)
    expect(body).toMatchObject({ name: 'Acme OÜ', street: 'Viru 2', city: 'Tallinn', zip: '10111', country: 'EE' })
  })

  it('clears optional address fields when submitted as empty strings', async () => {
    mockFetch().mockResolvedValue(okResponse)
    const fd = new FormData()
    fd.append('name', 'Acme OÜ')
    fd.append('street', '')
    fd.append('city', '')
    fd.append('country', 'EE')

    await updateClient('abc123', null, fd)

    const body = JSON.parse(mockFetch().mock.calls[0][1].body)
    expect(body.street).toBe('')
    expect(body.city).toBe('')
  })

  it('returns error on network failure', async () => {
    mockFetch().mockRejectedValue(new Error('fail'))
    const fd = new FormData()
    fd.append('name', 'Acme OÜ')
    fd.append('country', 'EE')
    expect(await updateClient('abc123', null, fd)).toEqual({ error: 'API ei vasta — kontrolli ühendust' })
  })
})
