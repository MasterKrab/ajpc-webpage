export const downloadCSV = async (
  filename: string,
  content: string,
): Promise<void> => {
  if ('showSaveFilePicker' in window) {
    try {
      const handle = await (window as any).showSaveFilePicker({
        suggestedName: filename,
        types: [
          {
            description: 'CSV File',
            accept: { 'text/csv': ['.csv'] },
          },
        ],
      })
      const writable = await handle.createWritable()
      await writable.write(content)
      await writable.close()
      return
    } catch (error: unknown) {
      // User canceled the save dialog
      if (error instanceof Error && error.name === 'AbortError') throw error
    }
  }

  return new Promise((resolve) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    // Fallback defer URL revocation for browsers without showSaveFilePicker
    setTimeout(() => {
      URL.revokeObjectURL(url)
      resolve()
    }, 1500)
  })
}

export const generateCSV = (
  data: any[],
  headers: { key: string; label: string }[],
) => {
  const headerRow = headers.map((header) => `"${header.label}"`).join(',')
  const rows = data.map((row) => {
    return headers
      .map((header) => {
        const value = header.key
          .split('.')
          .reduce(
            (accumulator, part) =>
              accumulator != null ? accumulator[part] : undefined,
            row,
          )
        return `"${String(value ?? '').replace(/"/g, '""')}"`
      })
      .join(',')
  })
  return [headerRow, ...rows].join('\n')
}
