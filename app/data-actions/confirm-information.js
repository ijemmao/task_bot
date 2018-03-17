export let confirmChannels = {
  introMessage: 'Heyyo! The term is coming up soon. I wanted to update my list of channels to follow\n',
  channelsListHeader: 'Currently, I keep track of the following channels',
  channels: [],
  commandsHeader: 'Please update the list by using the following commands:\n',
  commands: [
    { use: 'add #channel-name', description: 'Adds a channel to the list' },
    { use: 'remove #channel-name', description: 'Removes a channel from the list' },
    { use: 'show', description: 'Show the current list of tracked channels' },
    { use: 'abort', description: 'Ends conformation but will be resumed tomorrow at same time' },
    { use: 'complete', description: 'Confirms the list of channels to track' },
  ],
}

/*
 * Populates the confirmChannels channels list with channels
 * that are currently being tracked by the bot
 */
export const populateChannels = (bot) => {
  return new Promise((resolve, reject) => {
    bot.api.channels.list({}, (err, res) => {
      if (err) reject(err)
      const currentChannels = new Set(confirmChannels.channels)
      const trackChannels = []
      const memberChannels = res.channels.filter(item => item.is_member)
      memberChannels.forEach(channel => {
        if (!currentChannels.has(`#${channel.name}`)) {
          trackChannels.push(`#${channel.name}`)
        }
      })
      confirmChannels.channels = trackChannels
      resolve(trackChannels)
    })
  })
}

/*
 * Adds a channel to the local confirmChannels object
 * Doesn't make the task bot join yet
 */
export const addChannel = (bot, channelName) => {
  const currentChannels = new Set(confirmChannels.channels)
  return new Promise((resolve, reject) => {
    bot.api.channels.info({ channel: channelName[0] }, (err, res) => {
      if (err) reject(err)
      if (!currentChannels.has(channelName)) {
        currentChannels.add(channelName)
        confirmChannels.channels = [...currentChannels]
        // resolve(`Added #${channelName[1]}`)
        resolve(`Added <#${channelName[0]}|${channelName[1]}>`)
      }
    })
  })
  .catch(e => {
    return `There seems to be an error: ${e}`
  })
}

/*
 * Removes a channel from the local confirmChannels object
 * Doesn't make the task bot leave yet
 */
export const removeChannel = (channelName) => {
  const currentChannels = new Set(confirmChannels.channels)
  currentChannels.delete(channelName)
  return confirmChannels.channels
}
