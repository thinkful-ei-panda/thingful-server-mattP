const express = require('express')
const AuthService = require('./auth-service')

const authRouter = express.Router()
const jsonParser = express.json()

authRouter.post('/login', jsonParser, async (req, res, next) => {
	const { user_name, password } = req.body
	const loginUser = {
		user_name,
		password,
	}

	for (const [key, value] of Object.entries(loginUser))
		if (value == null || value === undefined) {
			return res.status(400).json({
				message: `Missing "${key}" in request body`,
			})
		}
	const knexDB = req.app.get('db')
	const user = await AuthService.getUserWithUserName(
		knexDB,
		loginUser.user_name
	)
	try {
		if (!user) {
			return res
				.status(400)
				.json({ message: `Incorrect username or password` })
		} else {
			const compareMatch = await AuthService.comparePasswords(
				loginUser.password,
				user.password
			)

			if (!compareMatch) {
				return res.status(400).json({
					message: `Incorrect username or password`,
				})
			}

			const sub = user.user_name
			const payload = { user_id: user.id }
			return res.send({
				authToken: AuthService.createJwt(sub, payload),
			})
		}
	} catch (error) {
		next(error)
	}
})

module.exports = authRouter
