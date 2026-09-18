'use client'

import { useEffect, useRef, useState } from 'react'
import { Icon } from '@/components/ui/Icon'
import { type ChatMessage, buildSystemPrompt, streamChat } from '@/lib/llm'
import { useStore } from '@/lib/store'

const QUICK = [
  { label: 'Jelaskan hasil prediksi', text: 'Jelaskan hasil prediksi formula ini dengan bahasa formulator: apa arti angkanya, interval, dan apa yang perlu diperhatikan.' },
  { label: 'Bahan mana yang berisiko', text: 'Bahan mana di formula ini yang berisiko untuk stabilitas, keamanan, atau kepatuhan, dan kenapa. Urutkan dari yang paling penting.' },
  { label: 'Usulkan perbaikan formula', text: 'Usulkan perbaikan formula ini agar memenuhi target QTPP: bahan yang perlu diubah, alternatifnya, dan rentang konsentrasi yang wajar.' },
  { label: 'Ringkas untuk manajer', text: 'Buat ringkasan singkat untuk manajer R&D: status formula, angka kunci, risiko utama, dan langkah berikutnya.' },
]

type Msg = { role: 'user' | 'assistant'; content: string }

/**
 * Formulabot: floating launcher plus a chat panel over the Qwen server, with
 * the active workspace injected into the system prompt on every request.
 */
export function Formulabot() {
  const { current: ws, ready } = useStore()
  const [open, setOpen] = useState(false)
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abort = useRef<AbortController | null>(null)
  const list = useRef<HTMLDivElement>(null)
  const key = `novagon.chat.${ws?.id ?? 'none'}`

  // history lives per workspace in localStorage, nothing leaves the browser except the request itself
  useEffect(() => {
    try {
      setMsgs(JSON.parse(localStorage.getItem(key) || '[]'))
    } catch {
      setMsgs([])
    }
  }, [key])
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(msgs.slice(-40)))
    } catch {
      /* storage blocked */
    }
    list.current?.scrollTo({ top: list.current.scrollHeight })
  }, [msgs, key])

  const send = async (text: string, history: Msg[] = msgs) => {
    const q = text.trim()
    if (!q || busy) return
    const next: Msg[] = [...history, { role: 'user', content: q }, { role: 'assistant', content: '' }]
    setMsgs(next)
    setInput('')
    setError(null)
    setBusy(true)
    abort.current = new AbortController()
    const payload: ChatMessage[] = [{ role: 'system', content: buildSystemPrompt(ws) }, ...next.slice(0, -1).slice(-12)]
    try {
      await streamChat(
        payload,
        (delta) => setMsgs((m) => m.map((x, i) => (i === m.length - 1 ? { ...x, content: x.content + delta } : x))),
        abort.current.signal,
      )
    } catch (e) {
      if (!(e instanceof DOMException && e.name === 'AbortError')) setError(e instanceof Error ? e.message : 'Formulabot tidak bisa dihubungi.')
    } finally {
      setBusy(false)
      abort.current = null
    }
  }

  const retry = () => {
    const lastUser = [...msgs].reverse().find((m) => m.role === 'user')
    if (!lastUser) return
    const before = msgs.slice(0, msgs.lastIndexOf(lastUser))
    send(lastUser.content, before)
  }

  const stop = () => abort.current?.abort()

  if (!ready) return null

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3 print:hidden">
      {open && (
        <section className="panel flex h-[560px] max-h-[80vh] w-[380px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden shadow-card" aria-label="Formulabot">
          <header className="flex items-center gap-3 border-b-2 border-line px-4 py-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/figma/formulabot.svg" alt="" width={36} height={36} className="rounded-full" />
            <div className="min-w-0 flex-1">
              <p className="text-[16px] font-bold leading-tight text-navy">Formulabot</p>
              <p className="truncate text-[11px] font-semibold text-grey-text">{ws ? `konteks: ${ws.name}, langkah ${ws.step}` : 'konteks: belum ada workspace'}</p>
            </div>
            <button type="button" onClick={() => setMsgs([])} className="text-[12px] font-bold text-blue hover:underline" disabled={busy || !msgs.length}>
              Bersihkan
            </button>
            <button type="button" onClick={() => setOpen(false)} className="text-navy" aria-label="Tutup Formulabot">
              <Icon name="close-circle" size={26} />
            </button>
          </header>

          <div ref={list} role="log" aria-live="polite" className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
            {msgs.length === 0 && (
              <p className="rounded-[10px] border border-line bg-white px-3 py-2 text-[13px] font-semibold text-grey-text">
                Halo, saya Formulabot. Saya membaca formula, QTPP, dan hasil prediksi di workspace ini. Tanya apa saja, atau pakai tombol cepat di bawah.
              </p>
            )}
            {msgs.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <p className={`max-w-[88%] whitespace-pre-wrap rounded-[14px] px-3 py-2 text-[13px] font-medium leading-snug ${m.role === 'user' ? 'bg-blue text-white' : 'border border-line bg-white text-black'}`}>
                  {m.content || (busy && i === msgs.length - 1 ? 'Sedang berpikir…' : '')}
                </p>
              </div>
            ))}
            {error && (
              <p role="alert" className="flex flex-wrap items-center gap-2 text-[12px] font-semibold text-bad">
                <Icon name="danger" size={16} /> {error}
                <button type="button" onClick={retry} className="underline">
                  coba lagi
                </button>
              </p>
            )}
          </div>

          <div className="border-t-2 border-line px-3 pb-3 pt-2">
            <div className="mb-2 flex flex-wrap gap-1">
              {QUICK.map((q) => (
                <button key={q.label} type="button" disabled={busy} onClick={() => send(q.text)} className="chip h-7 px-2 text-[11px] hover:bg-line disabled:opacity-50">
                  {q.label}
                </button>
              ))}
            </div>
            <form
              className="flex items-end gap-2"
              onSubmit={(e) => {
                e.preventDefault()
                send(input)
              }}
            >
              <textarea
                aria-label="Pesan untuk Formulabot"
                className="field min-h-[44px] flex-1 resize-none py-2 text-[13px] font-medium"
                rows={2}
                value={input}
                placeholder="Tanya Formulabot…"
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    send(input)
                  }
                }}
              />
              {busy ? (
                <button type="button" onClick={stop} className="btn-outline h-[44px] min-h-0 px-4 text-[13px]">
                  Stop
                </button>
              ) : (
                <button type="submit" className="btn-primary h-[44px] min-h-0 px-4 text-[13px]" disabled={!input.trim()}>
                  Kirim
                </button>
              )}
            </form>
          </div>
        </section>
      )}

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label={open ? 'Tutup Formulabot' : 'Buka Formulabot'}
        className="flex items-center gap-2 rounded-full border-2 border-sky bg-white py-1 pl-1 pr-4 shadow-card transition hover:brightness-[0.98]"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/figma/formulabot.svg" alt="" width={56} height={56} className="rounded-full" />
        <span className="text-[14px] font-bold text-navy">Formulabot</span>
      </button>
    </div>
  )
}

export default Formulabot
