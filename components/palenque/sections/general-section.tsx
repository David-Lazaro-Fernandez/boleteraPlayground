"use client"

import type React from "react"

interface GeneralSectionProps {
  className?: string
  onMouseEnter?: (e: React.MouseEvent) => void
  onMouseLeave?: () => void
  onClick?: () => void
}

export function GeneralSection({ className, onMouseEnter, onMouseLeave, onClick }: GeneralSectionProps) {
  return (
    <g className={className} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave} onClick={onClick}>
      {/* Sección General - Área circular exterior */}
      <path
        d="M 900 200 A 700 700 0 0 1 1600 900 A 700 700 0 0 1 900 1600 A 700 700 0 0 1 200 900 A 700 700 0 0 0 900 200 Z M 900 400 A 500 500 0 0 0 400 900 A 500 500 0 0 0 900 1400 A 500 500 0 0 0 1400 900 A 500 500 0 0 0 900 400 Z"
        fill="#10B981"
        fillOpacity="0.6"
        stroke="#059669"
        strokeWidth="2"
      />
      <text x="900" y="300" textAnchor="middle" fill="#065F46" fontSize="24" fontWeight="bold">
        GENERAL
      </text>
    </g>
  )
}
