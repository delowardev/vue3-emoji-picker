/**
 * Change snake case to capitalised words, e.g. my_custom_group to My Custom Group.
 */
export function snakeToCapitalizedCase(string: string): string {
  return string.replace(/^_*(.)|_+(.)/g, (_s, c, d) =>
    c ? c.toUpperCase() : ' ' + d.toUpperCase()
  )
}
