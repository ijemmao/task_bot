import botkit from 'botkit'
import schedule from 'node-schedule'
import moment from 'moment'
import { createUser, getDALIUsers } from './db-actions/user-actions'
import { pokeChannels, getPokeChannels } from './data-actions/channel-productivity'
import { checkChannelActivity } from './data-actions/automate-tasks'
import { getMilestone } from './data-actions/milestones'

let currentWeek = 0
let onTerm = false

const shiftToWednesday = (termStartDate) => {
  while (termStartDate.format('dddd') !== 'Wednesday') {
    termStartDate.add(1, 'days')
  }
  return termStartDate
}

// winter
const firstWeekWinter = moment().week(1)
let firstDayWinter = firstWeekWinter.add(3 - firstWeekWinter.get('date'), 'days')
const lastWeekWinter = moment().week(10)
while (firstDayWinter.format('dddd') !== 'Monday' && firstDayWinter.format('dddd') !== 'Wednesday') {
  firstDayWinter.add(1, 'days')
}
firstDayWinter = shiftToWednesday(firstDayWinter)
console.log(firstDayWinter)
// console.log(lastWeekWinter)

// spring
const firstWeekSpring = moment().week(12)
let firstDaySpring = firstWeekSpring
while (firstDaySpring.format('dddd') !== 'Monday') {
  firstDaySpring.add(1, 'days')
}
firstDaySpring = shiftToWednesday(firstDaySpring)
console.log(firstDaySpring)
// console.log(moment().week(22))

// summer
const firstWeekSummer = moment().week(24)
let firstDaySummer = firstWeekSummer
while (firstDaySummer.format('dddd') !== 'Thursday') {
  firstDaySummer.add(1, 'days')
}
firstDaySummer = shiftToWednesday(firstDaySummer)
console.log(firstDaySummer)
// console.log(moment().week(34))

// fall
const firstWeekFall = moment().week(36)
let firstDayFall = firstWeekFall
while ((firstDayFall.format('dddd') !== 'Monday' && firstDayFall.format('dddd') !== 'Wednesday') || firstDayFall.get('date') < 11) {
  firstDayFall.add(1, 'days')
}
firstDayFall = shiftToWednesday(firstDayFall)
console.log(firstDayFall)
// console.log(moment().week(46))
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
    controller.trigger('poke_channels_activity', [bot])
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
      controller.trigger('send_milestones', [bot, currentWeek])
    }
    // reset the week counter
    if (currentWeek === 10) currentWeek = 0
  })
})
