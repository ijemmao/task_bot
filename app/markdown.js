/*
*   markdown.js – markdown module for the DALI Task Bot
*   Author: Sofia Stanescu-Bellu 
*   The markdown module has functions for formatting the Slack bot's
*   messages in a specific markdown format.
*/

/*
* Takes a given header, makes it bold, all uppercase, and adds a
* newline character at the ned of it.
*/
const formatHeader = (key) => {
  return `\n*${key.toUpperCase()}*:\n`
}

/*
* Format items in a dictionary into a bullet list format where each
* line is tabbed.
*/
const formatLists = (dict) => {
  let result = ''

  for (const item in dict) {
    result += `\t• ${dict[item]}\n`
  }
  return result
}

export { formatHeader, formatLists }

