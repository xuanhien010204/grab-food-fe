export interface LoginRequest {
    email: string;
    password: string;
}

export interface RegisterRequest {
    name: string;
    email: string;
    phone: string;
    password: string;
}

export interface UserProfile {
    id: string;
    email: string;
    name: string;
    balance: number;
}
