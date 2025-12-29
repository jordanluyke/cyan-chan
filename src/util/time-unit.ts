const nanoseconds = 1
const microseconds = nanoseconds * 1000
const milliseconds = microseconds * 1000
const seconds = milliseconds * 1000
const minutes = seconds * 60
const hours = minutes * 60
const days = hours * 24
const years = days * 365

export class TimeUnit {
    public static NANOSECONDS = new TimeUnit(nanoseconds)
    public static MICROSECONDS = new TimeUnit(microseconds)
    public static MILLISECONDS = new TimeUnit(milliseconds)
    public static SECONDS = new TimeUnit(seconds)
    public static MINUTES = new TimeUnit(minutes)
    public static HOURS = new TimeUnit(hours)
    public static DAYS = new TimeUnit(days)
    public static YEARS = new TimeUnit(years)

    constructor(private scale: number) {}

    public toNanos(duration: number): number {
        return (this.scale * duration) / nanoseconds
    }

    public toMicros(duration: number): number {
        return (this.scale * duration) / microseconds
    }

    public toMillis(duration: number): number {
        return (this.scale * duration) / milliseconds
    }

    public toSeconds(duration: number): number {
        return (this.scale * duration) / seconds
    }

    public toMinutes(duration: number): number {
        return (this.scale * duration) / minutes
    }

    public toHours(duration: number): number {
        return (this.scale * duration) / hours
    }

    public toDays(duration: number): number {
        return (this.scale * duration) / days
    }
}
