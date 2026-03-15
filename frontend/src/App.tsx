import { useState } from 'react'
import './App.css'
import {
  MANDATORY_FIELDS,
  OPTIONAL_FIELDS,
  EMPTY_FORM,
  LOW_RISK_EXAMPLE,
  HIGH_RISK_EXAMPLE,
  NUMERIC_FIELDS,
} from './constants'
import type { LoanFormData, ApiResponse, Decision, FieldDef } from './types'

const API_BASE = import.meta.env.VITE_API_BASE;

function getDecision(r: ApiResponse): Decision {
  if (r.decline_flag === 1) return 'Reject'
  if (r.review_flag === 1) return 'Review'
  return 'Approve'
}

function buildPayload(form: LoanFormData): Record<string, string | number> {
  const payload: Record<string, string | number> = {}
  for (const [key, value] of Object.entries(form)) {
    if (value === '') continue
    if (NUMERIC_FIELDS.has(key)) {
      const n = parseFloat(value)
      if (!isNaN(n)) payload[key] = n
    } else {
      payload[key] = value
    }
  }
  return payload
}

export default function App() {
  const [form, setForm] = useState<LoanFormData>({ ...EMPTY_FORM })
  const [errors, setErrors] = useState<Partial<Record<keyof LoanFormData, string>>>({})
  const [result, setResult] = useState<ApiResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const [optionalOpen, setOptionalOpen] = useState(false)

  const handleChange = (key: keyof LoanFormData, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }))
    if (errors[key]) setErrors(prev => ({ ...prev, [key]: undefined }))
  }

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof LoanFormData, string>> = {}
    for (const field of MANDATORY_FIELDS) {
      const val = form[field.key]
      if (!val && val !== '0') {
        newErrors[field.key] = `${field.label} is required`
      } else if (field.type === 'number' && isNaN(parseFloat(val))) {
        newErrors[field.key] = `${field.label} must be a valid number`
      }
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: { preventDefault(): void }) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    setApiError(null)
    setResult(null)
    try {
      const res = await fetch(`${API_BASE}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPayload(form)),
      })
      if (!res.ok) {
        const text = await res.text()
        throw new Error(`API error ${res.status}: ${text}`)
      }
      setResult(await res.json())
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setForm({ ...EMPTY_FORM })
    setErrors({})
    setResult(null)
    setApiError(null)
  }

  const loadExample = (example: Partial<LoanFormData>) => {
    setForm({ ...EMPTY_FORM, ...example })
    setErrors({})
    setResult(null)
    setApiError(null)
  }

  const renderField = (field: FieldDef, required: boolean) => {
    const { key, label, type, options, step, placeholder } = field
    const error = errors[key]
    const value = form[key]
    return (
      <div key={key} className={`field-group${error ? ' has-error' : ''}`}>
        <label htmlFor={key}>
          {label}
          {required && <span className="req" aria-label="required"> *</span>}
        </label>
        {type === 'select' && options ? (
          <select
            id={key}
            value={value}
            onChange={e => handleChange(key, e.target.value)}
          >
            <option value="">— Select —</option>
            {options.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        ) : (
          <input
            id={key}
            type="number"
            value={value}
            onChange={e => handleChange(key, e.target.value)}
            step={step ?? 'any'}
            min="0"
            placeholder={placeholder}
          />
        )}
        {error && <span className="err-msg">{error}</span>}
      </div>
    )
  }

  const decision = result ? getDecision(result) : null

  return (
    <div className="app">
      {/* ── Topbar ── */}
      <header className="topbar">
        <div className="topbar-inner">
          <div className="brand">
            <svg className="brand-icon" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>CreditRisk<strong>Score</strong></span>
          </div>
          <a
            href="https://credit-risk-analysis-iuyk.onrender.com/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="docs-btn"
          >
            API Docs ↗
          </a>
        </div>
      </header>

      {/* ── Hero ── */}
      <div className="page-hero">
        <h1>Credit Risk Assessment</h1>
        <p>ML-powered loan default probability analysis using LendingClub data</p>
      </div>

      {/* ── Main grid ── */}
      <main className="main-grid">

        {/* Left: Form */}
        <section className="card form-card">
          <form onSubmit={handleSubmit} noValidate>
            <div className="section-header">
              <h2>Loan Application</h2>
              <span className="req-note">Fields marked <span className="req">*</span> are required</span>
            </div>

            <div className="section-label">Required Information</div>
            <div className="fields-grid">
              {MANDATORY_FIELDS.map(f => renderField(f, true))}
            </div>

            {/* Optional accordion */}
            <div className="accordion">
              <button
                type="button"
                className="accordion-btn"
                onClick={() => setOptionalOpen(o => !o)}
                aria-expanded={optionalOpen}
              >
                <span>Optional Fields ({OPTIONAL_FIELDS.length})</span>
                <svg
                  className={`chevron${optionalOpen ? ' open' : ''}`}
                  viewBox="0 0 24 24" fill="none" width="18" height="18"
                >
                  <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2"
                    strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              {optionalOpen && (
                <div className="accordion-body">
                  <div className="fields-grid">
                    {OPTIONAL_FIELDS.map(f => renderField(f, false))}
                  </div>
                </div>
              )}
            </div>

            {apiError && (
              <div className="api-error-banner">
                <span>⚠</span> {apiError}
              </div>
            )}

            <div className="btn-row">
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading
                  ? <><span className="spinner" /> Analyzing…</>
                  : '▶  Predict'
                }
              </button>
              <button type="button" className="btn btn-ghost" onClick={handleReset}>
                ↺ Reset
              </button>
              <button type="button" className="btn btn-approve"
                onClick={() => loadExample(LOW_RISK_EXAMPLE)}>
                ✓ Low Risk
              </button>
              <button type="button" className="btn btn-reject"
                onClick={() => loadExample(HIGH_RISK_EXAMPLE)}>
                ✗ High Risk
              </button>
            </div>
          </form>
        </section>

        {/* Right: Results */}
        <aside className="card results-card">
          <div className="section-header">
            <h2>Assessment Results</h2>
          </div>

          {!result && !loading && !apiError && (
            <div className="empty-state">
              <div className="empty-icon">
                <svg viewBox="0 0 64 64" fill="none" width="56" height="56">
                  <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="2" opacity="0.25" />
                  <path d="M22 32c0-5.5 4.5-10 10-10s10 4.5 10 10-4.5 10-10 10-10-4.5-10-10z"
                    stroke="currentColor" strokeWidth="2" opacity="0.4" />
                  <path d="M32 28v4l2 2" stroke="currentColor" strokeWidth="2"
                    strokeLinecap="round" opacity="0.6" />
                </svg>
              </div>
              <p>Fill in the loan application and click <strong>Predict</strong> to see the credit risk assessment.</p>
            </div>
          )}

          {loading && (
            <div className="loading-state">
              <div className="loader-ring" />
              <p>Analyzing credit profile…</p>
            </div>
          )}

          {result && decision && !loading && (
            <div className="results-body">
              {/* Decision badge */}
              <div className={`decision-badge badge-${decision.toLowerCase()}`}>
                <span className="badge-icon">
                  {decision === 'Approve' ? '✓' : decision === 'Review' ? '◐' : '✗'}
                </span>
                <div>
                  <div className="badge-label">Decision</div>
                  <div className="badge-value">{decision}</div>
                </div>
              </div>

              {/* PD + progress bar */}
              <div className="pd-block">
                <div className="pd-row">
                  <span className="pd-label">Probability of Default</span>
                  <span className={`pd-pct pct-${decision.toLowerCase()}`}>
                    {(result.pd_default * 100).toFixed(2)}%
                  </span>
                </div>
                <div className="progress-track">
                  <div
                    className={`progress-fill fill-${decision.toLowerCase()}`}
                    style={{ width: `${Math.min(result.pd_default * 100, 100)}%` }}
                  />
                  <div
                    className="threshold-pin review-pin"
                    style={{ left: `${result.review_threshold * 100}%` }}
                    title={`Review threshold: ${(result.review_threshold * 100).toFixed(0)}%`}
                  />
                  <div
                    className="threshold-pin decline-pin"
                    style={{ left: `${result.decline_threshold * 100}%` }}
                    title={`Decline threshold: ${(result.decline_threshold * 100).toFixed(0)}%`}
                  />
                </div>
                <div className="threshold-legend">
                  <span className="legend-review">
                    ▲ Review ≥ {(result.review_threshold * 100).toFixed(0)}%
                  </span>
                  <span className="legend-decline">
                    ▲ Reject ≥ {(result.decline_threshold * 100).toFixed(0)}%
                  </span>
                </div>
              </div>

              {/* Metrics grid */}
              <div className="metrics-grid">
                <div className="metric">
                  <span className="metric-label">PD Score</span>
                  <span className="metric-val">{(result.pd_default * 100).toFixed(4)}%</span>
                </div>
                <div className="metric">
                  <span className="metric-label">Review Threshold</span>
                  <span className="metric-val">{(result.review_threshold * 100).toFixed(0)}%</span>
                </div>
                <div className="metric">
                  <span className="metric-label">Decline Threshold</span>
                  <span className="metric-val">{(result.decline_threshold * 100).toFixed(0)}%</span>
                </div>
                <div className="metric">
                  <span className="metric-label">Review Flag</span>
                  <span className={`flag-pill ${result.review_flag ? 'flag-amber' : 'flag-off'}`}>
                    {result.review_flag ? 'TRIGGERED' : 'CLEAR'}
                  </span>
                </div>
                <div className="metric">
                  <span className="metric-label">Decline Flag</span>
                  <span className={`flag-pill ${result.decline_flag ? 'flag-red' : 'flag-off'}`}>
                    {result.decline_flag ? 'TRIGGERED' : 'CLEAR'}
                  </span>
                </div>
              </div>

              {/* Explanation */}
              <div className={`explanation expl-${decision.toLowerCase()}`}>
                {decision === 'Approve' && (
                  <p>✓ <strong>Approved.</strong> Default probability is below both the review threshold (10%) and decline threshold (30%).</p>
                )}
                {decision === 'Review' && (
                  <p>◐ <strong>Manual review required.</strong> Default probability exceeds the 10% review threshold but is below the 30% decline threshold.</p>
                )}
                {decision === 'Reject' && (
                  <p>✗ <strong>Declined.</strong> Default probability exceeds the 30% decline threshold, indicating high credit risk.</p>
                )}
              </div>
            </div>
          )}
        </aside>
      </main>

      <footer className="footer">
        <p>
          CreditRisk AI ·{' '}
          <a href="https://credit-risk-analysis-iuyk.onrender.com/docs"
            target="_blank" rel="noopener noreferrer">
            API Documentation ↗
          </a>
        </p>
      </footer>
    </div>
  )
}
