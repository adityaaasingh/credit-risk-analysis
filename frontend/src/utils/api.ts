const API_BASE = import.meta.env.VITE_API_BASE as string

const HEALTH_TIMEOUT_MS = 5000

export async function predictWithWakeup(
  payload: Record<string, string | number>,
  onWakingUp: () => void,
): Promise<unknown> {
  // Probe health with a short timeout to detect cold starts
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), HEALTH_TIMEOUT_MS)
    await fetch(`${API_BASE}/health`, { signal: controller.signal })
    clearTimeout(timer)
  } catch {
    // Timed out or failed — backend is waking up
    onWakingUp()
  }

  // Always proceed with the actual prediction
  const res = await fetch(`${API_BASE}/predict`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`API error ${res.status}: ${text}`)
  }

  return res.json()
}
