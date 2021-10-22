import { IncomingHttpHeaders } from "http"

export class HttpUtil {

    public static queryStringToMap(queryString: string): Map<string, string> {
        let params = new Map()
        queryString.split("&")
            .forEach(kv => {
                let pair = kv.split("=")
                if(pair[1] !== undefined)
                    params.set(pair[0], pair[1])
            })
        return params
    }

    public static headersToMap(incomingHeaders: IncomingHttpHeaders): Map<string, string> {
        let headers = new Map()
        for(let [k, v] of Object.entries(incomingHeaders))
            if(typeof v === "string")
                headers.set(k, v)
        return headers
    }
}
