export interface IReturnVoid {
    getTypeName?(): string;
}
export interface IReturn<T> {
    getTypeName?(): string;
    createResponse(): T;
}
