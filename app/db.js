import mongoose from 'mongoose'

const database = 'mongodb://127.0.0.1/task_bot'
mongoose.connect(database, (err, res) => {
  if (err) {
    console.log('There was an error connecting the database')
  } else {
    console.log('Connected to the database!')
  }
})
module.exports = mongoose.connection
