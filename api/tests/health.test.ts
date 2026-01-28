import { describe, expect, it } from 'vitest'
import request from 'supertest'
import app from '../app.js'

describe('health', () => {
  it('returns ok', async () => {
    const res = await request(app).get('/api/health')
    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({ ok: true, status: 'ok' })
  })
})

