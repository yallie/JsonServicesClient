import { ICredentials } from "./ICredentials";
import { IJsonClient } from "./IJsonClient";
import { IReturn, IReturnVoid } from "./IReturn";
import { ISubscription } from "./ISubscription";
export interface IJsonRpcError {
    code: number;
    message: string;
    data: object;
}
export interface IJsonClientOptions {
    reconnect: boolean;
    reconnectInterval: number;
    maxReconnects: number;
    credentials?: ICredentials;
}
export declare class JsonClient implements IJsonClient {
    url: string;
    private options;
    constructor(url: string, options?: IJsonClientOptions);
    connected: boolean;
    sessionId?: string;
    credentials?: ICredentials;
    private webSocket?;
    private reconnects;
    private pendingMessages;
    traceMessage: (_: {
        isOutcoming: boolean;
        data: string;
    }) => void;
    errorFilter: (_: IJsonRpcError | Error) => void;
    disconnect(): Promise<void>;
    private rejectPendingMessages;
    private connectPromise?;
    connect(credentials?: ICredentials): Promise<string>;
    call<T>(message: IReturn<T>): Promise<T>;
    call(message: IReturnVoid): Promise<any>;
    private callCore;
    notify<T>(message: IReturn<T> | IReturnVoid): Promise<void>;
    private lastMessageId;
    private generateMessageId;
    nameOf(o: any): any;
    private subscriptionManager;
    subscribe(event: ISubscription): Promise<() => Promise<void>>;
}
export default JsonClient;
