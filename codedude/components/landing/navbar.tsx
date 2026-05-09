import Link from "next/link";
import { Button } from "../ui/button";
import { SignedOut } from "@clerk/nextjs";
import { SignedIn } from "@clerk/nextjs";

export function Navbar() {
    return (
        <header className="fixed top-0 z-50 w-full">
            <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
                <Link 
                href="/"
                className="flex items-center gap-2 text-lg font-semibold tracking-tight text-white">
                    <img src="/favicon.ico" alt="Logo" className="size-7" />
                    CodeDude
                </Link>
                <div className="flex items-center gap-3">
                    <SignedOut>
                        <Button
                        variant="outline"
                        size="sm"
                        className="border-white/20 bg-transparent text-white hover:bg-white/10 hover:brightness-100"
                        asChild
                        >
                            <Link href="/sign-in">Sign In</Link>
                        </Button>
                        <Button
                        size="sm"
                        className="bg-[#6d5acd] text-white hover:bg-[#6d5acd]/90"
                        asChild
                        >
                            <Link href="/sign-up">Get Started</Link>
                        </Button>
                    </SignedOut>
                    <SignedIn>
                        <Button
                            size="sm"
                            className="border-white/20 bg-transparent text-white hover:bg-white/10 hover:brightness-100"
                            asChild
                        >
                            <Link href="/dashboard">Dashboard</Link>
                        </Button>
                    </SignedIn>
                </div>
            </nav>
        </header>
    )
}
