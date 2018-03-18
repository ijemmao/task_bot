import mongoose from 'mongoose'
const Schema = mongoose.Schema

const channelSchema = new Schema({
  id: String,
  name: String,
  members: [String],
})

const channel = mongoose.model('Channel', channelSchema)
module.exports = channel
