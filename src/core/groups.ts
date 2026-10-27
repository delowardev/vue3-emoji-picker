import type { EmojiOptions } from './types'
import { GROUP_NAMES } from './constants'
import { defaultGroups } from './dataset'
import { snakeToCapitalizedCase } from './names'

export function disabledGroupsOf(options: EmojiOptions): string[] {
  const disabled = Array.isArray(options.disabledGroups)
    ? [...options.disabledGroups]
    : []

  if (!options.displayRecent) disabled.push('recent')

  return disabled
}

export function resolveGroupNames(
  options: EmojiOptions
): Record<string, string> {
  const names: Record<string, string> = {
    ...GROUP_NAMES,
    ...(options.groupNames || {}),
  }
  const additional = options.additionalGroups

  if (additional && typeof additional === 'object') {
    for (const key of Object.keys(additional)) {
      if (!names[key]) names[key] = snakeToCapitalizedCase(key)
    }
  }

  return names
}

export function resolveOrderedGroupKeys(
  options: EmojiOptions,
  disabled: string[] = disabledGroupsOf(options)
): string[] {
  const keys = [
    ...(Array.isArray(options.groupOrder) ? options.groupOrder : []),
    ...Object.keys(options.additionalGroups || {}),
    ...defaultGroups.map((group) => group.key),
  ]

  return [...new Set(keys)].filter((key) => !disabled.includes(key))
}

export function resolveGroups(
  options: EmojiOptions,
  disabled: string[] = disabledGroupsOf(options)
): Array<{ key: string; title: string; u: string }> {
  const names = resolveGroupNames(options)

  const base = defaultGroups
    .filter((group) => !disabled.includes(group.key))
    .map((group) => ({
      key: group.key as string,
      title: names[group.key] || group.title,
      u: group.u,
    }))

  const extra = Object.keys(options.additionalGroups || {})
    .filter((key) => !disabled.includes(key))
    .map((key) => ({
      key,
      title: names[key] || snakeToCapitalizedCase(key),
      u: '',
    }))

  return [...base, ...extra]
}
