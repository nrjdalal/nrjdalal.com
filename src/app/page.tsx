import { Button } from "@/components/ui/button"
import { RiGithubFill } from "@remixicon/react"
import Link from "next/link"

export default function Page() {
  return (
    <main className="flex min-h-[calc(100dvh-3.5rem)] flex-col items-center justify-center">
      <p>UI, Tools and much more / Coming Soon</p>
      <Link
        href="https://github.com/nrjdalal/nrjdalal.com"
        target="_blank"
        className="mt-4 flex gap-2"
      >
        <Button className="[&_svg]:size-5">
          Bookmark <RiGithubFill />
        </Button>
      </Link>
    </main>
  )
}
