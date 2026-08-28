export interface User {
  id: number;
  nombre: string;
  email?: string;
  roles?: string[];
}

export type TaxModuleType = 'AUTOMOTORES' | 'REGISTROS' | 'LOGIN' | string;

export interface LoginRequest {
  usuario: string;
  clave: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  usuario: User;
  modulo: TaxModuleType;
  apiUrl: string;
}

export interface HttpOptions {
  headers?: { [header: string]: string | string[] };
  params?: { [param: string]: string | number | boolean | readonly (string | number | boolean)[] };
  responseType?: 'json' | 'text' | 'blob' | 'arraybuffer';
  withCredentials?: boolean;
  body?: any;
}
