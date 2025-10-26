import type { SVGProps } from 'react'

export function LockClosedIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      width="100%"
      height="100%"
      {...props}
    >
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M5 9V7a5 5 0 0 1 10 0v2a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2m8-2v2H7V7a3 3 0 0 1 6 0"
        clipRule="evenodd"
      ></path>
    </svg>
  )
}
