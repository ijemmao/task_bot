import mongoose from 'mongoose'
const Schema = mongoose.Schema

const termSchema = new Schema({
  name: String,
  startDate: Date,
  endDate: Date,
})

const term = mongoose.model('Term', termSchema)
module.exports = term
