import { ImageResponse } from 'next/og'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'white',
          border: '14px solid #2563eb',
          borderRadius: '28px',
          overflow: 'hidden',
          boxSizing: 'border-box',
        }}
      >
        <img
          src="https://worduplessongenerator.com/word_up_clean.jpeg"
          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
        />
      </div>
    ),
    { ...size }
  )
}
