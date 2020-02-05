import { ICredentials } from "./ICredentials";
import { IReturn, IReturnVoid } from "./IReturn";
import { ISubscription } from "./ISubscription";
export interface IJsonClient {
    credentials?: ICredentials;
    connect(): Promise<string>;
    disconnect(): Promise<void>;
    connected: boolean;
    sessionId?: string;
    call<T>(message: IReturn<T>): Promise<T>;
    call(message: IReturnVoid): Promise<void>;
    notify(message: IReturnVoid): Promise<void>;
    subscribe(event: ISubscription): Promise<() => Promise<void>>;
    traceMessage(e: {
        isOutcoming: boolean;
        data: string;
    }): void;
}
