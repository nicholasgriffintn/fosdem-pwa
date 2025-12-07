declare module 'webpush-webcrypto' {
    export interface PushSubscription {
        endpoint: string;
        keys: {
            auth: string;
            p256dh: string;
        };
    }

    // biome-ignore lint/complexity/noStaticOnlyClass: I don't care
    export class ApplicationServerKeys {
        static generate(options?: { 
            publicKey?: Uint8Array;
            privateKey?: Uint8Array;
        }): Promise<ApplicationServerKeys>;
        
        static fromJSON(json: {
            publicKey: string;
            privateKey: string;
        }): ApplicationServerKeys;
    }

    export interface PushRequestOptions {
        applicationServerKeys: ApplicationServerKeys;
        payload: string;
        target: PushSubscription;
        adminContact: string;
        ttl?: number;
        urgency?: 'very-low' | 'low' | 'normal' | 'high';
    }

    export interface PushRequest {
        headers: Record<string, string>;
        body: ArrayBuffer;
        endpoint: string;
    }

    export function generatePushHTTPRequest(options: PushRequestOptions): Promise<PushRequest>;
} 