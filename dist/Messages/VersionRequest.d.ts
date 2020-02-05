import { IReturn } from "../IReturn";
import { VersionResponse } from "./VersionResponse";
export declare class VersionRequest implements IReturn<VersionResponse> {
    getTypeName(): string;
    createResponse(): VersionResponse;
}
