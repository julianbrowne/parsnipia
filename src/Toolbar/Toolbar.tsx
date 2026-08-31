import { useEffect, useRef, useState } from "react";
import "./Toolbar.css";

/** The main app page (also where the logo links back to). */
const HOME_URL = import.meta.env.BASE_URL;
/** The About page — its own React page, built from about/index.html (see src/About/). */
const ABOUT_URL = `${import.meta.env.BASE_URL}about/index.html`;
/** The Tests page — its own React page, built from tests/index.html (see src/TestResults/). */
const TEST_REPORT_URL = `${import.meta.env.BASE_URL}tests/index.html`;
const LOGO_URL = `${import.meta.env.BASE_URL}assets/images/parsnipia-logo.png`;

/**
 * The app's top toolbar: the logo on the left, the app title and tagline
 * centered, and a hamburger menu on the right linking out to the About
 * and Tests pages.
 */
export function Toolbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;

    function closeIfOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", closeIfOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeIfOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [menuOpen]);

  return (
    <header className="toolbar">
      <div className="toolbar__inner">
        <div className="toolbar__start">
          <a href={HOME_URL} aria-label="Parsnipia Verbum home">
            <img className="toolbar__logo" src={LOGO_URL} alt="" width={40} height={40} />
          </a>
        </div>

        <div className="toolbar__center">
          <h1 className="toolbar__title">Parsnipia Verbum</h1>
          <p className="toolbar__tagline">the crossword solver's friend</p>
        </div>

        <div className="toolbar__end" ref={menuRef}>
          <button
            type="button"
            className="toolbar__menu-button"
            aria-haspopup="true"
            aria-expanded={menuOpen}
            aria-label="Menu"
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span aria-hidden="true">☰</span>
          </button>
          {menuOpen && (
            <nav className="toolbar__menu" aria-label="Site">
              <a
                className="toolbar__link"
                href={ABOUT_URL}
                onClick={() => setMenuOpen(false)}
              >
                About
              </a>
              <a
                className="toolbar__link"
                href={TEST_REPORT_URL}
                onClick={() => setMenuOpen(false)}
              >
                Tests
              </a>
            </nav>
          )}
        </div>
      </div>
    </header>
  );
}
