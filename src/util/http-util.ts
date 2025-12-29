import { IncomingHttpHeaders } from 'http'

export class HttpUtil {
    public static queryStringToMap(queryString: string): Map<string, string> {
        const params = new Map()
        queryString.split('&').forEach((kv) => {
            const pair = kv.split('=')
            if (pair.length === 2) params.set(pair[0], pair[1])
        })
        return params
    }

    public static headersToMap(incomingHeaders: IncomingHttpHeaders): Map<string, string> {
        const headers = new Map()
        for (const [k, v] of Object.entries(incomingHeaders))
            if (typeof v === 'string') headers.set(k, v)
        return headers
    }
}
