// types/auth.ts
export interface SignUpRequestBody {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  password: string;
}

export interface ForgotPasswordRequestBody {
  email: string;
}

export interface ResetPasswordRequestBody {
  token: string;
  password: string;
}

export interface ApiResponse<T = unknown> {
  success?: boolean;
  error?: string;
  message?: string;
  data?: T;
}
