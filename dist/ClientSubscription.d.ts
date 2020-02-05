import { SubscriptionMessage } from "./Messages/SubscriptionMessage";
export declare class ClientSubscription {
    subscriptionId: string;
    eventName: string;
    eventHandler: (eventArgs: object) => void;
    eventFilter?: {
        [key: string]: string;
    };
    invoke: (eventArgs: object) => void;
    createSubscriptionMessage: () => SubscriptionMessage;
    createUnsubscriptionMessage: () => SubscriptionMessage;
}
