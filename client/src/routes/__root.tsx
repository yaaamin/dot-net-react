import type { QueryClient } from '@tanstack/react-query'
import { createRootRouteWithContext, Link, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'

type RouterContext = {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
  notFoundComponent: () => <p>Page not found.</p>,
})

const linkClass = 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100'
const activeLinkClass = 'font-semibold text-gray-900 dark:text-gray-100'

function RootLayout() {
  return (
    <>
      <nav className="flex gap-4 border-b border-gray-200 px-6 py-4 dark:border-gray-800">
        <Link
          to="/"
          className={linkClass}
          activeProps={{ className: activeLinkClass }}
          activeOptions={{ exact: true }}
        >
          Home
        </Link>
        <Link to="/weather" className={linkClass} activeProps={{ className: activeLinkClass }}>
          Weather
        </Link>
      </nav>
      <main className="mx-auto max-w-3xl p-6">
        <Outlet />
      </main>
      <TanStackRouterDevtools position="bottom-right" />
    </>
  )
}
