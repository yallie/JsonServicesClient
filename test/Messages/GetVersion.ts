import { IReturn } from "../../src/IReturn"
import { GetVersionResponse } from "./GetVersionResponse"

export class GetVersion implements IReturn<GetVersionResponse> {
    public IsInternal!: boolean
    public getTypeName() {
        return "JsonServices.Tests.Messages.GetVersion"
    }
    public createResponse() {
        return new GetVersionResponse()
    }
}
