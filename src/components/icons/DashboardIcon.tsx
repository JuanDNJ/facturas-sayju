import type { SVGProps } from 'react'

function DashboardIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 25 24"
      width="100%"
      height="100%"
      {...props}
    >
      <g
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      >
        <path d="M10.5 13.026a.98.98 0 0 1-.975.98h-7.8a.98.98 0 0 1-.975-.98V2.236a.98.98 0 0 1 .976-.98l7.8.013a.98.98 0 0 1 .974.98z"></path>
        <path
          fill="currentColor"
          d="M23.246 7.044a.97.97 0 0 1-.975.962h-7.8a.97.97 0 0 1-.975-.962V2.23a.97.97 0 0 1 .973-.962l7.8-.013a.97.97 0 0 1 .977.962zM10.5 22.79a.97.97 0 0 1-.977.966l-7.8-.013a.97.97 0 0 1-.973-.964v-4.81a.97.97 0 0 1 .975-.963h7.8a.97.97 0 0 1 .975.964z"
        ></path>
        <path d="M14.472 23.756a.98.98 0 0 1-.976-.981V11.987a.977.977 0 0 1 .975-.981h7.8a.976.976 0 0 1 .975.98v10.776a.98.98 0 0 1-.974.98z"></path>
      </g>
    </svg>
  )
}

export default DashboardIcon
