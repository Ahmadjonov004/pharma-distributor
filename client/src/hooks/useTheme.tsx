import { useEffect, useState, useCallback } from 'react'

type Theme = 'light' | 'dark'

export function useTheme(initial?: Theme) {
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      const saved = localStorage.getItem('pharma_theme')
      if (saved === 'dark' || saved === 'light') return saved
    } catch (e) {}
    return initial || 'light'
  })

  const apply = useCallback((t: Theme) => {
    const root = window.document.documentElement
    if (t === 'dark') root.classList.add('dark')
    else root.classList.remove('dark')
    try { localStorage.setItem('pharma_theme', t) } catch (e) {}
  }, [])

  useEffect(() => {
    apply(theme)
  }, [theme, apply])

  // init from prefers-color-scheme if nothing saved
  useEffect(() => {
    try {
      const saved = localStorage.getItem('pharma_theme')
      if (!saved) {
        const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
        setTheme(prefersDark ? 'dark' : 'light')
      }
    } catch (e) {}
  }, [])

  const toggle = useCallback(() => setTheme((t) => (t === 'dark' ? 'light' : 'dark')), [])

  return { theme, setTheme, toggle }
}
