import { getAuthToken } from "../services/tokenStorage";

const DEFAULT_BASE_URL = "https://api-dev.faroty.com";

// Resolve import.meta.env safely (some TypeScript configs may not have env typed)
const _import_meta_env: any =
  typeof import.meta !== "undefined" && (import.meta as any).env
    ? (import.meta as any).env
    : undefined;

const normalizedEnvBase = (() => {
  const raw = _import_meta_env?.VITE_API_BASE_URL;
  if (typeof raw !== "string") return "";
  return raw.trim().replace(/\/+$/g, "");
})();

const compileTimeProxy =
  !_import_meta_env?.SSR &&
  Boolean(_import_meta_env?.DEV) &&
  (normalizedEnvBase === "" || normalizedEnvBase === "/api");

const runtimeWantsProxy = (() => {
  if (typeof window === "undefined") return false;
  const host = window.location.hostname;
  const isLocal =
    host === "localhost" ||
    host === "127.0.0.1" ||
    host.startsWith("192.168.") ||
    host.endsWith(".local");
  const proxyableBase =
    normalizedEnvBase === "" ||
    normalizedEnvBase === "/" ||
    normalizedEnvBase === "/api" ||
    normalizedEnvBase === DEFAULT_BASE_URL;
  return isLocal && proxyableBase;
})();

const shouldUseProxy = compileTimeProxy || runtimeWantsProxy;

const proxyableBases = [DEFAULT_BASE_URL];
if (normalizedEnvBase && normalizedEnvBase !== DEFAULT_BASE_URL) {
  proxyableBases.push(normalizedEnvBase);
}

// In dev, default to proxy (relative paths) unless a base was explicitly provided
export const API_BASE_URL = shouldUseProxy
  ? normalizedEnvBase || ""
  : normalizedEnvBase || DEFAULT_BASE_URL;

type QueryRecord = Record<string, string | number | boolean | undefined | null>;

export interface ApiFetchOptions extends RequestInit {
  query?: QueryRecord;
  skipJsonParsing?: boolean;
}

const DEFAULT_HEADERS: HeadersInit = {
  "Content-Type": "application/json",
};

function buildUrl(path: string, query?: QueryRecord) {
  // Si on est en mode proxy, convertir les URLs absolues connues en chemins relatifs
  if (shouldUseProxy && path.startsWith("http")) {
    const matchingBase = proxyableBases.find(
      (base) => base && path.toLowerCase().startsWith(base.toLowerCase()),
    );
    if (matchingBase) {
      const relative = path.slice(matchingBase.length) || "/";
      return buildUrl(relative, query);
    }
  }

  // Si le path est déjà une URL complète (et non proxyable), l'utiliser directement
  if (path.startsWith("http")) {
    const url = new URL(path);
    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        if (value === undefined || value === null) return;
        url.searchParams.set(key, String(value));
      });
    }
    return url.toString();
  }

  // Construire le chemin normalisé
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  
  // En développement avec proxy, utiliser le chemin relatif
  // Le proxy Vite redirigera vers https://api-dev.faroty.com
  if (!API_BASE_URL) {
    const url = new URL(normalizedPath, window.location.origin);
    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        if (value === undefined || value === null) return;
        url.searchParams.set(key, String(value));
      });
    }
    return url.toString();
  }
  
  // En production, utiliser l'URL complète de l'API
  const fullPath = `${API_BASE_URL}${normalizedPath}`;
  const url = new URL(fullPath);
  
  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value === undefined || value === null) return;
      url.searchParams.set(key, String(value));
    });
  }
  
  return url.toString();
}

