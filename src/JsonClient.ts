﻿import WebSocket from "isomorphic-ws"
import { ClientSubscription } from "./ClientSubscription"
import { ClientSubscriptionManager } from "./ClientSubscriptionManager"
import { CredentialsBase } from "./CredentialsBase"
import { ICredentials } from "./ICredentials"
import { IJsonClient } from "./IJsonClient"
import { IReturn, IReturnVoid } from "./IReturn"
import { ISubscription } from "./ISubscription"
import { LogoutMessage } from "./Messages/LogoutMessage"
import { IPendingMessageQueue, PendingMessage } from "./PendingMessage"
import { RequestMessage } from "./RequestMessage"

export interface IJsonRpcError {
    code: number
    message: string
    data: Object
}

export function isJsonRpcError(e: unknown): e is IJsonRpcError {
    return e && typeof e === "object" && "code" in e && "message" in e && "data" in e ? true : false
}

export interface IJsonClientOptions {
    reconnect: boolean
    reconnectInterval: number
    maxReconnects: number
    credentials?: ICredentials
}

export class JsonClient implements IJsonClient {
    constructor(
        public url: string,
        private options: IJsonClientOptions = {
            reconnect: true,
            reconnectInterval: 5000,
            maxReconnects: 10,
        }
    ) {
        this.credentials = options.credentials

        // make sure that this argument stays
        this.call = this.call.bind(this)
        this.notify = this.notify.bind(this)
        this.subscribe = this.subscribe.bind(this)
        this.generateMessageId = this.generateMessageId.bind(this)
        this.nameOf = this.nameOf.bind(this)
    }

    public connected = false
    public sessionId?: string
    public credentials?: ICredentials
    private webSocket?: WebSocket
    private reconnects = 0
    private pendingMessages: IPendingMessageQueue = {}

    public traceMessage = (_: { isOutcoming: boolean; data: string }) => {
        // do nothing by default
    }

    public errorFilter = (_: Error | IJsonRpcError | unknown) => {
        // do nothing by default
    }

    public async disconnect() {
        if (this.webSocket && this.connected) {
            await this.notify(new LogoutMessage())
            this.webSocket.close()
            this.connected = false
            delete this.webSocket
            delete this.connectPromise
        }
    }

    private rejectPendingMessages(closeEvent: { wasClean: boolean; code: number; reason: string; target: WebSocket }) {
        let message = "Connection was closed."
        if (closeEvent.code !== 1000) {
            message = "Connection was aborted. Error code: " + closeEvent.code
        }

        const error = new Error(message)
        Object.defineProperty(error, "code", { value: -32003 })

        for (const messageId in this.pendingMessages) {
            if (Object.prototype.hasOwnProperty.call(this.pendingMessages, messageId)) {
                const pending = this.pendingMessages[messageId]
                if (pending) {
                    // clear pending message
                    delete this.pendingMessages[messageId]

                    // reject the promise
                    this.errorFilter(error)
                    pending.reject(error)
                }
            }
        }
    }

    private connectPromise?: Promise<string>

    public connect(credentials?: ICredentials): Promise<string> {
        // you only connect once
        if (this.connectPromise) {
            return this.connectPromise
        }

        // make sure to have some credentials
        const creds: ICredentials = credentials || this.credentials || new CredentialsBase()

        return (this.connectPromise = new Promise<string>((resolve, reject) => {
            // check if already connected
            if (this.webSocket) {
                resolve(this.sessionId!)
                return
            }

            this.webSocket = new WebSocket(this.url)

            this.webSocket.onerror = (error: any) => {
                this.connected = false
                delete this.webSocket
                delete this.connectPromise

                let message = "Couldn't connect to " + this.url
                if (error.message) {
                    message = message + ": " + error.message
                }

                const e = new Error(message)
                this.errorFilter(e)
                reject(e)
            }

            this.webSocket.onopen = async () => {
                // this is crucial for the subsequent authenticate call
                this.connected = true
                try {
                    // authenticate
                    this.sessionId = await creds.authenticate(this)

                    // great, now we're connected
                    this.reconnects = 0
                    resolve(this.sessionId)
                } catch (e) {
                    // report failure
                    this.connected = false
                    this.errorFilter(e)
                    reject(e)
                    delete this.webSocket
                    delete this.connectPromise
                }
            }

            this.webSocket.onclose = (closeEvent: any) => {
                this.connected = false
                this.rejectPendingMessages(closeEvent)
                delete this.webSocket
                delete this.connectPromise

                if (closeEvent.code === 1000) {
                    resolve(this.sessionId!)
                    return // closed normally, don't reconnect
                }

                this.reconnects++
                if (
                    this.options.reconnect &&
                    (this.options.maxReconnects < this.reconnects || this.options.maxReconnects === 0)
                ) {
                    setTimeout(() => this.connect(), this.options.reconnectInterval)
                }

                resolve(this.sessionId!)
            }

            this.webSocket.onmessage = (message: any) => {
                // trace incoming message
                this.traceMessage({
                    isOutcoming: false,
                    data: message.data.toString(),
                })

                // if message is binary data, convert it to string
                let json = typeof message.data === "string" ? message.data : ""
                if (message.data instanceof ArrayBuffer) {
                    json = Buffer.from(message.data).toString()
                }

                // parse message and get its data
                let parsedMessage: {
                    id?: string
                    method?: string
                    params?: object
                    result?: object
                    error?: IJsonRpcError
                }

                try {
                    parsedMessage = JSON.parse(json)
                } catch (e) {
                    // TODO: decide how to handle parse errors
                    this.errorFilter(e)
                    this.errorFilter(new Error("Error parsing JSON: " + json))
                    return
                }

                // check if it's a reply
                if (parsedMessage.id) {
                    const pending = this.pendingMessages[parsedMessage.id]
                    if (pending) {
                        // clear pending message
                        delete this.pendingMessages[parsedMessage.id]

                        // resolve or reject the promise depending on the parsed message data
                        if (parsedMessage.error) {
                            this.errorFilter(parsedMessage.error)
                            pending.reject(parsedMessage.error)
                            return
                        } else {
                            pending.resolve(parsedMessage.result)
                        }
                    }

                    // TODO: decide how to handle unknown responses from server
                    return
                }

                // it's a notification, fire an event
                this.subscriptionManager.broadcast(parsedMessage.method!, parsedMessage.params!)
            }
        }))
    }

