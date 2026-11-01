import { useState } from 'react'
import { clubLogoFor, clubLogoUrl } from '../utils/clubLogos.js'

const SIZE_CLASS = {
  xs: 'h-4 w-4',
  sm: 'h-5 w-5',
  md: 'h-7 w-7',
  lg: 'h-9 w-9',
}

export default function ClubLogo({ name, size = 'sm', loading = 'lazy', className = '' }) {
  const logo = clubLogoFor(name)
  const [failedFile, setFailedFile] = useState(null)

  if (!logo || failedFile === logo.file) return null

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-logobg ${SIZE_CLASS[size] ?? SIZE_CLASS.sm} ${className}`}
      aria-hidden="true"
    >
      <img
        src={clubLogoUrl(logo)}
        alt=""
        loading={loading}
        decoding="async"
        className={`h-full w-full ${logo.fit === 'contain' ? 'object-contain' : 'object-cover'}`}
        onError={() => setFailedFile(logo.file)}
      />
    </span>
  )
}
