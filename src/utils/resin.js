const PREFIX = /^Regelung\s+Haftmittelverbot\s*:\s*/i
const RESIN_CONTEXT =
  /(haftmittel|harz|resin|wax|grip|klebemittel|haftspray|haftpaste|profcare|trimona|molten|kempa|dip)/i
const ALLOWED = /(erlaubt|erlaubnis|gestattet|geduldet|freigabe|genehmigung)/i
const FORBIDDEN =
  /(haftmittelverbot|harzverbot|haftmittel\s+(?:ist\s+)?(?:absolut\s+)?verboten|harz\s+(?:ist\s+)?(?:absolut\s+)?verboten|kein(?:e)?\s+(?:haftmittel|harz)|untersagt)/i
const LIMITED =
  /(nur|ausnahme|außer|ausser|sonst|ausschließlich|ausschliesslich|befristet|gilt\s+nur|unter\s+der\s+voraussetzung|depots?|auf\s+verbandsebene|und\s+(?:höher|älter|aelter)|bis\s+zum|männer|maenner|frauen|jugend|aktive|senioren|mannschaften|herren|damen)/i

export function resinStatus(wax) {
  const text = String(wax ?? '').trim()
  if (!text) return null

  const hasPrefix = PREFIX.test(text)
  const body = text.replace(PREFIX, '').trim()
  if (!body) return null
  if (!hasPrefix && !RESIN_CONTEXT.test(body)) return null

  const allowed = ALLOWED.test(body)
  const forbidden = FORBIDDEN.test(body)
  const limited = LIMITED.test(body)

  if (allowed && forbidden) return 'limited'
  if (allowed) return limited ? 'limited' : 'allowed'
  if (forbidden) return limited ? 'limited' : 'forbidden'
  if (limited && RESIN_CONTEXT.test(body)) return 'limited'
  return null
}
