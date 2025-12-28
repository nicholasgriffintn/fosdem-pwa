export interface ServiceWorkerRegistrationWithSync extends ServiceWorkerRegistration {
  sync: {
    register(tag: string): Promise<void>;
  };
}

export interface SyncResult {
  success: boolean;
  syncedCount: number;
  errors: string[];
}

export type ServerActionResult = {
  success: boolean;
  error?: string;
  statusCode?: number;
};
