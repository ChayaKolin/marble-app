import { useEffect, useRef, useState } from 'react'
import ReactSignatureCanvas from 'react-signature-canvas'

interface Props {
  onConfirm: (dataUrl: string) => void
  onCancel?: () => void
  disabled?: boolean
  confirmLabel?: string
  cancelLabel?: string
}

export default function SignatureCanvas({
  onConfirm,
  onCancel,
  disabled = false,
  confirmLabel = 'אישור חתימה',
  cancelLabel = 'נקה',
}: Props) {
  const canvasRef = useRef<ReactSignatureCanvas | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [size, setSize] = useState({ width: 500, height: 180 })

  // The canvas drawing buffer must match its on-screen size, or touch points land
  // in the wrong place — critical on phones where the container is far narrower than 500px.
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const observer = new ResizeObserver(entries => {
      const width = entries[0]?.contentRect.width
      if (width) setSize({ width: Math.round(width), height: Math.round(width * (180 / 500)) })
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  function handleConfirm() {
    if (!canvasRef.current || canvasRef.current.isEmpty()) return
    const dataUrl = canvasRef.current.getTrimmedCanvas().toDataURL('image/png')
    onConfirm(dataUrl)
  }

  function handleClear() {
    canvasRef.current?.clear()
    onCancel?.()
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-slate-400 text-xs">חתום/י כאן:</p>

      <div ref={containerRef} className="rounded-xl border-2 border-slate-600 bg-white overflow-hidden">
        <ReactSignatureCanvas
          ref={canvasRef}
          penColor="#1e293b"
          canvasProps={{
            width: size.width,
            height: size.height,
            className: 'block touch-none',
            style: { touchAction: 'none' },
          }}
        />
      </div>

      <div className="flex gap-2 justify-end">
        <button
          type="button"
          onClick={handleClear}
          className="px-4 py-2 rounded-lg text-sm text-slate-300 border border-slate-600
                     hover:bg-slate-800 transition-colors"
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={handleConfirm}
          className="px-4 py-2 rounded-lg text-sm font-medium bg-emerald-600 text-white
                     hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-wait transition-colors"
        >
          {confirmLabel}
        </button>
      </div>
    </div>
  )
}
