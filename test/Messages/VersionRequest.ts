import { IReturn } from "../../src/IReturn"
import { VersionResponse } from "./VersionResponse"

export class VersionRequest implements IReturn<VersionResponse> {
    public getTypeName() {
        return "rpc.version"
    }
    public createResponse(): VersionResponse {
        return new VersionResponse()
    }
}