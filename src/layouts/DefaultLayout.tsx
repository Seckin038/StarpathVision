import { BrowserRouter, Link } from "react-router-dom";
import { ReactNode } from "react";

interface DefaultLayoutProps {
  children: ReactNode;
}

const DefaultLayout = ({ children }: DefaultLayoutProps) => {
  const year = new Date().getFullYear();

  return (
    <BrowserRouter>
      <div className="flex min-h-screen flex-col">
        <header className="bg-gray-800 text-white">
          <nav className="container mx-auto flex gap-4 p-4">
            <Link to="/" className="hover:underline">
              Home
            </Link>
            <Link to="/about" className="hover:underline">
              About
            </Link>
          </nav>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="bg-gray-800 text-white">
          <div className="container mx-auto flex flex-col items-center gap-2 p-4 text-sm sm:flex-row sm:justify-between">
            <span>© {year} StarpathVision</span>
            <span className="flex gap-4">
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
              >
                Twitter
              </a>
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
              >
                GitHub
              </a>
            </span>
          </div>
        </footer>
      </div>
    </BrowserRouter>
  );
};

export default DefaultLayout;
