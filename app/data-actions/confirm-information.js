import { formatDicts } from './markdown'

export let confirmChannels = {
  introMessage: 'Heyyo! The term is coming up soon.\nI wanted to update my list of channels to follow\n',
  channelsListHeader: 'Currently, I keep track of the following channels:\n\n',
  channels: [],
  commandsHeader: 'Please update the list by using the following commands:\n',
  commands: {
    add: '*add &lt;#channel-name&gt;* - Adds a channel to the list',
    remove: '*remove &lt;#channel-name&gt;* - Removes a channel from the list',
    show: '*show* - Show the current list of tracked channels',
    abort: '*abort* - Ends conformation but will be resumed tomorrow at same time',
    complete: '*complete* - Confirms the list of channels to track',
  },
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
        if (!currentChannels.has(`<#${channel.id}|${channel.name}>`)) {
          trackChannels.push(`<#${channel.id}|${channel.name}>`)
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
        currentChannels.add(`<#${channelName[0]}|${channelName[1]}>`)
        confirmChannels.channels = [...currentChannels]
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
export const removeChannel = (bot, channelName) => {
  const currentChannels = new Set(confirmChannels.channels)
  return new Promise((resolve, reject) => {
    bot.api.channels.info({ channel: channelName[0] }, (err, res) => {
      if (err) reject(err)
      currentChannels.delete(`<#${channelName[0]}|${channelName[1]}>`)
      // currentChannels.delete(channelName)
      resolve(`Removed <#${channelName[0]}|${channelName[1]}>`)
    })
  })
  .catch(e => {
    return `There seems to be an error: ${e}`
  })
}

export const getMessage = () => {
  let channelMessage = ''
  for (const section in confirmChannels) {
    if (section !== 'channels' && section !== 'commands') {
      channelMessage += confirmChannels[section]
    } else {
      channelMessage += formatDicts(confirmChannels[section])
    }
  }
  return channelMessage
}
