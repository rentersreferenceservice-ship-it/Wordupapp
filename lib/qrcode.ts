import QRCode from 'qrcode'

export function youtubeVideoUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${videoId}`
}

export function youtubeSearchUrl(query: string): string {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}&sp=EgIYAQ%3D%3D`
}

export async function generateQRDataUrl(videoId: string | undefined, query: string | undefined): Promise<string> {
  const url = videoId ? youtubeVideoUrl(videoId) : youtubeSearchUrl(query ?? '')
  return QRCode.toDataURL(url, {
    width: 120,
    margin: 1,
    color: { dark: '#000000', light: '#ffffff' },
  })
}
