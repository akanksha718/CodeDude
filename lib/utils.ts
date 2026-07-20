import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


// clsx - A tiny utility for constructing className strings conditionally.
// twmerge - A utility for merging Tailwind CSS classes without conflicts
// cn - a custom function which combines both clsx and twMerge to create a more powerful utility for handling class names in a React project. It allows you to conditionally apply classes and also ensures that Tailwind CSS classes are merged correctly without conflicts.

// ... means Accept any number of arguments and put them into an array