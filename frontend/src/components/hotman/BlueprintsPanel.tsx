import { useRef, useState } from 'react'
import axios from 'axios'

interface Document {
  label: string
  url: string
}

interface Props {
  orderId: string
  layoutDocumentUrl?: string | null
  measurementsDocumentUrl?: string | null
  onLayoutUploaded: (url: string) => void
}

export default function BlueprintsPanel({
  orderId,
  layoutDocumentUrl,
  measurementsDocumentUrl,
  onLayoutUploaded,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const documents: Document[] = [
    ...(measurementsDocumentUrl ? [{ label: 'מדידות שטח', url: measurementsDocumentUrl }] : []),
    ...(layoutDocumentUrl ? [{ label: 'תוכנית פריסה', url: layoutDocumentUrl }] : []),
  ]

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setError(null)
    const form = new FormData()
    form.append('file', file)

    try {
      const { data } = await axios.post<{ layoutDocumentUrl: string }>(
        `/api/v1/orders/${orderId}/layout`,
        form,
        { headers: { 'Content-Type': 'multipart/form-data' } },
      )
      onLayoutUploaded(data.layoutDocumentUrl)
    } catch {
      setError('שגיאה בהעלאת הקובץ')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <div className="bg-slate-900 rounded-xl border border-slate-700 p-5 space-y-4">
      <h3 className="text-slate-100 font-semibold text-base">תוכניות ומסמכים</h3>

      {/* Document list */}
      {documents.length > 0 ? (
        <div className="space-y-2">
          {documents.map(doc => (
            <a
              key={doc.url}
              href={doc.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 rounded-lg bg-slate-800
                         hover:bg-slate-750 border border-slate-700 transition-colors group"
            >
              <span className="text-2xl">📄</span>
              <span className="text-slate-200 text-sm flex-1">{doc.label}</span>
              <span className="text-slate-500 text-xs group-hover:text-emerald-400 transition-colors">
                פתח ↗
              </span>
            </a>
          ))}
        </div>
      ) : (
        <p className="text-slate-600 text-sm">אין מסמכים עדיין</p>
      )}

      {/* Upload layout button */}
      <div
        className="border-2 border-dashed border-slate-600 rounded-xl p-5 text-center
                   hover:border-emerald-600 transition-colors cursor-pointer"
        onClick={() => fileInputRef.current?.click()}
        onDragOver={e => e.preventDefault()}
        onDrop={e => {
          e.preventDefault()
          const file = e.dataTransfer.files[0]
          if (file && fileInputRef.current) {
            const dt = new DataTransfer()
            dt.items.add(file)
            fileInputRef.current.files = dt.files
            fileInputRef.current.dispatchEvent(new Event('change', { bubbles: true }))
          }
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          className="hidden"
          onChange={handleFileSelect}
        />
        <p className="text-slate-400 text-sm">
          {uploading ? 'מעלה...' : 'גרור PDF או לחץ להעלאת תוכנית פריסה'}
        </p>
        <p className="text-slate-600 text-xs mt-1">PDF בלבד</p>
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}
    </div>
  )
}
