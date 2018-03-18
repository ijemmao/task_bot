/*
 * Takes a given header, makes it bold, all uppercase, and adds a
 * newline character at the ned of it.
 */
export const formatHeader = (key) => {
  return `\n*${key.toUpperCase()}*:\n`
}

/*
 * Format items in a dictionary into a bullet list format where each
 * line is tabbed.
 */
export const formatDicts = (dict) => {
  let result = ''

  for (const item in dict) {
    result += `\t• ${dict[item]}\n`
  }
  return result
}

/*
 * Formats items in a list into a bullet list format where each
 * line is tabbed.
 */
export const formatLists = (list) => {
  let result = ''
  list.forEach(item => {
    result += `• ${item}\n`
  })
  return result
}
