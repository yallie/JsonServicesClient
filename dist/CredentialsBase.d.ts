import { ICredentials } from "./ICredentials";
import { IJsonClient } from "./IJsonClient";
export declare class CredentialsBase implements ICredentials {
    constructor(credentials?: {
        userName: string;
        password: string;
    } | undefined);
    authenticate(client: IJsonClient): Promise<string>;
    parameters: {
        [key: string]: string;
    };
}
