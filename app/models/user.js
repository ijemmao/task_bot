import mongoose from 'mongoose'
const Schema = mongoose.Schema

const userSchema = new Schema({
  id: String,
  onTerm: Boolean,
  name: String,
  channels: [String],
  username: String,
  firstName: String,
  lastName: String,
})

const user = mongoose.model('User', userSchema)
module.exports = user
