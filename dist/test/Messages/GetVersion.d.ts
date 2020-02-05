import { IReturn } from "../../src/IReturn";
import { GetVersionResponse } from "./GetVersionResponse";
export declare class GetVersion implements IReturn<GetVersionResponse> {
    IsInternal: boolean;
    getTypeName(): string;
    createResponse(): GetVersionResponse;
}
