import mongoose from 'mongoose'
const Schema = mongoose.Schema

const teamSchema = new Schema({
  id: String,
  name: String,
  meetingTimes: [Date],
  projectManager: String,
  developers: [String],
  designers: [String],
})

const team = mongoose.model('Team', teamSchema)
module.export = team
