const knex = require('knex')
const app = require('../src/app')
const helpers = require('./test-helpers')

describe('Protected endpoints', () => {
	let db

	const { testUsers } = helpers.makeThingsFixtures()

	before('make knex instance', () => {
		db = knex({
			client: 'pg',
			connection: process.env.TEST_DB_URL,
		})
		app.set('db', db)
	})

	after('disconnect from db', () => db.destroy())

	before('cleanup', () => helpers.cleanTables(db))

	afterEach('cleanup', () => helpers.cleanTables(db))

	// beforeEach('insert things', () => {
	// 	helpers.seedThingsTables(
	// 		db,
	// 		testUsers,
	// 		testThings,
	// 		testReviews
	// 	)
	// })

	const protectedEndpoints = [
		{
			name: `GET /api/things/:thing_id`,
			path: `/api/things/1`,
			method: supertest(app).get,
		},
		{
			name: `GET /api/things/:thing_id/reviews`,
			path: `/api/things/:thing_id/reviews`,
			method: supertest(app).get,
		},
	]
	protectedEndpoints.forEach((endpoint) => {
		describe(endpoint.name, () => {
			it('should respond 401 "missing basic token"', () => {
				return endpoint
					.method(endpoint.path)
					.expect(401, { error: `Missing basic token` })
			})

			it('should respond 401 "unauthorized resquest" when no credentials in token', () => {
				const userNoCreds = { user_name: '', password: '' }
				return endpoint
					.method(endpoint.path)
					.set(
						`Authorization`,
						helpers.makeAuthHeader(userNoCreds)
					)
					.expect(401, { error: `Unauthorized request` })
			})

			it('should respond 401 "Unauthorized request" when invalid user', () => {
				const userInvalid = {
					user_name: 'not-a-user',
					password: 'doesnotmatter',
				}
				return endpoint
					.method(endpoint.path)
					.set(
						`Authorization`,
						helpers.makeAuthHeader(userInvalid)
					)
					.expect(401)
			})
			it('should respond 401 "Unauthorized request" when invalid password', () => {
				const passInvalid = {
					user_name: testUsers[0].user_name,
					password: 'doesnotmatter',
				}
				return endpoint
					.method(endpoint.path)
					.set(
						`Authorization`,
						helpers.makeAuthHeader(passInvalid)
					)
					.expect(401, { error: `Unauthorized request` })
			})
		})
	})
})
