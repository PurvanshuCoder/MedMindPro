import { useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Image as ImageIcon, UploadCloud } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { useToast } from '../../components/toast/ToastProvider'
import { useMedicine } from '../../services/medicine/MedicineProvider'
import { apiFetch } from '../../services/api'

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

export function UploadPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const { createDraft } = useMedicine()

  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const [isDragging, setIsDragging] = useState(false)
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const dropZoneClass = useMemo(() => {
    return [
      'cursor-pointer rounded-[1.75rem] border-2 border-dashed p-8 text-center transition-colors duration-200',
      isDragging
        ? 'border-[#256a92] bg-[#e3f0fa]'
        : 'border-[#8bb9da] bg-[#f0f7ff] hover:bg-[#e3f0fa]',
    ].join(' ')
  }, [isDragging])

  async function handleFile(file: File) {
    if (!file.type.startsWith('image/')) {
      toast({
        type: 'error',
        title: 'Unsupported file',
        message: 'Please upload an image (JPG/PNG/WebP).',
      })
      return
    }

    setFileName(file.name)
    setSelectedFile(file)
    setLoading(true)
    try {
      const dataUrl = await readFileAsDataUrl(file)
      setImageDataUrl(dataUrl)
      toast({
        type: 'success',
        title: 'Image ready',
        message: 'You can now extract medication details.',
      })
    } catch (e) {
      toast({
        type: 'error',
        title: 'Upload failed',
        message: 'Try selecting the image again.',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h1 className="text-lg font-semibold text-[var(--mm-navy)] md:text-xl">
          Neural label scanner
        </h1>
        <p className="text-sm text-[var(--mm-muted)]">
          Tap or drop a label photo — we extract fields for your medication list.
        </p>
      </div>

      <div
        className={dropZoneClass}
        role="button"
        tabIndex={0}
        aria-label="Upload image"
        onDragEnter={(e) => {
          e.preventDefault()
          setIsDragging(true)
        }}
        onDragOver={(e) => {
          e.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={async (e) => {
          e.preventDefault()
          setIsDragging(false)
          const file = e.dataTransfer.files?.[0]
          if (file) await handleFile(file)
        }}
        onClick={() => fileInputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click()
        }}
      >
        <div className="flex flex-col items-center justify-center gap-3 text-center">
          <UploadCloud className="h-12 w-12 text-[#256a92] sm:h-14 sm:w-14" />
          <div className="text-sm font-bold text-[#0f3a55] sm:text-base">
            Tap to scan medicine label
          </div>
          <div className="text-xs text-[#517e9f] sm:text-sm">
            Camera or gallery · JPEG / PNG / WebP
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={async (e) => {
            const file = e.target.files?.[0]
            if (file) await handleFile(file)
          }}
        />
      </div>

      {imageDataUrl ? (
        <Card className="mm-panel p-4 sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#f0f7ff] ring-2 ring-[#b5d0e4]">
              <ImageIcon className="h-7 w-7 text-[#256a92]" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-[var(--mm-navy)]">
                Label preview
              </div>
              <div className="mt-1 truncate text-xs text-[var(--mm-muted)]">
                {fileName || 'Selected image'}
              </div>
              <div className="mt-3 overflow-hidden rounded-3xl ring-2 ring-[#b5d0e4]">
                <img
                  src={imageDataUrl}
                  alt="Uploaded preview"
                  className="h-44 w-full object-cover sm:h-48"
                />
              </div>
            </div>
          </div>
        </Card>
      ) : null}

      <div className="space-y-3">
        <Button
          className="w-full"
          disabled={loading || !imageDataUrl || !selectedFile}
          onClick={async () => {
            if (!imageDataUrl || !selectedFile) return

            setLoading(true)
            try {
              const formData = new FormData()
              formData.append('image', selectedFile)

              const res = await apiFetch<{
                extracted: {
                  name: string
                  dosage: string
                  frequency: string
                  instructions: string
                  description: string
                  sideEffects: string
                  precautions: string
                }
                imageUrl: string
                provider: string
                profileMarkdown: string
                ocrText: string
              }>('/api/ocr/extract', { method: 'POST', body: formData })

              createDraft({
                ...res.extracted,
                imageDataUrl,
                imageUrl: res.imageUrl,
                ocrText: res.ocrText,
                profileMarkdown: res.profileMarkdown,
              })

              toast({
                type: 'success',
                title: 'Details extracted',
                message: `Review and save your medicine. Source: ${res.provider}`,
              })
              navigate('/extracted')
            } catch (e) {
              toast({
                type: 'error',
                title: 'Extraction failed',
                message:
                  e instanceof Error ? e.message : 'Please try uploading again.',
              })
            } finally {
              setLoading(false)
            }
          }}
          leftIcon={
            loading ? <LoadingSpinner className="text-white" /> : undefined
          }
        >
          {loading ? 'Extracting…' : 'Extract Data'}
        </Button>

        <div className="rounded-2xl bg-[#e5f0fa] p-3 text-xs text-[#2a4b68]">
          Extraction runs on the server (Tesseract by default; optional Google
          Vision).
        </div>
      </div>
    </div>
  )
}

