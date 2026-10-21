/** Published content item (GET /content, GET /content/:slug). */
export interface ContentItem {
  _id: string;
  slug: string;
  section:
    | 'home'
    | 'onboarding'
    | 'faq'
    | 'legal'
    | 'about'
    | 'news'
    | 'general'
    | 'banner';
  title: string;
  excerpt?: string;
  body: string;
  category?: string;
  imageUrl?: string;
  cta?: { label?: string; target?: string };
  tags?: string[];
  order?: number;
  metadata?: Record<string, any>;
  publishedAt?: string;
}
