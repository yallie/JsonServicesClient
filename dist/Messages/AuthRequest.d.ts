import { AuthResponse } from "./AuthResponse";
import { IReturn } from "../IReturn";
export declare class AuthRequest implements IReturn<AuthResponse> {
    static userNameKey: string;
    static passwordKey: string;
    getTypeName: () => string;
    createResponse: () => AuthResponse;
    Parameters: {
        [key: string]: string;
    };
}