    public call<T>(message: IReturn<T>): Promise<T>
    public call(message: IReturnVoid): Promise<any>
    public async call<T>(message: IReturn<T> | IReturnVoid): Promise<any> {
        if (!this.connected) {
            await this.connect()
        }

        return await this.callCore(message)
    }

    private callCore<T>(message: IReturn<T> | IReturnVoid): Promise<any> {
        const name = this.nameOf(message)
        const messageId = this.generateMessageId()
        const msg = new RequestMessage(name, message, messageId)
        const serialized = JSON.stringify(msg)

        // prepare pending message
        const pendingMessage = new PendingMessage(messageId)
        this.pendingMessages[messageId] = pendingMessage

        // return a promise awaiting the results of the call
        return (pendingMessage.promise = new Promise((resolve, reject) => {
            // store resolve/reject callbacks for later use
            pendingMessage.resolve = resolve
            pendingMessage.reject = reject

            // fail early if not connected
            if (this.webSocket === undefined || !this.connected) {
                delete this.pendingMessages[messageId]
                const e = new Error("WebSocket not connected")
                this.errorFilter(e)
                reject(e)
                return
            }

            // trace outcoming message
            this.traceMessage({
                isOutcoming: true,
                data: serialized,
            })

            // send it
            this.webSocket.send(serialized)
        }))
    }

    // one-way calls
    public async notify<T>(message: IReturn<T> | IReturnVoid): Promise<void> {
        if (!this.connected) {
            await this.connect()
        }

        const name = this.nameOf(message)
        const msg = new RequestMessage(name, message)
        const serialized = JSON.stringify(msg)

        // fail if not connected
        if (this.webSocket === undefined || !this.connected) {
            const e = new Error("WebSocket not connected")
            this.errorFilter(e)
            throw e
        }

        // trace outcoming message
        this.traceMessage({
            isOutcoming: true,
            data: serialized,
        })

        // send it
        this.webSocket.send(serialized)
    }

    // outgoing message ids
    private lastMessageId = 0
    private generateMessageId() {
        return ++this.lastMessageId + ""
    }

    // stolen from the ServiceStack client
    public nameOf(o: any) {
        if (!o) {
            return "null"
        }

        if (typeof o.getTypeName === "function") {
            return o.getTypeName()
        }

        const ctor = o && o.constructor
        if (ctor === null) {
            const e = new Error(`${o} doesn't have constructor`)
            this.errorFilter(e)
            throw e
        }

        if (ctor.name) {
            return ctor.name
        }

        const str = ctor.toString()
        return str.substring(9, str.indexOf("(")) // "function ".length == 9
    }

    private subscriptionManager = new ClientSubscriptionManager()

    // returns unsubscription function
    public async subscribe(event: ISubscription): Promise<() => Promise<void>> {
        if (!this.connected) {
            await this.connect()
        }

        const cs = new ClientSubscription()
        cs.subscriptionId = this.generateMessageId()
        cs.eventName = event.eventName
        cs.eventHandler = event.eventHandler
        cs.eventFilter = event.eventFilter

        // notify the server about the new subscription
        const subMessage = cs.createSubscriptionMessage()
        await this.call(subMessage)

        // return async unsubscription
        const unsubscribe = this.subscriptionManager.add(cs)
        const unsubMessage = cs.createUnsubscriptionMessage()
        return async () => {
            unsubscribe()
            await this.call(unsubMessage)
        }
    }
}

export default JsonClient
