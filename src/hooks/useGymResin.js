import { useEffect, useState } from 'react'
import { ORG } from '../config.js'
import { getCachedGymnasium, loadGymnasium } from '../api/h4a.js'

export function useGymResin(gymId) {
  const [wax, setWax] = useState(() => getCachedGymnasium(ORG, gymId)?.wax ?? null)

  useEffect(() => {
    let active = true
    if (!gymId) {
      setWax(null)
      return undefined
    }

    const cached = getCachedGymnasium(ORG, gymId)
    if (cached) {
      setWax(cached.wax)
      return undefined
    }

    setWax(null)
    loadGymnasium(ORG, gymId)
      .then((info) => {
        if (active) setWax(info?.wax ?? '')
      })
      .catch(() => {
        if (active) setWax('')
      })

    return () => {
      active = false
    }
  }, [gymId])

  return wax
}
