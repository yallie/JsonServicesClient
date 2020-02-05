export declare class PendingMessage {
    id: string;
    promise?: Promise<any> | undefined;
    constructor(id: string, promise?: Promise<any> | undefined);
    resolve: (result: any) => void;
    reject: (error: any) => void;
}
export interface IPendingMessageQueue {
    [key: string]: PendingMessage | undefined;
}
