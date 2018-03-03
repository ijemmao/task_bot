import User from './../models/user'

export function createUser(data) {
  const userData = { id: data.id, name: data.name, firstName: data.profile.first_name, lastName: data.profile.last_name }
  const newUser = new User(userData)
  newUser.save((err, res) => {
    if (err) return err
  })
}
