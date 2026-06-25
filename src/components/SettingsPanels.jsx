import React from 'react'
import { DOMAINS } from '../sim/settings.js'
import { Slider, Segmented } from './Controls.jsx'

// Renders the four founding-dial domains from the schema. Editing any control
// calls onChange with the full updated settings object.
export function SettingsPanels({ settings, onChange }) {
  function update(domainKey, controlKey, value) {
    onChange({
      ...settings,
      [domainKey]: { ...settings[domainKey], [controlKey]: value },
    })
  }

  return (
    <div className="space-y-4">
      {DOMAINS.map((domain) => (
        <section key={domain.key} className="card p-4">
          <header className="mb-3">
            <h3 className="panel-title">
              <span className="text-lg">{domain.icon}</span>
              {domain.title}
            </h3>
            <p className="mt-0.5 text-xs text-slate-500">{domain.blurb}</p>
          </header>
          <div className="space-y-4">
            {domain.controls.map((c) => {
              const value = settings[domain.key][c.key]
              if (c.type === 'choice') {
                return (
                  <Segmented
                    key={c.key}
                    label={c.label}
                    value={value}
                    options={c.options}
                    tip={c.tip}
                    onChange={(v) => update(domain.key, c.key, v)}
                  />
                )
              }
              return (
                <Slider
                  key={c.key}
                  label={c.label}
                  value={value}
                  ends={c.ends}
                  tip={c.tip}
                  onChange={(v) => update(domain.key, c.key, v)}
                />
              )
            })}
          </div>
        </section>
      ))}
    </div>
  )
}
