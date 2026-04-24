"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-card group-[.toaster]:text-foreground group-[.toaster]:border-white/5 group-[.toaster]:shadow-2xl group-[.toaster]:rounded-[1.5rem] group-[.toaster]:p-5 group-[.toaster]:font-sans",
          description: "group-[.toast]:text-zinc-500",
          actionButton:
            "group-[.toast]:bg-accent group-[.toast]:text-accent-foreground group-[.toast]:rounded-xl group-[.toast]:font-black group-[.toast]:uppercase group-[.toast]:tracking-widest",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-zinc-500 group-[.toast]:rounded-xl",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
