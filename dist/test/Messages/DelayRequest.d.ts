import { IReturnVoid } from "../../src/IReturn";
export declare class DelayRequest implements IReturnVoid {
    constructor(ms?: number);
    Milliseconds?: number;
    getTypeName(): string;
}
