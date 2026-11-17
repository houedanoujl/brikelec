export default defineEventHandler(async (event) => {
  const { limit = 20 } = getQuery(event)
  const n = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100)
  return await topScores(n)
})
