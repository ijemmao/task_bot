import * db from './../db'
import { slackbotRTM } from './../server'
import { createTeam } from './../db-actions/team-actions'
/*
 * Populates the database with channels that task bot is
 * currently in.
 */

const bot = slackbotRTM

bot.api.channels.list({}, (err, res) => {
  const memberChannels = res.channels.filter(item => item.is_member)
  memberChannels.forEach(channel => {
    const teamObject = { id: channel.id, name: channel.name, onTerm: true }
    createTeam(teamObject)
  })
})
