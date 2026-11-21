import {
  BEZIRKE,
  BEZIRK_PARAM,
  BEZIRK_STORAGE_KEY,
  DEFAULT_BEZIRK,
} from '../config.js'

const ids = new Set(BEZIRKE.map((bezirk) => bezirk.id))

export function isBezirkId(value) {
  return ids.has(String(value ?? '').trim())
}

export function readBezirkFromUrl() {
  const value = new URLSearchParams(window.location.search).get(BEZIRK_PARAM) || ''
  return isBezirkId(value) ? value : ''
}

export function readStoredBezirk() {
  try {
    const value = window.localStorage.getItem(BEZIRK_STORAGE_KEY) || ''
    return isBezirkId(value) ? value : ''
  } catch {
    return ''
  }
}

export function storeBezirk(bezirk) {
  try {
    window.localStorage.setItem(BEZIRK_STORAGE_KEY, bezirk)
  } catch {
    /* localStorage nicht verfügbar */
  }
}

export function bezirkLabel(bezirk) {
  return BEZIRKE.find((item) => item.id === bezirk)?.label ??
    BEZIRKE.find((item) => item.id === DEFAULT_BEZIRK).label
}
