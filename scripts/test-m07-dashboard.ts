const baseUrl = process.argv[2] || process.env.BASE_URL || 'http://localhost:3001'
const username = process.argv[3] || process.env.TEST_USERNAME || 'engineer1'
const password = process.argv[4] || process.env.TEST_PASSWORD || '123456'

async function run() {
  console.log(`Testing auth/login and m07/dashboard against ${baseUrl}`)

  const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })

  const loginData = await loginRes.json()
  if (!loginRes.ok || loginData.code !== 200) {
    console.error('Login failed:', loginData)
    process.exit(1)
  }

  const token = loginData.data?.token
  const user = loginData.data?.user
  if (!token) {
    console.error('Login succeeded but token missing', loginData)
    process.exit(1)
  }

  console.log('Login success for', user?.username || username, 'role=', user?.role)
  console.log('Token:', token)

  const dashboardRes = await fetch(`${baseUrl}/api/m07/dashboard`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  const dashboardData = await dashboardRes.json()

  console.log('Dashboard status:', dashboardRes.status)
  console.log(JSON.stringify(dashboardData, null, 2))

  if (!dashboardRes.ok) {
    process.exit(1)
  }
}

run().catch((error) => {
  console.error('Test script error:', error)
  process.exit(1)
})
