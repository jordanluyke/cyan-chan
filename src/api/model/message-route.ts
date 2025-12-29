import { MessageRouteHandler } from './message-route-handler.js'

export class MessageRoute {
    constructor(public command: string, public handler: new () => MessageRouteHandler) {}
}
