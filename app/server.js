import botkit from 'botkit'
import schedule from 'node-schedule'
import data from '../mock_data/milestones'
import moment from 'moment'
import * as markdown from './markdown.js'
import * as db from './db'
import { createUser, getDALIUsers } from './db-actions/user-actions'
import { pokeChannels, getPokeChannels } from './data-actions/channel-productivity'
import { checkChannelActivity } from './data-actions/automate-tasks'

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

// ------------------ channel information ----------------- //
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

// ---------------------- add users ----------------------- //

/*
 * Adds all users into the database
 */
controller.hears('add_all_users', ['direct_message'], (bot, message) => {
  bot.api.users.list({}, (err, res) => {
    if (err) return err
    res.members.forEach(member => {
      // only takes users that have a first and last name
      if (member.profile.first_name && member.profile.last_name) {
        createUser(member)
      }
    })
  })
})


/*
 * Grabs all users from DALI-API
 */
controller.hears('get_dali_users', ['direct_message'], (bot, message) => {
  getDALIUsers()
  .then(res => { return res.json() })
  .then(json => {
    bot.reply(message, 'Grabbed all users from DALI-API')
  })
})

/*
 * Adds a specified user
 */
controller.hears('add_user', ['direct_message'], (bot, message) => {
  const newUser = message.text.split(/[ <>@]/).filter(item => item.length > 0)[1]
  bot.api.users.info({ user: newUser }, (err, res) => {
    createUser(res.user)
    console.log('success')
  })
})

// ------------------- automated tasks ------------------- //

// Slacks out channel productivity every Saturday at 10AM
const channelActivityReminder = schedule.scheduleJob({ hour: 19, minute: 16, second: 15, dayOfWeek: 5 }, () => {
  console.log('Reminding all channels that there are milestones to complete')

  slackbot.startRTM((err, bot) => {
    if (err) throw new Error(err)

    console.log('Poking channels that need better activity')

    controller.trigger('poke_channels_activity', [bot])
  })
})
