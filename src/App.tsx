import { RouterProvider } from "./Router/Router";
import { useRouter } from "./Router/useRouter";
import { HomePage } from "./HomePage/HomePage";
import { About } from "./About/About";
import { TestResults } from "./TestResults/TestResults";

/** Where each page lives, relative to the app's base URL. */
const ABOUT_PATH = `${import.meta.env.BASE_URL}about`;
const TESTS_PATH = `${import.meta.env.BASE_URL}tests`;

function Routes() {
  const { path } = useRouter();

  if (path === ABOUT_PATH) return <About />;
  if (path === TESTS_PATH) return <TestResults />;
  return <HomePage />;
}

function App() {
  return (
    <RouterProvider>
      <Routes />
    </RouterProvider>
  );
}

export default App;
