export declare class RequestMessage {
    constructor(method: string, params: object, id?: string);
    jsonrpc: string;
    method: string;
    params: object;
    id?: string;
}
