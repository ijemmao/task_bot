import { formatLists } from './markdown'

/*
 * Confirmation message that will be sent out to
 * a channel to update meeting times
 */
const updateMeetingTimesMessage = {
  introMessage: '\nHey! I wanted to check in with the team to confirm your meeting times!\n',
  introCurrentDates: 'I currently have the following days and times:\n\n',
  dates: [],
  introCommands: '\nMake sure to *@me* to get my attention.\n\nHere is a list of commands that should be used:\n\n',
  commands: [
    '*update_date position dddd HH:mm* - i.e. @task_bot update_date 1 Wednesday 16:00 - Meetings are on Wednesdays at 4pm',
    '*add_date dddd HH:mm* - adds a new meeting date',
    '*remove_date position* - removes a meeting date',
    '*show* - shows the updated dates',
    '*abort* - ends confirmation and will be reminded tomorrow at 10AM',
    '*not_team* - only use this command if not a team this term!',
    '*complete* - completes confirmation',
  ],
}

/*
 * Works with the updateMeetingTimesMessage object
 * to populate the blank dates section. Grabs information
 * from database. Takes the Slack API channel object.
 */
export const getUpdateMeetingTimesMessage = (channel) => {
  let message = ''
  let meetingTimes = []
  return new Promise((resolve, reject) => {
    getChannel({ name: channel.name })
    .then(resChannel => {
      for (const section in updateMeetingTimesMessage) {
        if (section !== 'dates' && section !== 'commands') {
          message += updateMeetingTimesMessage[section]
        } else {
          message += formatLists(updateMeetingTimesMessage[section])
        }
      }
      resolve(message)
    })
  })
}
