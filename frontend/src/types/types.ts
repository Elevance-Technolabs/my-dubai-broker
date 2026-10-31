export type ApiResponse<T> = {
    success: boolean;
    data?: T;
    error?: string;
    /** Field dot-path -> message, from a 400 validation response. */
    fieldErrors?: Record<string, string>;
};