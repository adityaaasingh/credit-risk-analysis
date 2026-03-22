const API_BASE = import.meta.env.VITE_API_BASE as string

const INTERVAL_MS = 14 * 60 * 1000 // 14 minutes

export function startKeepAlive(): void {
  const ping = () => {
    fetch(`${API_BASE}/health`).catch(() => {
      // silent — backend may be sleeping, that's fine
    })
  }

  setInterval(ping, INTERVAL_MS)
}
