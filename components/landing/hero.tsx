import Link from "next/link"
import { Badge } from "../ui/badge"
import { Plus } from 'lucide-react';
import { ArrowUp } from 'lucide-react';

export function Hero() {
    return(
    <section className="relative isolate flex min-h-screen flex-col items-center justify-center bg-[#0f172a] px-6 text-white">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute inset-0 bg-linear-to-b from-blue-500/50 to-purple-600/50 opacity-70 blur-3xl">
            
            </div>
        </div> 
        <div className="relative z-10 flex w-full max-w-2xl flex-col items-center text-center">
            <Link href="/sign-up" className="group mb-8">
                <Badge
                variant="outline"
                className="gap-2 border border-white/15 bg-white/5 px-3 py-1.5 text-sm text-white/80 backdrop-blur-sm
                transition-colors duration-150 hover:bg-white/10">
                    <span className="rounded bg-[#6d5acd] px-1.5 py-0.5 text-xs font-semibold text-white">New</span>
                    Introducing a smarter experience
                    <span className="transition-transform duration-150 group-hover:translate-x-0.5">
                        &rarr;
                    </span>
                </Badge>
            </Link> 
            <h1 className="text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl md:text-6xl">Build Smarter Applications</h1>
            <p className="mt-4 text-lg text-white/80">Create stunning websites with ease and efficiency</p>
            <div className="mt-10 w-full">
                <Link href="/sign-up" className="block">
                    <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-[#1c1c1c]/90
                    shadow-2xl backdrop-blur-md transition-all duration-150 hover:bg-[#1c1c1c]/100">
                        <div className="px-5 pb-2 pt-5">
                            <p className="text-left text-[15px] text-white/40">
                                Ask Codedude to generate code for you...
                            </p>
                        </div>
                        <div className="flex items-center justify-between px-5 pb-4 pt-6">
                            <div className="flex items-center">
                                <div className="flex size-8 items-center justify-center rounded-lg text-white/40 transition-colors
                                hover:text-white/60">
                                    <Plus className="size-5" />

                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="rounded-full border border-white/15 px-3 py-1 text-xs font-medium text-white/70">
                                    Plan
                                </div>
                                <div className="flex size-8 items-center justify-center rounded-full bg-white/10 text-white/50">
                                <ArrowUp className="size-5" />

                                </div>
                            </div>
                        </div>
                    </div>
                </Link>
            </div>
        </div>
    </section>
    );
}