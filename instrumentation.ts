export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Server-side instrumentation
    await import('./src/lib/monitoring/server')
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    // Edge runtime instrumentation
    await import('./src/lib/monitoring/edge')
  }
}