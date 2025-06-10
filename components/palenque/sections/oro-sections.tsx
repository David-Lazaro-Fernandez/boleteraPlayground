"use client"

import type React from "react"

interface SectionProps {
  className?: string
  onMouseEnter?: (e: React.MouseEvent) => void
  onMouseLeave?: () => void
  onClick?: () => void
}

export function Oro1Section({ className, onMouseEnter, onMouseLeave, onClick }: SectionProps) {
  return (
    <g className={className} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave} onClick={onClick}>
      <path
        d="M 900 400 L 1100 450 L 1150 600 L 1100 750 L 900 800 A 400 400 0 0 0 900 400 Z"
        fill="#F59E0B"
        fillOpacity="0.7"
        stroke="#D97706"
        strokeWidth="2"
      />
      <text x="1000" y="600" textAnchor="middle" fill="#92400E" fontSize="16" fontWeight="bold">
        ORO 1
      </text>
    </g>
  )
}

export function Oro2Section({ className, onMouseEnter, onMouseLeave, onClick }: SectionProps) {
  return (
    <g className={className} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave} onClick={onClick}>
      <path
        d="M 1100 750 L 1150 600 L 1300 650 L 1350 800 L 1200 850 A 400 400 0 0 1 1100 750 Z"
        fill="#F59E0B"
        fillOpacity="0.7"
        stroke="#D97706"
        strokeWidth="2"
      />
      <text x="1225" y="750" textAnchor="middle" fill="#92400E" fontSize="16" fontWeight="bold">
        ORO 2
      </text>
    </g>
  )
}

export function Oro3Section({ className, onMouseEnter, onMouseLeave, onClick }: SectionProps) {
  return (
    <g className={className} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave} onClick={onClick}>
      <path
        d="M 1200 850 L 1350 800 L 1400 950 L 1350 1100 L 1200 1050 A 400 400 0 0 1 1200 850 Z"
        fill="#F59E0B"
        fillOpacity="0.7"
        stroke="#D97706"
        strokeWidth="2"
      />
      <text x="1275" y="950" textAnchor="middle" fill="#92400E" fontSize="16" fontWeight="bold">
        ORO 3
      </text>
    </g>
  )
}

export function Oro4Section({ className, onMouseEnter, onMouseLeave, onClick }: SectionProps) {
  return (
    <g className={className} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave} onClick={onClick}>
      <path
        d="M 1200 1050 L 1350 1100 L 1300 1250 L 1150 1300 L 1100 1150 A 400 400 0 0 1 1200 1050 Z"
        fill="#F59E0B"
        fillOpacity="0.7"
        stroke="#D97706"
        strokeWidth="2"
      />
      <text x="1225" y="1175" textAnchor="middle" fill="#92400E" fontSize="16" fontWeight="bold">
        ORO 4
      </text>
    </g>
  )
}

export function Oro5Section({ className, onMouseEnter, onMouseLeave, onClick }: SectionProps) {
  return (
    <g className={className} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave} onClick={onClick}>
      <path
        d="M 1100 1150 L 1150 1300 L 1000 1350 L 900 1300 L 900 1200 A 400 400 0 0 1 1100 1150 Z"
        fill="#F59E0B"
        fillOpacity="0.7"
        stroke="#D97706"
        strokeWidth="2"
      />
      <text x="1000" y="1250" textAnchor="middle" fill="#92400E" fontSize="16" fontWeight="bold">
        ORO 5
      </text>
    </g>
  )
}

export function Oro6Section({ className, onMouseEnter, onMouseLeave, onClick }: SectionProps) {
  return (
    <g className={className} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave} onClick={onClick}>
      <path
        d="M 900 1200 L 900 1300 L 800 1350 L 650 1300 L 700 1150 A 400 400 0 0 1 900 1200 Z"
        fill="#F59E0B"
        fillOpacity="0.7"
        stroke="#D97706"
        strokeWidth="2"
      />
      <text x="775" y="1250" textAnchor="middle" fill="#92400E" fontSize="16" fontWeight="bold">
        ORO 6
      </text>
    </g>
  )
}

export function Oro7Section({ className, onMouseEnter, onMouseLeave, onClick }: SectionProps) {
  return (
    <g className={className} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave} onClick={onClick}>
      <path
        d="M 700 1150 L 650 1300 L 500 1250 L 450 1100 L 600 1050 A 400 400 0 0 1 700 1150 Z"
        fill="#F59E0B"
        fillOpacity="0.7"
        stroke="#D97706"
        strokeWidth="2"
      />
      <text x="575" y="1175" textAnchor="middle" fill="#92400E" fontSize="16" fontWeight="bold">
        ORO 7
      </text>
    </g>
  )
}

export function Oro8Section({ className, onMouseEnter, onMouseLeave, onClick }: SectionProps) {
  return (
    <g className={className} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave} onClick={onClick}>
      <path
        d="M 600 1050 L 450 1100 L 400 950 L 450 800 L 600 850 A 400 400 0 0 1 600 1050 Z"
        fill="#F59E0B"
        fillOpacity="0.7"
        stroke="#D97706"
        strokeWidth="2"
      />
      <text x="525" y="950" textAnchor="middle" fill="#92400E" fontSize="16" fontWeight="bold">
        ORO 8
      </text>
    </g>
  )
}
