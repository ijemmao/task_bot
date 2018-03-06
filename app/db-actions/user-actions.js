import fetch from 'node-fetch'
import User from './../models/user'

export function createUser(data) {
  const userData = { id: data.id, name: data.name, firstName: data.profile.first_name, lastName: data.profile.last_name }
  const newUser = new User(userData)
  newUser.save((err, res) => {
    if (err) return err
  })
}

export function getDALIUsers() {
  console.log('grabbing all the users from the DALI-API')
  fetch('http://localhost:3000/api/users', {
    method: 'GET',
    headers: { Authorization: process.env.TASK_BOT_AUTH },
  })
  .then(res => res.text())
  .then(body => console.log(body))
}
