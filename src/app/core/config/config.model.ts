import { BrowserAuthOptions, CacheOptions, InteractionType } from '@azure/msal-browser';

export interface Config {
  msal: Msal;
  guard: Guard;
  interceptor: Interceptor;
  apis: Apis;
}

export interface Msal {
  auth: BrowserAuthOptions;
  cache: CacheOptions;
}

export interface Guard {
  interactionType: InteractionType.Redirect | InteractionType.Popup;
  authRequest: AuthRequest;
}

export interface AuthRequest {
  scopes: string[];
}

export interface Interceptor {
  interactionType: InteractionType.Popup | InteractionType.Redirect;
  protectedResourceMap: Map<string, Array<string>>;
}

export interface Apis {
  insuranceApi: Api;
  borrowerApi: Api;
  tenantApi: Api;
  formMakerServiceApi: Api;
  reportingApi: Api;
}

export interface Api {
  url: string;
  scope: string;
}
