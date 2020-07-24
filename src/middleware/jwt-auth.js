const AuthService = require('../auth/auth-service')

async function requireAuth(req, res, next) {
	const authToken = req.get('Authorization') || ''
	const knexDB = req.app.get('db')
	let bearerToken

	if (!authToken.toLowerCase().startsWith('bearer ')) {
		return res
			.status(401)
			.json({ error: `Missing 'bearer' token` })
	} else {
		bearerToken = authToken.slice(7, authToken.length)
	}

	try {
		const payload = await AuthService.verifyJwt(bearerToken)
		const user = await AuthService.getUserWithUserName(
			knexDB,
			payload.sub
		)
		if (!user) {
			return res
				.status(401)
				.json({ error: `Unauthorized request` })
		} else {
			req.user = user
			return next()
		}
	} catch (error) {
		res.status(401).json({ error: `Unauthorized request` })
	}
}

module.exports = { requireAuth }
