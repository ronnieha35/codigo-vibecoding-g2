import * as service from './user.service.js'

async function register(req, res, next) {
  try {
    const { name, lastname, email, password } = req.body

    if (!name || !lastname || !email || !password) {
      return res.status(400).json({ error: 'name, lastname, email and password are required' })
    }

    const user = await service.registerUser({ name, lastname, email, password })
    res.status(201).json(user)
  } catch (err) {
    next(err)
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' })
    }

    const result = await service.loginUser({ email, password })
    res.json(result)
  } catch (err) {
    next(err)
  }
}

export { register, login }
