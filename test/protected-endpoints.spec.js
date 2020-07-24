const knex = require('knex')
const app = require('../src/app')
const helpers = require('./test-helpers')

describe('Protected endpoints', () => {
	let db

	const {
		testUsers,
		testThings,
		testReviews,
	} = helpers.makeThingsFixtures()

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

	beforeEach('insert articles', () =>
		helpers.seedThingsTables(
			db,
			testUsers,
			testThings,
			testReviews
		)
	)

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
			it(`should respond 401 "Missing 'bearer' token"`, () => {
				return endpoint
					.method(endpoint.path)
					.expect(401, { error: `Missing 'bearer' token` })
			})

			it(`should respond 401 "Missing 'bearer' token" when invalid JWT token is given`, () => {
				const validUser = testUsers[0]
				const invalidSecret = 'inv-secret'
				return endpoint
					.method(endpoint.path)
					.set(
						`Authorization`,
						helpers.makeAuthHeader(
							validUser,
							invalidSecret
						)
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
		})
	})
})
