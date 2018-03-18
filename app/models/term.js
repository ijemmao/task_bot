import mongoose from 'mongoose'
const Schema = mongoose.Schema

const termSchema = new Schema({
  id: String,
  name: String,
  startDate: Date,
  endDate: Date,
})

const term = mongoose.model('Term', termSchema)
module.export = term
