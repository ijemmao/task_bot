import mongoose from 'mongoose'
const Schema = mongoose.Schema

const userSchema = new Schema({
  id: String,
  name: String,
  channels: [String],
})

const user = mongoose.model('User', userSchema)
module.exports = user
