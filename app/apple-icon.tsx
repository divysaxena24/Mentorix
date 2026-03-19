import { ImageResponse } from 'next/og'

// Route segment config
export const runtime = 'edge'

// Image metadata
export const size = {
    width: 180,
    height: 180,
}
export const contentType = 'image/png'

// Image generation
export default function Icon() {
    return new ImageResponse(
        (
            // ImageResponse JSX element
            <div
                style={{
                    fontSize: 120,
                    background: 'linear-gradient(135deg, #3b82f6 0%, #a855f7 100%)',
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    borderRadius: '20%',
                    fontWeight: 900,
                    fontFamily: 'system-ui, sans-serif',
                }}
            >
                M
            </div>
        ),
        // ImageResponse options
        {
            ...size,
        }
    )
}
