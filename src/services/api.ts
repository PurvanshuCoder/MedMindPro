/** Backend root only (no `/api` suffix). Trailing slashes stripped. */
function normalizeApiBase(raw: string): string {
  let base = raw.trim().replace(/\/+$/, '')
  if (base.endsWith('/api')) base = base.slice(0, -4).replace(/\/+$/, '')

  // If someone sets "example.com" (no scheme), fetch() treats it as a relative
  // path under the current origin, causing POSTs to hit the Vercel domain and 405.
  if (base && !/^https?:\/\//i.test(base)) {
    const hostOnly = base.replace(/^\/+/, '')
    const isLocal =
      hostOnly.startsWith('localhost') || hostOnly.startsWith('127.0.0.1')
    base = `${isLocal ? 'http' : 'https'}://${hostOnly}`
  }
  return base
}

const API_BASE_URL = normalizeApiBase(
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000',
)

if (import.meta.env.DEV) {
  // eslint-disable-next-line no-console
  console.log('[MedMind] API base URL:', API_BASE_URL)
}

export function getApiBaseUrl() {
  return API_BASE_URL
}

export function getToken() {
  return localStorage.getItem('smm_token')
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem('smm_token', token)
  else localStorage.removeItem('smm_token')
}

/** JSON request without throwing on non-2xx (for multi-step auth). */
export async function apiRequestJson<T>(
  path: string,
  init?: {
    method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'
    body?: unknown
    /** false = omit Authorization header */
    withAuth?: boolean
  },
): Promise<{ ok: boolean; status: number; data: T }> {
  const token = init?.withAuth === false ? null : getToken()
  const url = `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`

  const res = await fetch(url, {
    redirect: 'follow',
    method: init?.method ?? 'GET',
    headers: {
      ...(init?.body !== undefined && !(init.body instanceof FormData)
        ? { 'Content-Type': 'application/json' }
        : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body:
      init?.body !== undefined && !(init.body instanceof FormData)
        ? JSON.stringify(init.body)
        : (init?.body as BodyInit | undefined),
  })

  let data = {} as T
  try {
    data = (await res.json()) as T
  } catch {
    /* ignore */
  }
  return { ok: res.ok, status: res.status, data }
}

type ApiError = {
  message?: string
}

export async function apiFetch<T>(
  path: string,
  options?: {
    method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'
    body?: any
    headers?: Record<string, string>
  },
): Promise<T> {
  const token = getToken()
  const url = `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`

  const res = await fetch(url, {
    redirect: 'follow',
    method: options?.method ?? 'GET',
    headers: {
      ...(options?.headers ?? {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options?.body && !(options.body instanceof FormData)
        ? { 'Content-Type': 'application/json' }
        : {}),
    },
    body: options?.body
      ? options.body instanceof FormData
        ? options.body
        : JSON.stringify(options.body)
      : undefined,
  })

  if (!res.ok) {
    let errMsg = `Request failed (${res.status})`
    try {
      const data = (await res.json()) as ApiError
      if (data?.message) errMsg = data.message
    } catch {
      // ignore parse error
    }
    throw new Error(errMsg)
  }

  return (await res.json()) as T
}

