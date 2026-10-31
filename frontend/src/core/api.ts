import type { ApiResponse } from "@/types/types";
import { getAuthToken } from "@/lib/auth-token";
import { API_BASE_URL } from "./env";

export type { ApiResponse };

interface ApiOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
}

function statusMessage(status: number): string {
  if (status === 413) return "File is too large.";
  if (status === 401) return "Please sign in again to continue.";
  if (status === 403) return "You do not have permission to do that.";
  if (status === 404) return "We could not find what you were looking for.";
  if (status === 429) return "Too many requests, please wait a moment and try again.";
  if (status >= 500) return "Server is unavailable, please try again in a moment.";
  return "Something went wrong";
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

    // Cross-site deploys can't rely on the session cookie — see lib/auth-token.ts.
    const token = getAuthToken();

    const headers: Record<string, string> = {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
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

    // Read as text first: gateways (Render cold start, proxies) answer with
    // HTML or an empty body, which would make response.json() throw
    // "Unexpected token <".
    const raw = await response.text();
    let data: any = null;
    try {
      data = raw ? JSON.parse(raw) : null;
    } catch {
      data = null;
    }

    if (data === null || typeof data !== "object") {
      if (response.ok) {
        return { success: true, data: undefined };
      }
      return { success: false, error: statusMessage(response.status) };
    }

    if (!response.ok) {
      let errorMessage =
        data.message ||
        data.error ||
        (typeof data.errors === "string" ? data.errors : "") ||
        statusMessage(response.status);
      if (data.error?.body?.message) {
        errorMessage = data.error.body.message;
      } else if (typeof data.error === "string") {
        errorMessage = data.error;
      }

      let fieldErrors: Record<string, string> | undefined;
      if (Array.isArray(data.errors)) {
        fieldErrors = {};
        for (const e of data.errors) {
          if (e && typeof e.field === "string" && typeof e.message === "string") {
            // First message per field wins.
            fieldErrors[e.field] ??= e.message;
          }
        }
        if (Object.keys(fieldErrors).length === 0) fieldErrors = undefined;
      }

      return { success: false, error: errorMessage, fieldErrors };
    }

    return {
      success: true,
      data: data.data !== undefined ? data.data : data,
    };
  } catch (error) {
    // fetch() rejects with a bare TypeError ("Failed to fetch") when the
    // server is down or unreachable.
    return {
      success: false,
      error:
        error instanceof TypeError
          ? "Server is unavailable, please try again in a moment."
          : error instanceof Error
            ? error.message
            : "Network error",
    };
  }
}
