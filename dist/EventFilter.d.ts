export interface IEventFilter {
    [key: string]: string | null;
}
export declare class EventFilter {
    static matches(eventFilter?: IEventFilter | null, eventArgs?: {
        [key: string]: any;
    } | null): boolean;
    static valueMatches(filterValue: string, propertyValue: any): boolean;
    static stringMatches(filterValue?: string | null, propertyValue?: string | null): boolean;
    static numberMatches(filterValue?: string | null, propertyValue?: number | null): boolean;
    static boolMatches(filterValue?: string | null, propertyValue?: boolean | null): boolean;
}
