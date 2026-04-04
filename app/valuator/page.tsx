'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { motion, AnimatePresence } from 'framer-motion'
import { useDropzone } from 'react-dropzone'
import toast from 'react-hot-toast'
import {
  Paperclip, Send, X, FileText, Bot, User,
  RotateCcw, Sparkles, CheckCircle2, TrendingUp, Flag,
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────────

interface CVEvaluation {
  type: 'evaluation'
  score: number
  grade: string
  strengths: string[]
  improvements: string[]
  ausbildung_tips: string[]
  summary: string
  language: 'en' | 'de' | 'fr'
}

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  evaluation?: CVEvaluation
  file?: { name: string; size: number }
  timestamp: Date
}

// ─── Markdown renderer (simple) ──────────────────────────────────────────────

function renderMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^### (.+)$/gm, '<h3 class="text-sm font-semibold text-white mt-3 mb-1">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-sm font-bold text-white mt-4 mb-1.5">$1</h2>')
    .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc">$1</li>')
    .replace(/^(\d+)\. (.+)$/gm, '<li class="ml-4 list-decimal">$2</li>')
    .replace(/\n\n/g, '</p><p class="mb-2">')
    .replace(/\n/g, '<br />')
}

// ─── Score Ring ───────────────────────────────────────────────────────────────

function ScoreRing({ score }: { score: number }) {
  const radius = 44
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (score / 100) * circumference

  return (
    <div className="relative w-28 h-28 flex items-center justify-center">
      <svg width="112" height="112" className="absolute inset-0 -rotate-90">
        {/* Track */}
        <circle
          cx="56"
          cy="56"
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="6"
        />
        {/* Progress */}
        <motion.circle
          cx="56"
          cy="56"
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.85)"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
        />
      </svg>
      <div className="flex flex-col items-center">
        <motion.span
          className="text-3xl font-bold text-white"
          style={{ fontFamily: 'var(--font-geist-sans)', letterSpacing: '-0.04em', lineHeight: 1 }}
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          {score}
        </motion.span>
        <span
          style={{
            fontFamily: 'var(--font-geist-mono)',
            fontSize: '9px',
            color: 'rgba(255,255,255,0.35)',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}
        >
          /100
        </span>
      </div>
    </div>
  )
}

// ─── Evaluation Card ──────────────────────────────────────────────────────────

function EvaluationCard({ evaluation }: { evaluation: CVEvaluation }) {
  const sections = [
    {
      label: evaluation.language === 'de' ? 'Stärken' : evaluation.language === 'fr' ? 'Points forts' : 'Strengths',
      items: evaluation.strengths,
      icon: <CheckCircle2 size={13} />,
      accent: 'rgba(134,239,172,0.12)',
      border: 'rgba(134,239,172,0.20)',
      iconColor: 'rgba(134,239,172,0.80)',
    },
    {
      label: evaluation.language === 'de' ? 'Verbesserungen' : evaluation.language === 'fr' ? 'Améliorations' : 'Improvements',
      items: evaluation.improvements,
      icon: <TrendingUp size={13} />,
      accent: 'rgba(251,191,36,0.10)',
      border: 'rgba(251,191,36,0.18)',
      iconColor: 'rgba(251,191,36,0.80)',
    },
    {
      label: evaluation.language === 'de' ? 'Ausbildungs-Tipps' : evaluation.language === 'fr' ? 'Conseils Ausbildung' : 'Ausbildung Tips',
      items: evaluation.ausbildung_tips,
      icon: <Flag size={13} />,
      accent: 'rgba(147,197,253,0.10)',
      border: 'rgba(147,197,253,0.18)',
      iconColor: 'rgba(147,197,253,0.80)',
    },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className="w-full max-w-2xl"
    >
      {/* Header — Score ring + Grade */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05 }}
        className="flex items-center gap-6 mb-5 px-2"
      >
        <ScoreRing score={evaluation.score} />
        <div>
          <motion.div
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.25 }}
            className="flex items-baseline gap-2"
          >
            <span
              style={{
                fontFamily: 'var(--font-geist-sans)',
                fontSize: '52px',
                fontWeight: 700,
                color: '#ffffff',
                letterSpacing: '-0.05em',
                lineHeight: 1,
              }}
            >
              {evaluation.grade}
            </span>
            <span
              style={{
                fontFamily: 'var(--font-geist-mono)',
                fontSize: '11px',
                color: 'rgba(255,255,255,0.30)',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
              }}
            >
              Grade
            </span>
          </motion.div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            style={{
              fontFamily: 'var(--font-geist-sans)',
              fontSize: '12px',
              color: 'rgba(255,255,255,0.45)',
              marginTop: '4px',
              maxWidth: '240px',
              lineHeight: 1.5,
            }}
          >
            {evaluation.language === 'de' ? 'German Market Score' : evaluation.language === 'fr' ? 'Score Marché Allemand' : 'German Market Score'}
          </motion.p>
        </div>
      </motion.div>

      {/* Three columns */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
        {sections.map((section, si) => (
          <motion.div
            key={section.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 + si * 0.08 }}
            className="rounded-2xl p-3.5"
            style={{
              background: section.accent,
              border: `1px solid ${section.border}`,
            }}
          >
            <div className="flex items-center gap-1.5 mb-2.5" style={{ color: section.iconColor }}>
              {section.icon}
              <span
                style={{
                  fontFamily: 'var(--font-geist-sans)',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: section.iconColor,
                  letterSpacing: '0.02em',
                }}
              >
                {section.label}
              </span>
            </div>
            <ul className="space-y-1.5">
              {section.items.map((item, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.25 + si * 0.08 + i * 0.05 }}
                  style={{
                    fontFamily: 'var(--font-geist-sans)',
                    fontSize: '12px',
                    color: 'rgba(255,255,255,0.70)',
                    lineHeight: 1.5,
                    paddingLeft: '8px',
                    borderLeft: `2px solid ${section.border}`,
                  }}
                >
                  {item}
                </motion.li>
              ))}
            </ul>
          </motion.div>
        ))}
      </div>

      {/* Summary */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.45 }}
        className="rounded-2xl px-4 py-3"
        style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <p
          style={{
            fontFamily: 'var(--font-geist-sans)',
            fontSize: '13px',
            color: 'rgba(255,255,255,0.65)',
            lineHeight: 1.65,
          }}
        >
          {evaluation.summary}
        </p>
      </motion.div>
    </motion.div>
  )
}

