import { formatLists } from './markdown'
import { getTeam } from './../db-actions/team-actions'

let teamsMeetingTimes = {}

/*
 * Confirmation message that will be sent out to
 * a channel to update meeting times
 */
const updateMeetingTimesMessage = {
  introMessage: '\nHey! Just wanted to check in with the team to confirm your meeting times!\n',
  introCurrentDates: 'I currently have the following days and times:\n\n',
  dates: [],
  introCommands: '\nMake sure to *@me* to get my attention.\n\nHere is a list of commands that should be used:\n\n',
  commands: [
    '*update_date position dddd HH:mm* - i.e. `@task_bot update_date 1 Wednesday 16:00` - Updated the first meeting time which is now Wednesdays at 4pm',
    '*add_date dddd HH:mm* - adds a new meeting date',
    '*remove_date position* - removes a meeting date',
    '*show* - shows the updated dates',
    '*abort* - ends confirmation and will be reminded tomorrow at 10AM',
    '*not_team* - only use this command if not a team this term!',
    '*complete* - completes confirmation',
  ],
}

// TODO: check to see if valid date is inputted
export const updateMeetingTime = (channelId, position, time) => {
  if (!teamsMeetingTimes[channelId]) {
    teamsMeetingTimes[channelId] = []
  }
  if (position < 0 || position > teamsMeetingTimes[channelId].length) {
    return false
  }
  teamsMeetingTimes[channelId][position - 1] = time
  return true
}

export const addMeetingTime = (channelId, time) => {
  if (!teamsMeetingTimes[channelId]) {
    teamsMeetingTimes[channelId] = []
  }
  teamsMeetingTimes[channelId].push(time)
  return true
}

export const removeMeetingTime = (channelId, position) => {
  if (!teamsMeetingTimes[channelId]) {
    return false
  }

  if (position < 0 || position > teamsMeetingTimes[channelId].length) {
    return false
  }

  teamsMeetingTimes[channelId].slice(0, position - 1).concat(teamsMeetingTimes[channelId].slice(position))
  return true
}

export const getMeetingTimes = () => {
  return teamsMeetingTimes
}

/*
 * Works with the updateMeetingTimesMessage object
 * to populate the blank dates section. Grabs information
 * from database. Takes the Slack API channel object.
 */
export const getUpdateMeetingTimesMessage = (channel) => {
  let message = ''
  return new Promise((resolve, reject) => {
    getTeam(channel.name)
    .then(resChannel => {
      for (const section in updateMeetingTimesMessage) {
        if (section !== 'dates' && section !== 'commands') {
          message += updateMeetingTimesMessage[section]
        } else {
          if (section === 'dates' && resChannel) {
            const formatedDates = resChannel.meetingTimes.map(time => {
              return time.format('dddd, HH:mm')
            })
            message += formatLists(formatedDates)
          }
          message += formatLists(updateMeetingTimesMessage[section])
        }
      }
      resolve(message)
    })
  })
}
