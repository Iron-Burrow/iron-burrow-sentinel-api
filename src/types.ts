import type { ApiKeyRecord } from "./db/api-keys.js";
import type { UserRecord } from "./db/users.js";
import type { SentinelEnv } from "./env.js";
import type { MantleProvider } from "./providers/mantle-provider.js";

export interface AuthContext {
  apiKey: ApiKeyRecord;
  user: UserRecord;
}

export interface AppServices {
  env: SentinelEnv;
  mantleProvider: MantleProvider;
}

export interface AppBindings {
  Variables: {
    services: AppServices;
    requestId: string;
    startedAt: number;
    costUnits: number;
    auth: AuthContext | null;
  };
}