// ─── Message Bubble ──────────────────────────────────────────────────────────

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user'

  // If assistant message has a structured evaluation, render the card
  if (!isUser && message.evaluation) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="flex gap-3 flex-row"
      >
        {/* Avatar */}
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-1"
          style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.12)',
          }}
        >
          <Bot size={12} style={{ color: 'rgba(255,255,255,0.70)' }} />
        </div>
        <div className="flex-1 min-w-0">
          <EvaluationCard evaluation={message.evaluation} />
          <p
            className="mt-2"
            style={{
              fontFamily: 'var(--font-geist-mono)',
              fontSize: '10px',
              color: 'rgba(255,255,255,0.20)',
            }}
          >
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {/* Avatar */}
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-1"
        style={{
          background: isUser
            ? 'rgba(255,255,255,0.08)'
            : 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.12)',
        }}
      >
        {isUser ? (
          <User size={12} style={{ color: 'rgba(255,255,255,0.70)' }} />
        ) : (
          <Bot size={12} style={{ color: 'rgba(255,255,255,0.70)' }} />
        )}
      </div>

      {/* Bubble */}
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 ${isUser ? 'rounded-tr-sm' : 'rounded-tl-sm'}`}
        style={{
          background: isUser
            ? 'rgba(255,255,255,0.07)'
            : 'rgba(255,255,255,0.04)',
          border: `1px solid ${isUser ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.07)'}`,
        }}
      >
        {/* File attachment chip */}
        {message.file && (
          <div
            className="flex items-center gap-2 mb-2 px-2.5 py-1.5 rounded-lg"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)' }}
          >
            <FileText size={11} style={{ color: 'rgba(255,255,255,0.55)' }} />
            <span style={{ fontFamily: 'var(--font-geist-mono)', fontSize: '11px', color: 'rgba(255,255,255,0.60)' }}>
              {message.file.name}
            </span>
            <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.30)' }}>
              {(message.file.size / 1024).toFixed(0)}KB
            </span>
          </div>
        )}

        {/* Text content */}
        {message.content === '...' ? (
          <div className="flex gap-1 items-center py-1">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: 'rgba(255,255,255,0.40)' }}
                animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.1, 0.8] }}
                transition={{ duration: 1.0, repeat: Infinity, delay: i * 0.18 }}
              />
            ))}
          </div>
        ) : (
          <div
            className="text-sm leading-relaxed"
            style={{
              fontFamily: 'var(--font-geist-sans)',
              color: isUser ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.75)',
              fontSize: '13.5px',
              lineHeight: '1.65',
            }}
            dangerouslySetInnerHTML={{ __html: renderMarkdown(message.content) }}
          />
        )}

        {/* Timestamp */}
        <p
          className="mt-1.5"
          style={{
            fontFamily: 'var(--font-geist-mono)',
            fontSize: '10px',
            color: 'rgba(255,255,255,0.20)',
            textAlign: isUser ? 'right' : 'left',
          }}
        >
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </motion.div>
  )
}

