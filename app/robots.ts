import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/practitioner/', '/api/'],
    },
    sitemap: 'https://wordups2c.com/sitemap.xml',
  }
}
