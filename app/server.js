import botkit from 'botkit'
import schedule from 'node-schedule'
import moment from 'moment'
import { createUser, getDALIUsers } from './db-actions/user-actions'
import { pokeChannels, getPokeChannels } from './data-actions/channel-productivity'
import { checkOnTerm, getTermStartDate, daysBeforeStart, getConfirmDatesMessage } from './data-actions/term-dates'
import { getMilestone } from './data-actions/milestones'

let currentWeek = 0
let currentTerm = null
let onTerm = false
let confirmedDate = false
let updatingDates = false

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

// ----------------- send confirmation updates ---------------- //

/*
 * Starts conversation with admin user to update the start dates
 */
controller.on('send_term_start_confirmation', (bot) => {
  bot.api.users.list({}, (err, res) => {
    let adminUser = null
    res.members.forEach(user => {
      if (user.real_name === 'Ijemma Onwuzulike') {
        adminUser = user
      }
    })
    bot.api.im.open({ user: adminUser.id }, (err1, res1) => {
      const directChannelId = res1.channel.id
      updatingDates = true
      bot.say({ channel: directChannelId, text: getConfirmDatesMessage() }, () => {})
    })
  })
})

// --------------- confirming start dates ----------------- //

controller.hears('update_start', ['direct_message'], (bot, message) => {
  if (updatingDates) {
    const newStartDate = moment(message.text.split(' ')[1], 'MM-DD-YYYY')
  }
})

controller.hears('update_end', ['direct_message'], (bot, message) => {
  if (updatingDates) {
    const newEndDate = moment(message.text.split(' ')[1], 'MM-DD-YYYY')
  }
})

controller.hears('show', ['direct_message'], (bot, message) => {
  if (updatingDates) {
    // Show the currently updated dates
  }
})

controller.hears('abort', ['direct_message'], (bot, message) => {
  if (updatingDates) {
    bot.reply(message, 'Alright, I will check back in with you tomorrow at 10AM')
    // Create schedule
  }
})

controller.hears('complete', ['direct_message'], (bot, message) => {
  if (updatingDates) {
    bot.reply(message, 'Sweet! Thanks for updating the dates!')
  }
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
      currentWeek = moment().diff(getTermStartDate(currentTerm), 'weeks')
      if (onTerm) controller.trigger('send_milestones', [bot, currentWeek])
    }
    // reset the week counter
    if (currentWeek === 10) currentWeek = 0
  })
})

// Checks daily at 12AM to see if term start/end dates are correct
const updateTermInfo = schedule.scheduleJob({ hour: 0, minute: 0, second: 0 }, () => {
  console.log('Updating the expected term bounds are correct')

  // We are not in a term and we haven't confirmed correct term start/end dates
  /*
   * TODO: Check with admin to make sure that currently assigned
   * start/end dates are correct
   */
  const termResults = checkOnTerm()
  currentTerm = termResults.term
  onTerm = termResults.onTerm
})

slackbot.startRTM((err, bot) => {
  if (err) throw new Error(err)

  console.log('Sending confirmation message to user')
  controller.trigger('send_term_start_confirmation', [bot])
})

// Checks daily at 10AM to see whether the bot should update the start dates for the term
const updateTermStart = schedule.scheduleJob({ hour: 10, minute: 0, second: 0 }, () => {
  console.log('Updating the term start date')

  if (daysBeforeStart < 4 && !confirmedDate) {
    // Start conversation with user to update term dates
    // slackbot.startRTM((err, bot) => {
    //   if (err) throw new Error(err)

    //   console.log('Sending confirmation message to user')
    //   controller.trigger('send_term_start_confirmation', [bot])
    // })
  }
})
