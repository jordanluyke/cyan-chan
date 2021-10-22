import { MessageRouteHandler } from "./message-route-handler"

export class MessageRoute {

    constructor(
        public command: string,
        public handler: new () => MessageRouteHandler
    ) {}
}
