import axios from 'axios'

// Shared axios instance. All requests go to /api, which Vite proxies to .NET
// in development and which .NET serves directly in production.
export const http = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})
