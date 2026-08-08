import { Modal } from "@/components/Modal"
import { BADGES } from "@/lib/badges"

// Shows what a single badge means. Opened by clicking a badge chip on the
// scoreboard; the code drives which badge is shown, null keeps it closed.
export function BadgeModal({
  code,
  onClose,
}: {
  code: string | null
  onClose: () => void
}) {
  const badge = code ? BADGES[code] : null

  return (
    <Modal open={badge !== null} onClose={onClose} title="Badge">
      {badge && (
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="flex size-16 items-center justify-center border-[1.5px] border-border bg-muted/40 text-3xl leading-none">
            {badge.icon}
          </span>
          <h3 className="font-heading text-xl font-extrabold tracking-wide uppercase">
            {badge.name}
          </h3>
          <p className="text-sm text-muted-foreground">{badge.description}</p>
        </div>
      )}
    </Modal>
  )
}
