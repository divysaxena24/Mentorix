import { ImageResponse } from 'next/og'

// Route segment config
export const runtime = 'edge'

// Image metadata
export const size = {
    width: 32,
    height: 32,
}
export const contentType = 'image/png'

// Image generation
export default function Icon() {
    return new ImageResponse(
        (
            <div
                style={{
                    fontSize: 22,
                    background: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 50%, #9333ea 100%)',
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    borderRadius: '33%',
                    fontWeight: 900,
                    fontFamily: 'system-ui, sans-serif',
                    boxShadow: '0 0 30px rgba(37,99,235,0.4)',
                }}
            >
                M
            </div>
        ),
        {
            ...size,
        }
    )
}