export async function apiFetch<TResponse = unknown>(
  path: string,
  options: ApiFetchOptions = {},
): Promise<TResponse> {
  const { query, skipJsonParsing, headers, body, ...rest } = options;
  const finalUrl = buildUrl(path, query);
  const isJsonPayload =
    body !== undefined &&
    typeof body === "object" &&
    !(body instanceof FormData) &&
    !(body instanceof Blob);

  // Récupérer le token d'authentification
  const token = getAuthToken();
  
  // Créer les en-têtes d'authentification si un token est disponible
  const authHeaders: HeadersInit = {};
  if (token) {
    // Vérifier si le token contient déjà 'Bearer '
    const authValue = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
    authHeaders['Authorization'] = authValue;
  }

  // Fusionner les en-têtes avec priorité : headers personnalisés > auth > defaults
  const mergedHeaders: HeadersInit = {
    ...DEFAULT_HEADERS,
    ...headers, // Les en-têtes personnalisés peuvent écraser les valeurs par défaut
    ...authHeaders, // L'authentification a la priorité la plus haute
  };
  
  // Journalisation des en-têtes en développement
  if (_import_meta_env?.DEV) {
    console.log('[API] Auth token:', token ? 'Present' : 'Missing');
    console.log('[API] Final request headers:', JSON.parse(JSON.stringify(mergedHeaders)));
  }

  if (body instanceof FormData || body instanceof Blob) {
    delete (mergedHeaders as Record<string, string>)["Content-Type"];
  }

  // Préparer le body
  let requestBody: BodyInit | undefined;
  if (isJsonPayload) {
    requestBody = JSON.stringify(body);
  } else if (body !== undefined) {
    requestBody = body as BodyInit;
  }

  // Log pour le débogage en développement
  if (_import_meta_env?.DEV) {
    console.log(`[API] ${rest.method || "GET"} ${finalUrl}`);
    if (body) {
      console.log("[API] Request body (raw):", body);
      console.log("[API] Request body (stringified):", isJsonPayload ? JSON.stringify(body, null, 2) : body);
    }
    console.log("[API] Request headers:", mergedHeaders);
    console.log("[API] Request body (final):", requestBody);
  }

  try {
    const response = await fetch(finalUrl, {
      method: rest.method || "GET",
      headers: mergedHeaders,
      body: requestBody,
      ...rest,
    });
    
    // Log de la réponse immédiatement
    if (_import_meta_env?.DEV) {
      console.log(`[API] Response status: ${response.status} ${response.statusText}`);
      console.log("[API] Response headers:", Object.fromEntries(response.headers.entries()));
    }

    if (!response.ok) {
      let errorMessage = `API request failed (${response.status} ${response.statusText})`;
      let errorDetails: any = null;
      let errorPayloadText = "";
      
      try {
        // Toujours essayer de lire le body, même s'il est vide
        errorPayloadText = await response.text();
        console.log("[API Error] Raw error payload:", errorPayloadText);
        
        if (errorPayloadText && errorPayloadText.trim()) {
          // Essayer de parser comme JSON pour un message plus clair
          try {
            const errorJson = JSON.parse(errorPayloadText);
            errorDetails = errorJson;
            errorMessage = errorJson.message || errorJson.error || errorJson.detail || errorJson.title || errorPayloadText;
          } catch (parseError) {
            // Si ce n'est pas du JSON, utiliser le texte brut
            errorMessage = errorPayloadText;
            errorDetails = { raw: errorPayloadText };
          }
        } else {
          // Pas de body, utiliser le status
          errorMessage = `Server error: ${response.status} ${response.statusText}`;
        }
      } catch (e) {
        console.error("Error reading error response:", e);
        errorMessage = `Failed to read error response: ${response.status} ${response.statusText}`;
      }
      
      // Log détaillé en développement
      if (_import_meta_env?.DEV) {
        console.error(`[API Error] ${response.status} ${response.statusText}`, {
          url: finalUrl,
          method: rest.method || "GET",
          errorDetails: errorDetails || errorPayloadText || "No error details",
          requestBody: body ? (isJsonPayload ? JSON.stringify(body, null, 2) : body) : undefined,
        });
      }
      
      throw new Error(errorMessage);
    }
    
    // Log de la réponse en développement
    if (_import_meta_env?.DEV && response.status !== 204) {
      try {
        const clone1 = response.clone();
        const text = await clone1.text();
        try {
          const parsed = JSON.parse(text);
          console.log('[API] Response (parsed):', parsed);
        } catch {
          console.log('[API] Response (text):', text);
        }
      } catch (e) {
        console.warn('[API] Failed to read response body for logging:', e);
      }
    }

    if (skipJsonParsing) {
      return undefined as TResponse;
    }

    if (response.status === 204) {
      return undefined as TResponse;
    }

    return (await response.json()) as TResponse;
  } catch (error) {
    // Si c'est déjà une Error, la relancer
    if (error instanceof Error) {
      throw error;
    }
    // Sinon, créer une nouvelle Error
    throw new Error(`API request failed: ${String(error)}`);
  }
}

export const apiClient = {
  get: <T>(path: string, options?: ApiFetchOptions) =>
    apiFetch<T>(path, { ...options, method: "GET" }),
  post: <T>(path: string, body?: unknown, options?: ApiFetchOptions) =>
    apiFetch<T>(path, { ...options, method: "POST", body: body as any }),
  put: <T>(path: string, body?: unknown, options?: ApiFetchOptions) =>
    apiFetch<T>(path, { ...options, method: "PUT", body: body as any }),
  patch: <T>(path: string, body?: unknown, options?: ApiFetchOptions) =>
    apiFetch<T>(path, { ...options, method: "PATCH", body: body as any }),
  delete: <T>(path: string, options?: ApiFetchOptions) =>
    apiFetch<T>(path, { ...options, method: "DELETE" }),
};

