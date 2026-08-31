import { Toolbar } from "../Toolbar/Toolbar";
import { useAsyncStore } from "../useAsyncStore/useAsyncStore";
import {
  loadTestResults,
  relativePath,
  type TestFileResult,
  type TestResultsData,
} from "./loadTestResults";
import "./TestResults.css";

const NO_RESULTS_MESSAGE = "No test results found yet. Run `npm test` to generate them.";

/**
 * The Tests page: a browsable pass/fail report of the last `npm test`
 * run. Shares the same <Toolbar /> the main app uses (see main.tsx for
 * this page's own entry point).
 */
export function TestResults() {
  const state = useAsyncStore(() => loadTestResults(), NO_RESULTS_MESSAGE);

  return (
    <>
      <Toolbar />
      <main className="page test-results-page">
        <h1>Test Results</h1>
        {state.status === "loading" && (
          <div className="test-results__summary test-results__summary--pending">
            Loading test results…
          </div>
        )}
        {state.status === "error" && (
          <div className="test-results__summary test-results__summary--pending">
            {state.message}
          </div>
        )}
        {state.status === "ready" && <Summary data={state.store} />}
      </main>
    </>
  );
}

function Summary({ data }: { data: TestResultsData }) {
  const { numTotalTests, numPassedTests, numFailedTests, testResults, startTime } = data;
  const when = startTime ? new Date(startTime).toLocaleString() : null;

  return (
    <>
      <div
        className={
          "test-results__summary " +
          (numFailedTests > 0
            ? "test-results__summary--failed"
            : "test-results__summary--passed")
        }
      >
        {numPassedTests} / {numTotalTests} tests passed
        {numFailedTests > 0 ? ` (${numFailedTests} failed)` : ""}
        {when && <span className="test-results__timestamp">Last run: {when}</span>}
      </div>
      {testResults.map((file) => (
        <TestFile key={file.name} file={file} />
      ))}
    </>
  );
}

function TestFile({ file }: { file: TestFileResult }) {
  return (
    <div className="test-results__file">
      <h2>{relativePath(file.name)}</h2>
      <ul className="test-results__tests">
        {file.assertionResults.map((test, index) => (
          <li key={`${index}-${test.fullName ?? test.title}`}>
            <span
              className={`test-results__mark test-results__mark--${test.status}`}
              aria-hidden="true"
            >
              {test.status === "passed" ? "✓" : "✗"}
            </span>
            <span>{test.fullName || test.title}</span>
            {test.failureMessages && test.failureMessages.length > 0 && (
              <div className="test-results__failure-message">
                {test.failureMessages.join("\n\n")}
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
