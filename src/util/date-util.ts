import { TimeUnit } from './time-unit.js'

export class DateUtil {
    /** Compact age for chat context, e.g. "just now", "5m ago", "3h ago", "2d ago". */
    public static formatRelativeAge(ms: number): string {
        const elapsed = Math.max(0, ms)
        const seconds = Math.floor(TimeUnit.MILLISECONDS.toSeconds(elapsed))
        if (seconds < 60) return 'just now'
        const minutes = Math.floor(TimeUnit.MILLISECONDS.toMinutes(elapsed))
        if (minutes < 60) return `${minutes}m ago`
        const hours = Math.floor(TimeUnit.MILLISECONDS.toHours(elapsed))
        if (hours < 24) return `${hours}h ago`
        const days = Math.floor(TimeUnit.MILLISECONDS.toDays(elapsed))
        return `${days}d ago`
    }
}
