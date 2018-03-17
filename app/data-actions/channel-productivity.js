import moment from 'moment'
/*
 * Returns a productivity score for each provided channel
 * Current favors channels that have response times below
 * a day
 */

const productivityScore = (channelInfo) => {
  const dayInSeconds = 86400
  const numMessages = channelInfo.messages.length
  let responseScore = 0
  if (numMessages > 8) {
    channelInfo.messages.forEach((message, index) => {
      if (index > 0) {
        const messageTimeDifference = channelInfo.messages[index] - channelInfo.messages[index - 1]
        if (messageTimeDifference <= dayInSeconds) {
          responseScore += 3
        } else {
          responseScore -= 1
        }
      }
    })
  } else {
    responseScore = -100000
  }
  return numMessages + responseScore
}

/*
 * Sorts channels based on assigned productivity score
 * Transforms original channels list to hold associated score
 */
const sortProductiveChannels = (channels) => {
  const scoredChannels = channels.map(channel => {
    return { channel, score: productivityScore(channel) }
  })
  scoredChannels.sort((a, b) => {
    return productivityScore(b.channel) - productivityScore(a.channel)
  })
  return scoredChannels
}

/*
 * Generates a unique message for each channel
 * that will get poked
 */
const generateChannelMessage = (res) => {
  let message = ''
  message += `Hey <!channel>!\n`
  message += 'After analyzing Slack activity in the lab, I noticed that your channel has slightly lower activity marks\n'
  message += 'No worries, there are a number of ways to make sure that your channel is active:\n\n'
  message += '\t• Ask questions about development or design\n'
  message += '\t• Drop images of code or design for some quick feedback\n'
  message += '\t• Provide small updates about general work\n'
  message += '\t• Share some spicy memes, it never hurts!\n'
  return message
}

/*
 * Based on given threshold, returns a list of channels
 * that need a poke to drive up productivity
 */
export const getPokeChannels = (channels, threshold) => {
  const scoredChannels = sortProductiveChannels(channels)
  const firstChannel = scoredChannels[0]
  const pokeChannelsRaw = scoredChannels.filter(channel => channel.score < (firstChannel.score * threshold).toFixed(2))
  const pokeChannels = pokeChannelsRaw.map(channel => channel.channel.id)
  return pokeChannels
}

export const pokeChannels = (bot, channels) => {
  channels.forEach(id => {
    bot.api.channels.info({ channel: id }, (err, res) => {
      if (err) return err

      const message = generateChannelMessage()
      bot.api.chat.postMessage({ channel: id, text: message }, (err, res) => {})
    })
  })
}
