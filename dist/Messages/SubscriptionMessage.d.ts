import { IReturnVoid } from "../IReturn";
interface ISubscription {
    SubscriptionId: string;
    Enabled: boolean;
    EventName: string;
    EventFilter?: {
        [key: string]: string;
    };
}
export declare class SubscriptionMessage implements IReturnVoid {
    static messageName: string;
    getTypeName: () => string;
    Subscriptions: ISubscription[];
}
export {};
