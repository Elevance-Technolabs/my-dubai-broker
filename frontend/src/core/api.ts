import type { ApiResponse } from "@/types/types";
import { API_BASE_URL } from "./env";

export type { ApiResponse };

interface ApiOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: ApiOptions = {},
): Promise<ApiResponse<T>> {
  try {
    let fullUrl = `${API_BASE_URL}${endpoint}`;

    if (options.params) {
      const searchParams = new URLSearchParams();
      Object.entries(options.params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });

      const queryString = searchParams.toString();
      if (queryString) {
        fullUrl += (fullUrl.includes("?") ? "&" : "?") + queryString;
      }
    }

    const isFormData = options.body instanceof FormData;

    const headers: Record<string, string> = {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(options.headers as Record<string, string>),
    };

    if (
      options.headers &&
      (options.headers as any)["Content-Type"] === undefined
    ) {
      delete headers["Content-Type"];
    }

    const response = await fetch(fullUrl, {
      ...options,
      credentials: options.credentials || "include",
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      let errorMessage =
        data.message || data.error || data.errors || "Something went wrong";
      if (data.error?.body?.message) {
        errorMessage = data.error.body.message;
      } else if (typeof data.error === "string") {
        errorMessage = data.error;
      }

      return { success: false, error: errorMessage };
    }

    return {
      success: true,
      data: data.data !== undefined ? data.data : data,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Network error",
    };
  }
}
