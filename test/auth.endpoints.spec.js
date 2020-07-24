const knex = require('knex')
const app = require('../src/app')
const jwt = require('jsonwebtoken')
const helpers = require('./test-helpers')
const supertest = require('supertest')

describe('Auth endpoints', () => {
	let db

	const { testUsers } = helpers.makeThingsFixtures()
	const testUser = testUsers[0]
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

	describe('POST api/auth/login', () => {
		beforeEach('insert users', () =>
			helpers.seedUsers(db, testUsers)
		)

		const requiredFields = ['user_name', 'password']

		requiredFields.forEach((field) => {
			const loginAttempt = {
				user_name: testUser.user_name,
				password: testUser.password,
			}
			it(`should respond 400 required error when "${field}" is missing`, () => {
				delete loginAttempt[field]
				return supertest(app)
					.post(`/api/auth/login`)
					.send(loginAttempt)
					.expect(400, {
						message: `Missing "${field}" in request body`,
					})
			})
		})
		it('should respond 400 "invalid username or password', () => {
			const invalidUser = {
				user_name: 'not-a-user',
				password: 'not-a-password',
			}
			return supertest(app)
				.post(`/api/auth/login`)
				.send(invalidUser)
				.expect(400, {
					message: `Incorrect username or password`,
				})
		})
		it('should respond 400 "invalid username or password" when user_name is invalid', () => {
			const invPasswordUser = {
				user_name: testUser.user_name,
				password: 'existy-nonsense',
			}
			return supertest(app)
				.post(`/api/auth/login`)
				.send(invPasswordUser)
				.expect(400, {
					message: `Incorrect username or password`,
				})
		})

		it('should respond 200 and JWT authToken secret when using valid credentials ', () => {
			const expectedToken = jwt.sign(
				{
					user_id: testUser.id,
				},
				process.env.JWT_SECRET,
				{
					subject: testUser.user_name,
					algorithm: 'HS256',
				}
			)
			const validUser = {
				user_name: testUser.user_name,
				password: testUser.password,
			}
			return supertest(app)
				.post(`/api/auth/login`)
				.send(validUser)
				.expect(200, { authToken: expectedToken })
		})
	})
})
