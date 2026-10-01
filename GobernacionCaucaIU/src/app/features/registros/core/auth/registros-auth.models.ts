export interface DepartamentoContext {
  id: number;
  codigoDane: string;
  nombre: string;
}

export interface MunicipioContext {
  id: number;
  codigoDane: string;
  nombre: string;
  departamentoId?: number;
}

export interface EntidadRegistroContext {
  id: number;
  codigo: string;
  nombre: string;
  tipoEntidadCodigo?: string;
  departamentoId?: number;
  municipioId?: number;
}

export interface RegistrosUser {
  id: number;
  nombre: string;
  email: string;
  rol?: string;
  roles?: string[];
  tipoPortal: 'GOBERNACION' | 'ENTIDAD_REGISTRO';
  departamentoId?: number | null;
  departamento?: DepartamentoContext | null;
  municipioId?: number | null;
  municipio?: MunicipioContext | null;
  entidadRegistroId?: number | null;
  entidadRegistro?: EntidadRegistroContext | null;
}

export interface RegistrosLoginRequest {
  emailOrUsuario: string;
  password: string;
  portalRequerido?: 'GOBERNACION' | 'ENTIDAD_REGISTRO';
}

export interface RegistrosAuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  usuario: RegistrosUser;
}

export interface RegistrosRefreshTokenRequest {
  refreshToken: string;
}
