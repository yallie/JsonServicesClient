import { IReturn } from "../../src/IReturn";
import { CalculateResponse } from "./CalculateResponse";
export declare class Calculate implements IReturn<CalculateResponse> {
    FirstOperand: number;
    Operation: string;
    SecondOperand: number;
    getTypeName(): string;
    createResponse(): CalculateResponse;
}
