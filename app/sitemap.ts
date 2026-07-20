import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://wordups2c.com'
  const now = new Date()
  return [
    { url: base,                              lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/about`,                   lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${base}/our-practice`,            lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${base}/practitioner-services`,   lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/parent-resources`,        lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/practice-tools`,          lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/practitioner-minute`,     lastModified: now, changeFrequency: 'weekly',  priority: 0.6 },
    { url: `${base}/contact`,                 lastModified: now, changeFrequency: 'yearly',  priority: 0.7 },
  ]
}
