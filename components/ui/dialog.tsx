"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"

import { cn } from "@/lib/utils"

function Dialog({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />
}

function DialogTrigger({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
}

function DialogPortal({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />
}

function DialogClose({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />
}

function DialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={cn(
        "fixed inset-0 z-50 bg-black/75 backdrop-blur-sm",
        "data-[state=open]:animate-in data-[state=closed]:animate-out",
        "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        className
      )}
      {...props}
    />
  )
}

function DialogContent({
  className,
  children,
  showCloseButton = true,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  showCloseButton?: boolean
}) {
  return (
    <DialogPortal data-slot="dialog-portal">
      <DialogOverlay />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        className={cn(
          // Layout & positioning
          "fixed top-1/2 left-1/2 z-50 -translate-x-1/2 -translate-y-1/2",
          "w-full max-w-[calc(100%-2rem)] sm:max-w-lg",
          // Dark cinematic surface
          "bg-[#0c0c0c] border border-white/10",
          // Spacing
          "grid gap-0 p-0 outline-none",
          // Radix animation — slide-up reveal matching heroContentReveal
          "data-[state=open]:animate-in data-[state=closed]:animate-out",
          "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          "data-[state=closed]:slide-out-to-bottom-4 data-[state=open]:slide-in-from-bottom-4",
          "duration-300",
          className
        )}
        {...props}
      >
        {children}
        {showCloseButton && (
          <DialogPrimitive.Close
            data-slot="dialog-close"
            className={cn(
              "absolute top-5 right-5",
              "text-white/30 hover:text-white/80 transition-colors duration-200",
              "text-xl leading-none font-[100] font-[family-name:var(--font-raleway)]",
              "focus:outline-none focus:ring-1 focus:ring-white/20 focus:ring-offset-0",
              "disabled:pointer-events-none",
            )}
            aria-label="Close"
          >
            ✕
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPortal>
  )
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn(
        "flex flex-col gap-3 px-8 pt-8 pb-6 border-b border-white/8",
        className
      )}
      {...props}
    />
  )
}

function DialogBody({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-body"
      className={cn("px-8 py-6", className)}
      {...props}
    />
  )
}

function DialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        "flex flex-col-reverse gap-3 px-8 py-6 border-t border-white/8 sm:flex-row sm:justify-end",
        className
      )}
      {...props}
    />
  )
}

function DialogTitle({
  className,
  accent,
  eyebrow,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title> & {
  accent?: string
  eyebrow?: string
}) {
  const accentColor = accent ?? "#fbbf24"

  return (
    <div className="flex flex-col gap-3">
      {/* Eyebrow line — mirrors hero pattern */}
      {eyebrow && (
        <div className="flex items-center gap-3">
          <span className="h-px w-7 flex-shrink-0" style={{ background: accentColor }} />
          <span
            className="text-[0.58rem] tracking-[0.32em] uppercase font-[family-name:var(--font-raleway)] font-medium"
            style={{ color: accentColor }}
          >
            {eyebrow}
          </span>
        </div>
      )}
      <DialogPrimitive.Title
        data-slot="dialog-title"
        className={cn(
          "font-[family-name:var(--font-raleway)] text-white leading-none",
          "text-[clamp(1.6rem,4vw,2.4rem)] font-[100] tracking-[-0.02em]",
          className
        )}
        {...props}
      />
    </div>
  )
}

function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn(
        "text-white/55 text-sm font-[family-name:var(--font-raleway)] font-[300] leading-relaxed",
        className
      )}
      {...props}
    />
  )
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogBody,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
}
