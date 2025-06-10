"use client"

import type React from "react"

interface SectionProps {
  className?: string
  onMouseEnter?: (e: React.MouseEvent) => void
  onMouseLeave?: () => void
  onClick?: () => void
}

export function VIP1Section({ className, onMouseEnter, onMouseLeave, onClick }: SectionProps) {
  return (
    <g className={className} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave} onClick={onClick}>
      <path
        d="M 900 500 L 1000 520 L 1050 650 L 1000 780 L 900 800 A 300 300 0 0 0 900 500 Z"
        fill="#8B5CF6"
        fillOpacity="0.8"
        stroke="#7C3AED"
        strokeWidth="2"
      />
      <text x="975" y="650" textAnchor="middle" fill="#5B21B6" fontSize="14" fontWeight="bold">
        VIP 1
      </text>
    </g>
  )
}

export function VIP2Section({ className, onMouseEnter, onMouseLeave, onClick }: SectionProps) {
  return (
    <g className={className} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave} onClick={onClick}>
      <path
        d="M 1000 780 L 1050 650 L 1180 700 L 1230 830 L 1130 880 A 300 300 0 0 1 1000 780 Z"
        fill="#8B5CF6"
        fillOpacity="0.8"
        stroke="#7C3AED"
        strokeWidth="2"
      />
      <text x="1140" y="790" textAnchor="middle" fill="#5B21B6" fontSize="14" fontWeight="bold">
        VIP 2
      </text>
    </g>
  )
}

export function VIP3Section({ className, onMouseEnter, onMouseLeave, onClick }: SectionProps) {
  return (
    <g className={className} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave} onClick={onClick}>
      <path
        d="M 1130 880 L 1230 830 L 1180 960 L 1050 1010 L 1000 880 A 300 300 0 0 1 1130 880 Z"
        fill="#8B5CF6"
        fillOpacity="0.8"
        stroke="#7C3AED"
        strokeWidth="2"
      />
      <text x="1140" y="920" textAnchor="middle" fill="#5B21B6" fontSize="14" fontWeight="bold">
        VIP 3
      </text>
    </g>
  )
}

export function VIP4Section({ className, onMouseEnter, onMouseLeave, onClick }: SectionProps) {
  return (
    <g className={className} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave} onClick={onClick}>
      <path
        d="M 1000 880 L 1050 1010 L 920 1060 L 870 930 L 970 880 A 300 300 0 0 1 1000 880 Z"
        fill="#8B5CF6"
        fillOpacity="0.8"
        stroke="#7C3AED"
        strokeWidth="2"
      />
      <text x="960" y="970" textAnchor="middle" fill="#5B21B6" fontSize="14" fontWeight="bold">
        VIP 4
      </text>
    </g>
  )
}
