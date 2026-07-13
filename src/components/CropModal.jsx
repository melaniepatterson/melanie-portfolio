import { useState, useCallback } from 'react'
import Cropper from 'react-easy-crop'
import T from './theme'

// Extract the cropped region from the image using canvas, return as WebP blob
async function getCroppedWebP(imageSrc, pixelCrop, quality = 0.85) {
  const image = await new Promise((resolve, reject) => {
    const img = new Image()
    img.addEventListener('load', () => resolve(img))
    img.addEventListener('error', reject)
    img.setAttribute('crossOrigin', 'anonymous')
    img.src = imageSrc
  })

  const canvas = document.createElement('canvas')
  const size = Math.min(pixelCrop.width, pixelCrop.height, 400)
  canvas.width  = size
  canvas.height = size

  const ctx = canvas.getContext('2d')
  ctx.drawImage(
    image,
    pixelCrop.x, pixelCrop.y,
    pixelCrop.width, pixelCrop.height,
    0, 0, size, size
  )

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      blob => blob ? resolve(blob) : reject(new Error('Canvas toBlob failed')),
      'image/webp',
      quality
    )
  })
}

export default function CropModal({ imageSrc, onConfirm, onCancel, uploading }) {
  const [crop,       setCrop]       = useState({ x: 0, y: 0 })
  const [zoom,       setZoom]       = useState(1)
  const [croppedArea, setCroppedArea] = useState(null)

  const onCropComplete = useCallback((_, croppedAreaPixels) => {
    setCroppedArea(croppedAreaPixels)
  }, [])

  async function handleConfirm() {
    if (!croppedArea) return
    try {
      const blob = await getCroppedWebP(imageSrc, croppedArea)
      onConfirm(blob)
    } catch (err) {
      console.error('Crop failed:', err)
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.85)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
    }}>
      {/* Title */}
      <div style={{ color: '#fff', fontSize: 14, fontWeight: 600, marginBottom: 16, fontFamily: 'inherit' }}>
        Drag and zoom to crop
      </div>

      {/* Cropper area */}
      <div style={{ position: 'relative', width: 320, height: 320, borderRadius: 12, overflow: 'hidden' }}>
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          aspect={1}
          cropShape="round"
          showGrid={false}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onCropComplete}
          style={{
            containerStyle: { borderRadius: 12 },
            mediaStyle: {},
            cropAreaStyle: {
              border: `2px solid ${T.pinkDeep}`,
              boxShadow: `0 0 0 9999px rgba(0,0,0,0.6)`,
            },
          }}
        />
      </div>

      {/* Zoom slider */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 20, width: 320 }}>
        <span style={{ fontSize: 11, color: '#aaa', fontFamily: 'inherit', flexShrink: 0 }}>Zoom</span>
        <input
          type="range" min={1} max={3} step={0.05}
          value={zoom} onChange={e => setZoom(Number(e.target.value))}
          style={{ flex: 1, accentColor: T.pinkDeep, cursor: 'pointer' }}
        />
        <span style={{ fontSize: 11, color: '#aaa', fontFamily: 'inherit', flexShrink: 0, width: 28, textAlign: 'right' }}>
          {zoom.toFixed(1)}×
        </span>
      </div>

      {/* Buttons */}
      <div style={{ display: 'flex', gap: 10, marginTop: 20, width: 320 }}>
        <button
          onClick={onCancel}
          disabled={uploading}
          style={{
            flex: 1, padding: '11px', borderRadius: 10,
            border: '0.5px solid rgba(255,255,255,0.2)',
            background: 'transparent', color: '#fff',
            fontSize: 13, fontWeight: 500, cursor: 'pointer',
            fontFamily: 'inherit', opacity: uploading ? 0.5 : 1,
          }}
        >
          Cancel
        </button>
        <button
          onClick={handleConfirm}
          disabled={uploading}
          style={{
            flex: 2, padding: '11px', borderRadius: 10,
            border: 'none', background: T.pinkDeep, color: '#fff',
            fontSize: 13, fontWeight: 600, cursor: uploading ? 'default' : 'pointer',
            fontFamily: 'inherit', opacity: uploading ? 0.6 : 1,
            transition: 'opacity 0.15s',
          }}
        >
          {uploading ? 'Uploading...' : 'Save photo'}
        </button>
      </div>
    </div>
  )
}
