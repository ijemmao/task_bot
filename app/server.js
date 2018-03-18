import botkit from 'botkit'
import schedule from 'node-schedule'
import moment from 'moment'
import { formatLists } from './data-actions/markdown'
import { pokeChannels, getPokeChannels } from './data-actions/channel-productivity'
import { getMilestone, checkOnTerm, daysBeforeStart } from './data-actions/milestones'
import { confirmChannels, addChannel, removeChannel, getMessage, populateChannels } from './data-actions/confirm-information'

let currentWeek = 0
let onTerm = false
let updatingChannels = false

// botkit controller
const controller = botkit.slackbot({
  debug: false,
})

// initialize slackbot
const slackbot = controller.spawn({
  token: process.env.TASK_BOT_TOKEN,
  // this grabs the slack token we exported earlier
})

console.log('Task Bot is up and running!')

// prepare webhook
controller.setupWebserver(process.env.PORT || 3001, (err, webserver) => {
  const slackbotRTM = slackbot.startRTM(err => {
    // start the real time message client
    if (err) throw new Error(err)
  })
  controller.createWebhookEndpoints(webserver, slackbotRTM, () => {
    if (err) {
      throw new Error(err)
    }
  })
})

// ------------------ send informational blurbs ----------------- //
/*
 * Listens for command that will provide channel activity in the past week
 * With provided data, this function will decide whether or not this channel
 * is active
 */
controller.on('poke_channels_activity', (bot) => {

  // Unix timestamp of last week
  const lastWeekUnix = moment().subtract(1, 'weeks').endOf('isoWeek').unix()

  bot.api.channels.list({}, (err, res) => {
    if (err) return err
    console.log(res)
    const memberChannels = res.channels.filter(item => item.is_member)

    let channelMessages = {}

    const tasks = memberChannels.map(channel => {
      return new Promise((resolve, reject) => {
        bot.api.channels.history({ channel: channel.id, oldest: lastWeekUnix }, (err1, res1) => {
          if (err1) reject(err1)
          resolve({ id: channel.id, messages: res1.messages })
        })
      })
      .catch(e => {
        console.log(e)
      })
    })

    Promise.all(tasks).then(values => {
      channelMessages = values
      const channelsToPoke = getPokeChannels(values, 0.3)
      pokeChannels(bot, channelsToPoke)
    })
  })
})

/*
 * Listens for command that will send out milestone to each channel
 * that is being tracked by the task bot
 */
controller.on('send_milestones', (bot, week) => {
  bot.api.channels.list({}, (err, res) => {
    if (err) return err
    const memberChannels = res.channels.filter(item => item.is_member)

    memberChannels.forEach(channel => {
      const currentMilestone = getMilestone(week)
      bot.api.postMessage({ channel: channel.id, text: currentMilestone }, (err, res) => {})
    })
  })
})

// ------------------ updates channels ------------------- //

controller.hears('add', ['direct_message'], (bot, message) => {
  if (updatingChannels) {
    const channelName = message.text.split(' ')[1]
    const channelReferences = channelName.split(/[<|#>]/).filter(item => item.length > 0)

    addChannel(bot, channelReferences)
    .then(response => {
      bot.reply(message, response)
    })
  }
})

controller.hears('remove', ['direct_message'], (bot, message) => {
  if (updatingChannels) {
    const channelName = message.text.split(' ')[1]
    const channelReferences = channelName.split(/[<|#>]/).filter(item => item.length > 0)

    removeChannel(bot, channelReferences)
    .then(response => {
      bot.reply(message, response)
    })
  }
})

controller.hears('show', ['direct_message'], (bot, message) => {
  if (updatingChannels) {
    bot.reply(message, formatLists(confirmChannels.channels))
  }
})

controller.hears('abort', ['direct_message'], (bot, message) => {
  updatingChannels = false
  // Set a reminder to confirm channels at a later date
})

controller.hears('complete', ['direct_message'], (bot, message) => {
  updatingChannels = false
  bot.reply(message, 'Sweet, thanks for updating the channels list\nIf you want to update the channels list later, just use the command `update_channels`')
})

controller.hears('update_channels', ['direct_message'], (bot, message) => {
  updatingChannels = true
  bot.reply(message, 'Alright, let\'s update this channel list!')
})


// ------------------- automated tasks ------------------- //

// Slacks out channel productivity every Saturday at 10AM
const channelActivityReminder = schedule.scheduleJob({ hour: 10, minute: 0, second: 0, dayOfWeek: 6 }, () => {
  console.log('Reminding all channels that there are milestones to complete')

  slackbot.startRTM((err, bot) => {
    if (err) throw new Error(err)

    console.log('Poking channels that need better activity')
    if (onTerm) controller.trigger('poke_channels_activity', [bot])
  })
})

// Slacks out channels current milestones every Tuesday at 10AM
const milestoneReminder = schedule.scheduleJob({ hour: 10, minute: 0, second: 0, dayOfWeek: 2 }, () => {
  console.log('Sending out milestone reminder')
  slackbot.startRTM((err, bot) => {
    if (err) throw new Error(err)

    console.log('Sending milestones if currently on a term')
    if (onTerm) {
      currentWeek += 1
      if (onTerm) controller.trigger('send_milestones', [bot, currentWeek])
    }
    // reset the week counter
    if (currentWeek === 10) currentWeek = 0
  })
})

// Checks daily at 12AM to see if term start/end dates are correct
const updateTermBounds = schedule.scheduleJob({ hour: 0, minute: 0, second: 0 }, () => {
  console.log('Updating the expected term bounds are correct')

  // We are not in a term and we haven't confirmed correct term start/end dates
  onTerm = checkOnTerm()
})

// Grabs users that have already spoken to the task bot
slackbot.startRTM((err, bot) => {
  if (err) throw new Error(err)

  bot.api.im.list({}, (error, res) => {
    const imChannels = res.ims
    const userPromises = imChannels.map(im => {
      return new Promise((resolve, reject) => {
        bot.api.users.info({ user: im.user }, (err1, res1) => {
          if (err1) reject(err1)
          resolve({ user: res1.user, im })
        })
      })
      .catch(e => {
        console.log(e)
      })
    })
    Promise.all(userPromises).then(values => {
      const adminUsers = values.filter(item => {
        return item.user.real_name === 'Ijemma Onwuzulike'
      })
      return adminUsers
    })
    .then(adminUsers => {
      populateChannels(bot)
      .then(trackedChannels => {
        bot.say({ channel: 'D9G8BAN8L', text: getMessage() }, (err2, res2) => {
          if (err2) return err2
          updatingChannels = true
        })
      })
    })
  })
})

// const updateChannelsList = schedule.scheduleJob({ hour: 10, minute: 0, second: 0 }, () => {
//   if (!onTerm && daysBeforeStart() < 4) {
//     /*
//      * Send out to the following conversational body:
//      * - Update the Channels List
//      * - Confirm the start date of the term or first Wednesday
//      * meeting
//      * - Etc.
//      */
//     slackbot.startRTM((err, bot) => {
//       if (err) throw new Error(err)

//       bot.api.conversation.create({ name: 'Ijemma Onwuzulike', is_private: true }, (err, res) => {
//         console.log('starting conversation')
//       })
//     })
//   }
// })
