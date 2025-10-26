import type { SVGProps } from 'react'

export function SuggestionsIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width="100%"
      height="100%"
      {...props}
    >
      <path
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M9 17h6l3 3v-3h2V9h-2M4 4h11v8H9l-3 3v-3H4z"
      ></path>
    </svg>
  )
}
