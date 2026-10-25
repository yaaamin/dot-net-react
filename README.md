# .NET + React Template

A starter template for building a web app with an **ASP.NET Core** backend (C#) and a **React** frontend (TypeScript), set up so you can start writing features right away.

| Part     | What it uses                                                                 |
| -------- | ---------------------------------------------------------------------------- |
| Backend  | [.NET 10](https://dotnet.microsoft.com/) Minimal API                          |
| Frontend | [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) + [Vite](https://vite.dev/) |
| Routing  | [TanStack Router](https://tanstack.com/router) (file-based, type-safe)       |
| Styling  | [Tailwind CSS v4](https://tailwindcss.com/)                          |
| Data     | [TanStack Query](https://tanstack.com/query) + [axios](https://axios-http.com/) |
| Tooling  | [Bun](https://bun.sh/) (package manager and script runner), [oxlint](https://oxc.rs/) |

---

## 1. Install the tools

You need these installed once on your computer:

1. **.NET SDK 10**: download it from <https://dotnet.microsoft.com/download>
2. **Bun**: follow <https://bun.sh/docs/installation>, or on macOS/Linux run:
   ```bash
   curl -fsSL https://bun.sh/install | bash
   ```

Check that they work by opening a terminal and running:

```bash
dotnet --version   # should print 10.x.x
bun --version      # should print 1.x.x
```

> **Editor tip:** [VS Code](https://code.visualstudio.com/) with the **C# Dev Kit** extension works well for both halves of this project.

---

## 2. Create your project from this template

On GitHub, click **Use this template → Create a new repository**, then clone your new repository:

```bash
git clone https://github.com/<your-name>/<your-repo>.git
cd <your-repo>
```

(Or just copy this folder somewhere and open it in your editor.)

Install all the dependencies:

```bash
bun run setup
```

This runs `bun install` in `client/` and `dotnet restore` in `server/`.

---

## 3. Run the app

```bash
bun run dev
```

This starts **two** programs at once:

| Name  | URL                        | What it is                       |
| ----- | -------------------------- | -------------------------------- |
| `web` | <http://localhost:5173>    | The React app. **Open this one.** |
| `api` | <http://localhost:5171>    | The .NET API                     |

Open <http://localhost:5173> in your browser. Click **Weather**: that page loads its data from the .NET API.

Both sides reload automatically when you save a file. Press `Ctrl + C` in the terminal to stop.

> Prefer two terminals? Run `bun run dev:api` in one and `bun run dev:web` in the other.

### How the two halves talk to each other

```
Browser ──► http://localhost:5173  (Vite / React)
              │
              │  any request starting with /api is forwarded (proxied)
              ▼
            http://localhost:5171  (.NET)
```

The React code always calls URLs like `/api/weatherforecast`. In development, Vite forwards those to .NET (see `server.proxy` in [client/vite.config.ts](client/vite.config.ts)). In production, .NET serves both the API and the React files from one address, so the same URLs keep working and you don't have to configure CORS.

---

## 4. Project structure

```
.
├── package.json            ← root scripts (dev, build, start, setup)
├── DotNetReact.slnx        ← .NET solution file (open it in Visual Studio / Rider)
│
├── server/                 ← the .NET backend
│   ├── Program.cs          ← API endpoints are defined here
│   ├── Server.csproj       ← .NET project file (NuGet packages go here)
│   ├── appsettings.json    ← configuration
│   └── Properties/launchSettings.json  ← dev port (5171)
│
└── client/                 ← the React frontend
    ├── index.html
    ├── vite.config.ts      ← Vite config: router + Tailwind plugins, /api proxy, build output
    └── src/
        ├── main.tsx        ← app entry: sets up the router and React Query
        ├── index.css       ← global styles (imports Tailwind)
        ├── routes/         ← one file per page (TanStack Router)
        │   ├── __root.tsx  ← layout shared by every page (the nav bar)
        │   ├── index.tsx   ← the "/" page
        │   └── weather.tsx ← the "/weather" page
        ├── api/            ← functions that call the backend
        │   └── weather.ts
        ├── lib/
        │   ├── http.ts         ← shared axios instance (baseURL = /api)
        │   └── queryClient.ts  ← TanStack Query settings
        └── routeTree.gen.ts    ← AUTO-GENERATED, don't edit by hand
```

---

## 5. Common tasks

### Add a new page

Create a file in `client/src/routes/`. The **file name becomes the URL**.

`client/src/routes/about.tsx` → <http://localhost:5173/about>

```tsx
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/about')({
  component: AboutPage,
})

function AboutPage() {
  return <h1>About us</h1>
}
```

Tip: create an **empty** file while `bun run dev` is running and the router plugin fills in this boilerplate for you.

Then link to it, for example from the nav in `__root.tsx`:

```tsx
<Link to="/about">About</Link>
```

`to="/about"` is type-checked, so a misspelled link shows up as an error in your editor.

More file name patterns:

| File                         | URL                      |
| ---------------------------- | ------------------------ |
| `routes/index.tsx`           | `/`                      |
| `routes/about.tsx`           | `/about`                 |
| `routes/posts/index.tsx`     | `/posts`                 |
| `routes/posts/$postId.tsx`   | `/posts/123` (`$postId` is a URL parameter) |

See the [TanStack Router file-based routing guide](https://tanstack.com/router/latest/docs/framework/react/routing/file-based-routing) for more.

### Add a new API endpoint

Open [server/Program.cs](server/Program.cs) and add an endpoint to the `api` group. Everything in that group automatically starts with `/api`.

```csharp
api.MapGet("/hello/{name}", (string name) => new { message = $"Hello, {name}!" });
```

Now <http://localhost:5171/api/hello/sam> returns `{"message":"Hello, sam!"}`.

Example of a `POST` that receives JSON:

```csharp
api.MapPost("/todos", (Todo todo) => Results.Created($"/api/todos/{todo.Id}", todo));

record Todo(int Id, string Title, bool Done);
```

> Records like `Todo` must go at the **bottom** of `Program.cs`, after `app.Run();`, or in their own `.cs` file.

When `Program.cs` gets big, move endpoints into separate files. See [Minimal APIs](https://learn.microsoft.com/aspnet/core/fundamentals/minimal-apis).

### Call the API from React

It takes three steps. Using the `/hello` endpoint above as the example:

**1. Write a fetch function and a query** in `client/src/api/hello.ts`:

```ts
import { queryOptions } from '@tanstack/react-query'
import { http } from '../lib/http'

export type Hello = { message: string }

export const helloQuery = (name: string) =>
  queryOptions({
    queryKey: ['hello', name],
    queryFn: async () => {
      const { data } = await http.get<Hello>(`/hello/${name}`)
      return data
    },
  })
```

- `http` is the shared axios instance. It already prefixes `/api`, so you write `/hello/...` here.
- `queryKey` is the cache key. Use a different key for different data.

**2. Use it in a component:**

```tsx
import { useQuery } from '@tanstack/react-query'
import { helloQuery } from '../api/hello'

function Greeting() {
  const { data, isPending, error } = useQuery(helloQuery('sam'))

  if (isPending) return <p>Loading…</p>
  if (error) return <p>Something went wrong</p>
  return <p>{data.message}</p>
}
```

TanStack Query takes care of loading and error states, caching, and refetching for you.

**3. (Optional) Load the data before the page appears.** [client/src/routes/weather.tsx](client/src/routes/weather.tsx) does this with a route `loader` and `useSuspenseQuery`, so the data starts loading as soon as you hover over the link.

### Send data to the API (POST / PUT / DELETE)

Use `useMutation`:

```tsx
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { http } from '../lib/http'

function AddTodoButton() {
  const queryClient = useQueryClient()

  const addTodo = useMutation({
    mutationFn: (title: string) => http.post('/todos', { id: Date.now(), title, done: false }),
    // Refresh any cached todo lists after a successful save
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['todos'] }),
  })

  return (
    <button onClick={() => addTodo.mutate('Buy milk')} disabled={addTodo.isPending}>
      Add todo
    </button>
  )
}
```

### Style with Tailwind CSS

Style elements by adding Tailwind utility classes to `className`. There's no separate CSS file to write:

```tsx
<button className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
  Save
</button>
```

- `dark:` classes apply when the computer is in dark mode, e.g. `bg-white dark:bg-gray-950`.
- Global styles and theme settings live in [client/src/index.css](client/src/index.css). Tailwind v4 has no `tailwind.config.js`. To add your own colors or fonts, use an `@theme` block in that file ([docs](https://tailwindcss.com/docs/theme)).
- Install the **Tailwind CSS IntelliSense** VS Code extension to get class name autocomplete.

### Add packages

```bash
# Frontend (npm packages)
cd client
bun add <package-name>        # e.g. bun add date-fns
bun add -d <package-name>     # dev-only tools

# Backend (NuGet packages)
cd server
dotnet add package <PackageName>   # e.g. dotnet add package Microsoft.EntityFrameworkCore.Sqlite
```

### Debugging tools

In development, two small floating buttons show up in the bottom corners of the page:

- **TanStack Router Devtools**: the current route, params and loader data
- **React Query Devtools**: every cached query and its status

The API's OpenAPI description is at <http://localhost:5171/openapi/v1.json>.

### Lint the frontend

```bash
cd client
bun run lint
```

---

## 6. Build for production

```bash
bun run build
```

This will:

1. Type-check and build the React app into `server/wwwroot/`
2. Publish the .NET app (with the React files inside it) into `publish/`

Run the production build locally:

```bash
bun run start
```

Then open <http://localhost:5000>. The `publish/` folder is all you need to deploy, to any host that runs .NET 10 (Azure App Service, a Linux VM, a Docker container, and so on).

---

## 7. Scripts reference

Run these from the **root** folder:

| Command           | What it does                                          |
| ----------------- | ----------------------------------------------------- |
| `bun run setup`   | Install frontend and backend dependencies             |
| `bun run dev`     | Start the API and the React app together              |
| `bun run dev:api` | Start only the .NET API (with auto-reload)            |
| `bun run dev:web` | Start only the React app                              |
| `bun run build`   | Build everything into `publish/`                      |
| `bun run start`   | Run the production build from `publish/`              |

---

## 8. Troubleshooting

**The Weather page says "Could not load weather" / "Request failed with status code 500" / "ECONNREFUSED"**
The .NET API isn't running. Start it with `bun run dev` (or `bun run dev:api`) and check the terminal for C# errors.

**`Cannot find module './routeTree.gen'`**
That file is generated by the router plugin. Run `bun run dev` (or `bun run build`) in `client/` once and it will be created.

**"Failed to bind to address http://127.0.0.1:5171: address already in use"**
Another copy of the app is still running, maybe in another terminal or left over from an earlier run. Find it and stop it (macOS/Linux):

```bash
lsof -i :5171        # shows the process using the port, and its PID
kill <PID>           # stop it
```

Use `:5173` for the React app instead. You can also change the port in `server/Properties/launchSettings.json` (API) or `client/vite.config.ts` (web). If you change the API port, update the `proxy` target in `vite.config.ts` to match.

**`dotnet: command not found` or `bun: command not found`**
Install the tool (step 1), then **close and reopen your terminal**.

**I changed a C# file and nothing happened**
`dotnet watch` restarts the API when you save. Check the `api` lines in the terminal for build errors.

---

## 9. Learn more

- [React docs](https://react.dev/learn): start with "Quick Start"
- [TypeScript handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [TanStack Router docs](https://tanstack.com/router/latest/docs/framework/react/overview)
- [TanStack Query docs](https://tanstack.com/query/latest/docs/framework/react/overview)
- [ASP.NET Core Minimal APIs tutorial](https://learn.microsoft.com/aspnet/core/tutorials/min-web-api)
- [Vite guide](https://vite.dev/guide/)
