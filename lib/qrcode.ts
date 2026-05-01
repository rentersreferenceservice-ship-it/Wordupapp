import QRCode from 'qrcode'

export function youtubeSearchUrl(query: string): string {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`
}

export async function generateQRDataUrl(query: string): Promise<string> {
  const url = youtubeSearchUrl(query)
  return QRCode.toDataURL(url, {
    width: 120,
    margin: 1,
    color: { dark: '#000000', light: '#ffffff' },
  })
}
