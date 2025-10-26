import type { SVGProps } from 'react'

export function ViewEyeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 16 16"
      width="100%"
      height="100%"
      {...props}
    >
      <g fill="none" stroke="currentColor" strokeLinejoin="round" strokeWidth=".929">
        <path d="M8 3.895C12.447 3.895 14.5 8 14.5 8s-2.053 4.105-6.5 4.105S1.5 8 1.5 8S3.553 3.895 8 3.895Z"></path>
        <path d="M9.94 8a2 2 0 1 1-3.999 0a2 2 0 0 1 4 0Z"></path>
      </g>
    </svg>
  )
}
