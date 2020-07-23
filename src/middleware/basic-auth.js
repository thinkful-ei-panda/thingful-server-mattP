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

		const [tokenUsername, tokenPassword] = Buffer.from(
			basicToken,
			'base64'
		)
			.toString()
			.split(':')

		if (!tokenUsername || !tokenPassword) {
			return res
				.status(401)
				.json({ error: `Unauthorized request` })
		}

		const user = await req.app
			.get('db')('thingful_users')
			.where({ user_name: tokenUsername })
			.first()

		if (!user || user.password !== tokenPassword) {
			return res
				.status(401)
				.json({ error: `Unauthorized request` })
		}
		req.user = user
		next()
	} catch (error) {
		next(error)
	}
}

module.exports = { requireAuth }
