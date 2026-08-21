import "./Toolbar.css";

/** Where the hand-written test results page lives (see public/tests/). */
const TEST_REPORT_URL = `${import.meta.env.BASE_URL}tests/index.html`;

/**
 * The app's top toolbar. Currently just holds a link to the test report;
 * the empty start slot is reserved for a logo and menus later on.
 */
export function Toolbar() {
  return (
    <header className="toolbar">
      <div className="toolbar__inner">
        <div className="toolbar__start" />
        <nav className="toolbar__end">
          <a className="toolbar__link" href={TEST_REPORT_URL}>
            Tests
          </a>
        </nav>
      </div>
    </header>
  );
}
