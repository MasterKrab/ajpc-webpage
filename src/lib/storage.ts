export const storage = {
  save(key: string, value: any): void {
    if (typeof localStorage === 'undefined') return
    try {
      const serialized = JSON.stringify(value)
      localStorage.setItem(key, serialized)
    } catch (error) {
      console.warn('Error saving to localStorage:', error)
    }
  },

  load<T>(key: string): T | null {
    if (typeof localStorage === 'undefined') return null
    try {
      const serialized = localStorage.getItem(key)
      return serialized ? JSON.parse(serialized) : null
    } catch (error) {
      console.warn('Error loading from localStorage:', error)
      return null
    }
  },

  remove(key: string): void {
    if (typeof localStorage === 'undefined') return
    try {
      localStorage.removeItem(key)
    } catch (error) {
      console.warn('Error removing from localStorage:', error)
    }
  },
}