// ─── Starter Prompts ─────────────────────────────────────────────────────────

const STARTER_PROMPTS = [
  'Upload your CV and I\'ll analyze it for the German job market',
  'What ATS keywords are essential for German Ausbildung applications?',
  'How should a Moroccan candidate format their Lebenslauf?',
  'What are the biggest mistakes in German job applications?',
]

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function ValuatorPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Hallo! I\'m your German career coach. Upload your CV and I\'ll analyze it for the German job market — scoring your strengths, highlighting weaknesses, and generating ATS keywords for Ausbildung applications.\n\nYou can also ask me questions about German applications without uploading a file.',
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState('')
  const [attachedFile, setAttachedFile] = useState<File | null>(null)
  const [isStreaming, setIsStreaming] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const streamingIdRef = useRef<string | null>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // File drop
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setAttachedFile(acceptedFiles[0])
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
    noClick: true,
    onDropRejected: () => toast.error('Invalid file. PDF, DOC, DOCX, TXT — max 10MB.'),
  })

  const handleSend = async () => {
    const text = input.trim()
    if (!text && !attachedFile) return
    if (isStreaming) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text || (attachedFile ? 'Please analyze my CV.' : ''),
      file: attachedFile ? { name: attachedFile.name, size: attachedFile.size } : undefined,
      timestamp: new Date(),
    }

    const thinkingMessage: Message = {
      id: 'thinking',
      role: 'assistant',
      content: '...',
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage, thinkingMessage])
    setInput('')
    const fileToSend = attachedFile
    setAttachedFile(null)
    setIsStreaming(true)

    const assistantId = `assistant-${Date.now()}`
    streamingIdRef.current = assistantId

    try {
      const formData = new FormData()
      if (fileToSend) formData.append('file', fileToSend)
      formData.append('message', text || 'Analyze my CV for the German job market.')

      const res = await fetch('/api/valuator/chat', {
        method: 'POST',
        body: formData,
      })

      if (res.status === 429) {
        toast.error('API Quota Exceeded. Please try again in a moment.', { duration: 5000 })
        setMessages((prev) => prev.filter((m) => m.id !== 'thinking'))
        return
      }

      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'Unknown error' }))
        throw new Error(err.message || 'Request failed')
      }

      // Replace thinking bubble with empty assistant message, then stream into it
      setMessages((prev) =>
        prev.map((m) =>
          m.id === 'thinking'
            ? { ...m, id: assistantId, content: '' }
            : m
        )
      )

      // Stream text chunks
      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let accumulated = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        accumulated += chunk

        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, content: accumulated } : m
          )
        )
      }

      // After stream completes — try to parse as structured evaluation
      const trimmed = accumulated.trim()
      // Strip possible markdown code fences
      const jsonStr = trimmed.startsWith('```')
        ? trimmed.replace(/^```[a-z]*\n?/, '').replace(/\n?```$/, '').trim()
        : trimmed

      try {
        const parsed = JSON.parse(jsonStr)
        if (parsed?.type === 'evaluation') {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? { ...m, content: accumulated, evaluation: parsed as CVEvaluation }
                : m
            )
          )
        }
      } catch {
        // Not JSON — keep plain text rendering, no action needed
      }
    } catch (err) {
      toast.error((err as Error).message || 'Something went wrong. Please try again.')
      setMessages((prev) => prev.filter((m) => m.id !== 'thinking'))
    } finally {
      setIsStreaming(false)
      streamingIdRef.current = null
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleReset = () => {
    setMessages([{
      id: 'welcome',
      role: 'assistant',
      content: 'Hallo! I\'m your German career coach. Upload your CV and I\'ll analyze it for the German job market.\n\nYou can also ask me questions about German applications without uploading a file.',
      timestamp: new Date(),
    }])
    setAttachedFile(null)
    setInput('')
  }

  return (
    <AppShell>
      <div
        className="flex flex-col"
        style={{ height: 'calc(100dvh - 64px)' }}
        {...getRootProps()}
      >
        {/* Drag overlay */}
        <AnimatePresence>
          {isDragActive && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
              style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
            >
              <div
                className="flex flex-col items-center gap-3 p-8 rounded-2xl"
                style={{ border: '2px dashed rgba(255,255,255,0.30)', background: 'rgba(255,255,255,0.04)' }}
              >
                <Paperclip size={28} style={{ color: 'rgba(255,255,255,0.60)' }} />
                <p className="text-white font-medium">Drop your CV here</p>
                <p style={{ color: 'rgba(255,255,255,0.40)', fontSize: '12px' }}>PDF, DOC, DOCX, TXT</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3 shrink-0"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)' }}
            >
              <Sparkles size={13} style={{ color: 'rgba(255,255,255,0.70)' }} />
            </div>
            <div>
              <h1
                style={{
                  fontFamily: 'var(--font-geist-sans)',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#ffffff',
                  letterSpacing: '-0.02em',
                  lineHeight: 1,
                }}
              >
                CV Valuator
              </h1>
              <p
                style={{
                  fontFamily: 'var(--font-geist-mono)',
                  fontSize: '10px',
                  color: 'rgba(255,255,255,0.28)',
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                }}
              >
                German Market Analysis
              </p>
            </div>
          </div>
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-colors"
            style={{
              fontFamily: 'var(--font-geist-sans)',
              fontSize: '11px',
              color: 'rgba(255,255,255,0.35)',
              border: '1px solid rgba(255,255,255,0.07)',
            }}
          >
            <RotateCcw size={10} />
            New chat
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {/* Starter prompts — show only if just the welcome message */}
          {messages.length === 1 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2"
            >
              {STARTER_PROMPTS.map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => setInput(prompt)}
                  className="text-left px-3 py-2.5 rounded-xl transition-all text-xs leading-snug"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.07)',
                    color: 'rgba(255,255,255,0.50)',
                    fontFamily: 'var(--font-geist-sans)',
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.06)'
                    ;(e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.80)'
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.03)'
                    ;(e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.50)'
                  }}
                >
                  {prompt}
                </button>
              ))}
            </motion.div>
          )}

          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}

          <div ref={messagesEndRef} />
        </div>

        {/* Input bar — pinned to bottom */}
        <div
          className="shrink-0 px-4 py-3"
          style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}
        >
          {/* Attached file chip */}
          <AnimatePresence>
            {attachedFile && (
              <motion.div
                initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                animate={{ opacity: 1, height: 'auto', marginBottom: 8 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                className="flex items-center gap-2 px-3 py-2 rounded-xl w-fit"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}
              >
                <FileText size={12} style={{ color: 'rgba(255,255,255,0.60)' }} />
                <span style={{ fontFamily: 'var(--font-geist-mono)', fontSize: '11px', color: 'rgba(255,255,255,0.70)' }}>
                  {attachedFile.name}
                </span>
                <button
                  onClick={() => setAttachedFile(null)}
                  className="ml-1 hover:opacity-100 opacity-50 transition-opacity"
                >
                  <X size={11} style={{ color: 'rgba(255,255,255,0.70)' }} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Input row */}
          <div
            className="flex items-end gap-2 rounded-2xl px-3 py-2"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.10)',
            }}
          >
            {/* File attach button */}
            <label className="cursor-pointer shrink-0 mb-1">
              <input {...getInputProps()} style={{ display: 'none' }} />
              <div
                className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
                style={{ color: 'rgba(255,255,255,0.35)' }}
                onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.color = 'rgba(255,255,255,0.80)'}
                onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.color = 'rgba(255,255,255,0.35)'}
              >
                <Paperclip size={15} />
              </div>
            </label>

            {/* Text input */}
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={attachedFile ? 'Add a message or just press send...' : 'Ask about German CVs or attach your file...'}
              rows={1}
              className="flex-1 bg-transparent resize-none outline-none text-sm leading-relaxed"
              style={{
                fontFamily: 'var(--font-geist-sans)',
                fontSize: '13.5px',
                color: '#ffffff',
                maxHeight: '120px',
              }}
              onInput={(e) => {
                const el = e.currentTarget
                el.style.height = 'auto'
                el.style.height = `${Math.min(el.scrollHeight, 120)}px`
              }}
            />

            {/* Send button */}
            <motion.button
              onClick={handleSend}
              disabled={(!input.trim() && !attachedFile) || isStreaming}
              className="shrink-0 mb-1 w-8 h-8 flex items-center justify-center rounded-lg transition-all"
              style={{
                background: (input.trim() || attachedFile) && !isStreaming
                  ? '#ffffff'
                  : 'rgba(255,255,255,0.08)',
                color: (input.trim() || attachedFile) && !isStreaming
                  ? '#000000'
                  : 'rgba(255,255,255,0.25)',
              }}
              whileHover={(input.trim() || attachedFile) && !isStreaming ? { scale: 1.05 } : {}}
              whileTap={(input.trim() || attachedFile) && !isStreaming ? { scale: 0.95 } : {}}
            >
              {isStreaming ? (
                <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send size={13} />
              )}
            </motion.button>
          </div>

          <p
            className="text-center mt-2"
            style={{
              fontFamily: 'var(--font-geist-mono)',
              fontSize: '10px',
              color: 'rgba(255,255,255,0.18)',
              letterSpacing: '0.04em',
            }}
          >
            Powered by Gemini 2.0 Flash · German Market Specialist
          </p>
        </div>
      </div>
    </AppShell>
  )
}
