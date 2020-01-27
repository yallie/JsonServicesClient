import { ICredentials } from "./ICredentials"
import { IReturn, IReturnVoid } from "./IReturn"
import { ISubscription } from "./ISubscription"

export interface IJsonClient {
    credentials?: ICredentials
    connect(): Promise<string>
    disconnect(): Promise<void>

    // status
    connected: boolean
    sessionId?: string

    // two-way calls
    call<T>(message: IReturn<T>): Promise<T>
    call(message: IReturnVoid): Promise<void>

    // one-way calls
    notify(message: IReturnVoid): Promise<void>

    // returns unsubscription method
    subscribe(event: ISubscription): Promise<() => Promise<void>>

    // tracing
    traceMessage(e: { isOutcoming: boolean, data: string }): void
}