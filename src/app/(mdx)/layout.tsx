'use client'

import { Navbar } from '@/components/navbar'
import { Pencil } from 'lucide-react'
import Link from 'next/link'
import { useSelectedLayoutSegments } from 'next/navigation'

export default function MdxLayout({ children }: { children: React.ReactNode }) {
  const segment = useSelectedLayoutSegments()
  const githubLink = `https://github.com/nrjdalal/nrjdalal.com/tree/main/src/app/(mdx)/${segment.join(
    '/',
  )}/page.mdx`
  const fileInfoLink = `https://api.github.com/repos/nrjdalal/nrjdalal.com/commits?path=src/app/(mdx)/${segment.join(
    '/',
  )}/page.mdx&page=1&per_page=1`

  return (
    <main className="container mx-auto min-h-[100dvh] max-w-screen-xl">
      <Navbar />

      {
        // ~ About
      }
      <div className="mx-2.5 border-t border-slate-800 px-2.5 pt-10 font-medium" />

      <div className="flex justify-center">
        <article className="prose w-full max-w-screen-md px-5 pb-20 pt-10 prose-a:font-normal prose-a:no-underline prose-blockquote:text-blue-600">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-5">
              <Link
                className="text-xs font-semibold text-blue-500 no-underline"
                href={'/'}
              >
                BACK
              </Link>
              <p className="border-px select-none rounded-md bg-slate-100 px-3 py-1 text-xs text-slate-500">
                {segment.join(' / ')}
              </p>
            </div>

            <Link
              className="flex items-center gap-2 text-xs"
              href={githubLink}
              target="_blank"
            >
              Edit <Pencil className="h-3.5 w-3.5 text-slate-500" />
            </Link>
          </div>

          {children}
        </article>
      </div>
    </main>
  )
}
