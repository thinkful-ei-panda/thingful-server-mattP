const bcrypt = require('bcryptjs')
const AuthService = require('../auth/auth-service')

const requireAuth = async (req, res, next) => {
	try {
		const authToken = req.get('Authorization') || ''

		let basicToken

		if (!authToken.toLowerCase().startsWith('basic')) {
			return res
				.status(401)
				.json({ error: `Missing basic token` })
		} else {
			basicToken = authToken.slice(
				'basic '.length,
				authToken.length
			)
		}

		const [
			tokenUsername,
			tokenPassword,
		] = AuthService.parseBasicToken(basicToken)

		if (!tokenUsername || !tokenPassword) {
			return res
				.status(401)
				.json({ error: `Unauthorized request` })
		}

		const user = await AuthService.getUserWithUserName(
			req.app.get('db'),
			tokenUsername
		)

		if (!user) {
			return res
				.status(401)
				.json({ error: `Unauthorized request` })
		}
		const passwordMatch = await bcrypt.compare(
			tokenPassword,
			user.password
		)

		if (!passwordMatch) {
			return res
				.status(401)
				.json({ error: `Unauthorized request` })
		}
		req.user = user
		return next()
	} catch (error) {
		next(error)
	}
}

module.exports = { requireAuth }
