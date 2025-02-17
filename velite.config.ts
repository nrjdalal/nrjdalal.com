import { defineCollection, defineConfig, s } from "velite"

const blogs = defineCollection({
  name: "Blogs",
  pattern: "blogs/**/*",
  schema: s.object({
    title: s.string().max(120),
    slug: s.path(),
    excerpt: s.excerpt(),
    content: s.markdown(),
    toc: s.toc(),
    metadata: s.metadata(),
  }),
})

const blogsMeta = defineCollection({
  name: "BlogsMeta",
  pattern: "blogs/**/*",
  schema: s.object({
    title: s.string().max(120),
    slug: s.path(),
    excerpt: s.excerpt(),
    metadata: s.metadata(),
  }),
})

export default defineConfig({
  collections: { blogs, blogsMeta },
  markdown: {},
})
