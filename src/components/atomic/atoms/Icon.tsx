import type { FC } from 'react'

type IconProps = {
  children?: React.ReactNode
  className?: string
}

const Icon: FC<IconProps> = (props) => {
  const { children, className } = props

  return <span className={`${className}`}>{children}</span>
}

export default Icon
