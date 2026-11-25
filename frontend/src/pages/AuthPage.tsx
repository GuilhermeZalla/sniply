import { useState, type FormEvent } from "react";
import {
  Link,
  Navigate,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import { useAuth } from "../auth";
import { Password } from "../components/Password";
import { Brand, Button, ErrorBox, Notice } from "../components/ui";
import { api, errorMessage, json, login } from "../lib/api";
import { isPublicDemo } from "../lib/demo";
export function AuthPage({ mode = "login" }: { mode?: string }) {
  const { user, setUser } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const [params] = useSearchParams();
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  const register = mode === "register",
    forgot = mode === "forgot",
    reset = mode === "reset";
  if (isPublicDemo || (user && mode === "login")) return <Navigate to="/" replace />;
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(e.currentTarget));
    setBusy(true);
    setError("");
    setNotice("");
    try {
      if (mode === "login") {
        setUser(
          await login(String(d.email), String(d.password), d.remember === "on"),
        );
        const target = loc.state?.from;
        nav(
          typeof target === "string" &&
            target.startsWith("/") &&
            !target.startsWith("//")
            ? target
            : "/",
        );
      } else if (register) {
        await api("/auth/register", json("POST", d));
        setNotice("Your account is ready. You can now sign in.");
      } else if (forgot) {
        await api("/auth/forgot-password", json("POST", d));
        setNotice(
          "If an account matches this email, a reset link will be sent.",
        );
      } else {
        await api(
          "/auth/reset-password",
          json("POST", {
            ...d,
            email: params.get("email"),
            token: params.get("token"),
          }),
        );
        setNotice("Password updated. Sign in with your new password.");
      }
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="auth auth-gate">
      <div className="auth-library-preview" aria-hidden="true">
        <div className="preview-nav">
          <span className="preview-mark">&lt;/&gt;</span>
          <strong>sniply</strong>
          <span className="preview-nav-end">YOUR CODE LIBRARY</span>
        </div>
        <div className="preview-layout">
          <div className="preview-sidebar">
            <span>LIBRARY</span>
            <strong>All snippets</strong>
            <span>Favorites</span>
            <span>Collections</span>
            <span>Tags</span>
          </div>
          <div className="preview-content">
            <div className="preview-heading"><strong>All snippets</strong><span>Recently updated</span></div>
            <div className="preview-search">Search title, code or tags</div>
            <div className="preview-row"><span>TS</span><div><strong>Debounce a search input</strong><small>TypeScript · UI utilities</small></div><em>Updated today</em></div>
            <div className="preview-row"><span>JS</span><div><strong>Fetch with timeout</strong><small>JavaScript · API helpers</small></div><em>Yesterday</em></div>
            <div className="preview-row"><span>CSS</span><div><strong>Responsive grid</strong><small>CSS · Layout</small></div><em>3 days ago</em></div>
            <div className="preview-row"><span>TS</span><div><strong>Group records by field</strong><small>TypeScript · Data</small></div><em>Last week</em></div>
          </div>
        </div>
      </div>
      <div className="auth-dim" aria-hidden="true" />
      <main id="main-content" className="auth-access">
        <div className="auth-modal">
          <div className="auth-modal-top">
            <Brand />
            <span>PERSONAL CODE LIBRARY</span>
          </div>
      <section className="auth-form">
        <div>
          <p className="eyebrow">
            {register
              ? "CREATE ACCOUNT"
              : forgot || reset
                ? "ACCOUNT ACCESS"
                : "YOUR LIBRARY"}
          </p>
          <h2>
            {register
              ? "Create your workspace"
              : forgot
                ? "Forgot your password?"
                : reset
                  ? "Choose a new password"
                  : "Sign in to Sniply"}
          </h2>
          <p>
            {register
              ? "A quieter home for the code you use."
              : forgot
                ? "We’ll send a link to reset your password."
                : reset
                  ? "Use at least 10 characters, uppercase, lowercase and a number."
                  : "Pick up where you left off."}
          </p>
          <form onSubmit={submit}>
            {register && (
              <label>
                Full name
                <input
                  name="name"
                  autoComplete="name"
                  required
                  maxLength={100}
                />
              </label>
            )}
            {!reset && (
              <label>
                Email address
                <input
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  maxLength={254}
                />
              </label>
            )}
            {!forgot && <Password minLength={mode === "login" ? 1 : 10} />}
            {(register || reset) && (
              <>
                <small>
                  At least 10 characters, with uppercase, lowercase and a
                  number.
                </small>
                <Password name="confirmPassword" label="Confirm password" />
              </>
            )}
            {mode === "login" && (
              <div className="form-between">
                <label className="check">
                  <input type="checkbox" name="remember" />
                  Remember me
                </label>
                <Link to="/forgot-password">Forgot password?</Link>
              </div>
            )}
            {error && <ErrorBox message={error} />}{" "}
            {notice && <Notice>{notice}</Notice>}
            <Button type="submit" disabled={busy}>
              {busy
                ? "Please wait..."
                : register
                  ? "Create account"
                  : forgot
                    ? "Send reset link"
                    : reset
                      ? "Update password"
                      : "Sign in"}{" "}
            </Button>
          </form>
          <p className="auth-switch">
            {mode === "login" ? (
              <>
                New here? <Link to="/register">Create an account</Link>
              </>
            ) : (
              <Link to="/login">Back to sign in</Link>
            )}
          </p>
        </div>
      </section>
        </div>
        <p className="auth-access-note">SNIPLY / KEEP WHAT WORKS</p>
      </main>
    </div>
  );
}
