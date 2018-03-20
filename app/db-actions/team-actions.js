import Team from './../models/team'

/*
 * Creates a new Team model in the database.
 */
export function createTeam(data) {
  const teamData = { id: data.id, name: data.name, onTerm: data.onTerm }
  const newTeam = new Team(teamData)
  newTeam.save((err, res) => {
    if (err) return err
    console.log(`POST new team ${teamData.name}`)
  })
}

/*
 * Updates the specified Team's onTerm status.
 * The correct Team is found with the name property
 */
export function updateTeamOnTerm(data) {
  return new Promise((resolve, reject) => {
    Team.update(
      { name: data.name },
      { $set: { onTerm: data.onTerm } },
    )
    .exec((err, res) => {
      if (err) reject(err)
      resolve(`Successfully updated the team's onTerm status: ${data.onTerm}`)
    })
  })
}

/*
 * Update the specified Team's meetingTimes.
 * The correct Team is found with the name property
 */
export function updateTeamMeetingTimes(data) {
  return new Promise((resolve, reject) => {
    Team.update(
      { name: data.name },
      { $set: { meetingTimes: data.meetingTimes } },
    )
    .exec((err, res) => {
      if (err) reject(err)
      resolve(`Successfully updated the team's meetingTimes: ${data.meetingTimes}`)
    })
  })
}

/*
 * Gets a Team object from the database using
 * the Team's name property.
 */
export function getTeam(teamName) {
  return Team.findOne({ name: teamName })
}

/*
 * Gets all the Team objects currently existing
 * in the local database.
 */
export function getTeams() {
  return Team.find({})
}
