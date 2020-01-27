import { AuthRequest } from "./Messages/AuthRequest"
import { ICredentials } from "./ICredentials"
import { IJsonClient } from "./IJsonClient"

export class CredentialsBase implements ICredentials {
    constructor(credentials?: {
        userName: string,
        password: string,
    } | undefined) {
        // initialize parameters if specified
        if (credentials) {
            this.parameters[AuthRequest.userNameKey] = credentials.userName
            this.parameters[AuthRequest.passwordKey] = credentials.password
        }
    }

    public async authenticate(client: IJsonClient): Promise<string> {
        const msg = new AuthRequest()
        msg.Parameters = this.parameters
        const response = await client.call(msg)
        return response.SessionId
    }

    public parameters: {
        [key: string]: string
    } = {}
}