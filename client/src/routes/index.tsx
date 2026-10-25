import { createFileRoute, Link } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: HomePage,
})

function HomePage() {
  return (
    <section className="space-y-4">
      <h1 className="text-3xl font-bold">.NET + React</h1>
      <p>
        Edit <code className="rounded bg-gray-100 px-1 dark:bg-gray-800">client/src/routes/index.tsx</code>{' '}
        and save to see the page update.
      </p>
      <p>
        The{' '}
        <Link to="/weather" className="text-blue-600 underline dark:text-blue-400">
          Weather
        </Link>{' '}
        page loads data from the .NET API.
      </p>
    </section>
  )
}
