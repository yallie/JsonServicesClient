export declare class AuthResponse {
    Parameters: {
        [key: string]: string;
    };
    SessionId: string;
    AuthenticatedIdentity: {
        Name: string;
        AuthenticationType: string;
        IsAuthenticated: boolean;
    };
}
