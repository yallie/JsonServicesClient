import { ClientSubscription } from "./ClientSubscription";
export declare class ClientSubscriptionManager {
    private emitter;
    private subscriptions;
    add: (subscription: ClientSubscription) => () => void;
    broadcast: (eventName: string, eventArgs: object) => void;
}
