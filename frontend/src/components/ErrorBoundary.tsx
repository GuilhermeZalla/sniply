import { Component, type ReactNode } from "react";
import { Brand, Button } from "./ui";
export class ErrorBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (this.state.failed)
      return (
        <main className="public-page">
          <Brand />
          <div className="empty">
            <h1>Something interrupted your workspace.</h1>
            <p>
              Your saved snippets are still stored on the server. Reload the
              page to try again.
            </p>
            <Button onClick={() => window.location.reload()}>
              Reload Sniply
            </Button>
          </div>
        </main>
      );
    return this.props.children;
  }
}
