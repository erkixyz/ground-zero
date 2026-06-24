// Pure utility functions extracted from GlobalSearch.tsx for isolated unit testing

function escapeRegExp(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function getSnippet(content: string, query: string): string {
  const q = query.trim().toLowerCase()
  const idx = content.toLowerCase().indexOf(q)
  if (idx === -1) return content.slice(0, 80) + (content.length > 80 ? '…' : '')
  const start = Math.max(0, idx - 30)
  const end = Math.min(content.length, idx + q.length + 50)
  return (start > 0 ? '…' : '') + content.slice(start, end) + (end < content.length ? '…' : '')
}

describe('escapeRegExp', () => {
  it('returns plain string unchanged', () => {
    expect(escapeRegExp('hello world')).toBe('hello world')
  })

  it('escapes dot', () => {
    expect(escapeRegExp('file.txt')).toBe('file\\.txt')
  })

  it('escapes all special regex characters', () => {
    const special = '.*+?^${}()|[]\\'
    const escaped = escapeRegExp(special)
    // none of the special chars should appear unescaped
    expect(() => new RegExp(escaped)).not.toThrow()
  })

  it('escapes parentheses and brackets', () => {
    expect(escapeRegExp('(test)[123]')).toBe('\\(test\\)\\[123\\]')
  })
})

describe('getSnippet', () => {
  const text = 'See on väga pikk sisu tekst millest otsitav sõna asub kuskil keskel ja on leitud.'

  it('returns beginning of content when query not found', () => {
    const short = 'Lühike tekst'
    const result = getSnippet(short, 'ei ole siin')
    expect(result).toBe(short)
  })

  it('truncates long content when query not found', () => {
    const long = 'a'.repeat(100)
    const result = getSnippet(long, 'xyz')
    expect(result).toContain('…')
    expect(result.replace('…', '').length).toBeLessThanOrEqual(80)
  })

  it('includes found query in snippet', () => {
    const result = getSnippet(text, 'otsitav')
    expect(result.toLowerCase()).toContain('otsitav')
  })

  it('adds leading ellipsis when match is not at start', () => {
    const long = 'a'.repeat(50) + 'otsitav' + 'b'.repeat(50)
    const result = getSnippet(long, 'otsitav')
    expect(result.startsWith('…')).toBe(true)
  })

  it('adds trailing ellipsis when match is not at end', () => {
    const long = 'otsitav' + 'b'.repeat(100)
    const result = getSnippet(long, 'otsitav')
    expect(result.endsWith('…')).toBe(true)
  })

  it('does not add leading ellipsis when match is near start', () => {
    const content = 'otsitav sõna on kohe alguses'
    const result = getSnippet(content, 'otsitav')
    expect(result.startsWith('…')).toBe(false)
  })

  it('is case-insensitive', () => {
    const result = getSnippet('OTSITAV on siin', 'otsitav')
    expect(result.toLowerCase()).toContain('otsitav')
  })

  it('trims whitespace from query', () => {
    const result = getSnippet('otsitav on siin', '  otsitav  ')
    expect(result.toLowerCase()).toContain('otsitav')
  })
})
