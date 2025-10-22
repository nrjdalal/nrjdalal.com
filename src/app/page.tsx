import { Button } from "@/components/ui/button"
import { RiGithubFill } from "@remixicon/react"
import Link from "next/link"

export default function Page() {
  return (
    <main className="flex min-h-[calc(100dvh-3.5rem)] flex-col items-center justify-center p-5">
      <h1 className="sr-only">Neeraj Dalal personal site</h1>
      <p>UI, Tools and much more / Coming Soon</p>
      <Link
        href="https://github.com/nrjdalal"
        target="_blank"
        aria-label="Visit the GitHub repository for this user"
        className="mt-4 flex gap-2"
      >
        <Button className="[&_svg]:size-5" aria-label="My Github">
          View Source on GitHub <RiGithubFill aria-hidden="true" />
        </Button>
      </Link>
      <Link
        href="https://nrjdalal.com"
        target="_blank"
        aria-label="Visit the previous version of the site"
        className="mt-2 flex gap-2"
      >
        <Button aria-label="Open the previous site" variant="secondary">
          Site is in making — Open the previous site
        </Button>
      </Link>
    </main>
  )
}
