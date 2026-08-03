import { useEffect, type ReactNode } from "react"

// Lightweight modal: fixed backdrop + centered card. Closes on Escape or
// backdrop click. Enough for Phase 4's create/join/check-in dialogs without
// pulling in a dialog library.
export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
}) {
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm border-t-[3px] border-primary bg-card p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-4 font-heading text-lg font-bold tracking-wide uppercase">{title}</h2>
        {children}
      </div>
    </div>
  )
}
