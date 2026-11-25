import { useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth";
import { Password } from "../components/Password";
import {
  Button,
  Confirm,
  ErrorBox,
  Heading,
  Loading,
  Notice,
} from "../components/ui";
import { useData } from "../hooks/useData";
import { api, errorMessage, json } from "../lib/api";
import type { Language, User } from "../lib/types";
import { getTheme, setTheme, themes, type ThemeId } from "../theme";
import { isPublicDemo, resetDemo } from "../lib/demo";
export function SettingsPage() {
  const { user, setUser, signOut } = useAuth();
  const [themeId, setThemeId] = useState<ThemeId>(getTheme);
  function chooseTheme(id: ThemeId) {
    setTheme(id);
    setThemeId(id);
  }
  const langs = useData<Language[]>("languages", "/languages");
  const [notice, setNotice] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const cache = useQueryClient();
  const [remove, setRemove] = useState<Language | null>(null);
  async function removeLanguage() {
    if (!remove) return;
    setBusy(true);
    setError("");
    try {
      await api("/languages/" + remove.id, { method: "DELETE" });
      await cache.invalidateQueries();
      setRemove(null);
      setNotice("Language removed.");
    } catch (e) {
      setError(errorMessage(e));
      setRemove(null);
    } finally {
      setBusy(false);
    }
  }
  async function save(e: FormEvent<HTMLFormElement>, type: string) {
    e.preventDefault();
    const form = e.currentTarget;
    const d = Object.fromEntries(new FormData(form));
    setBusy(true);
    setError("");
    setNotice("");
    try {
      if (type === "profile") {
        const u = await api<User>(
          "/auth/profile",
          json("PUT", {
            ...d,
            fontSize: Number(d.fontSize),
            wordWrap: d.wordWrap === "on",
          }),
        );
        setUser(u);
        setNotice("Your preferences are saved.");
      } else if (type === "password") {
        await api("/auth/password", json("PUT", d));
        await signOut();
      } else {
        await api("/languages", json("POST", d));
        void cache.invalidateQueries({ queryKey: ["languages"] });
        form.reset();
        setNotice("Language added.");
      }
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  if (langs.isPending) return <Loading />;
  if (langs.error)
    return (
      <ErrorBox
        message={errorMessage(langs.error)}
        retry={() => void langs.refetch()}
      />
    );
  return (
    <>
      <Heading
        title="Settings"
        description="Profile, editor, and appearance."
      />
      {error && <ErrorBox message={error} />}{" "}
      {notice && <Notice>{notice}</Notice>}
      <section className="panel appearance-panel" aria-labelledby="appearance-heading">
        <h2 id="appearance-heading">Appearance</h2>
        <p className="muted">Choose a workspace palette. This preference is saved in this browser.</p>
        <div className="theme-choices" role="group" aria-label="Color theme">
          {themes.map((theme) => (
            <button
              key={theme.id}
              type="button"
              className="theme-choice"
              aria-pressed={themeId === theme.id}
              onClick={() => chooseTheme(theme.id)}
            >
              <span className="theme-swatch" aria-hidden="true">
                {theme.colors.map((color) => <span key={color} style={{ backgroundColor: color }} />)}
              </span>
              <strong>{theme.name}</strong>
            </button>
          ))}
        </div>
      </section>
      {isPublicDemo && <section className="panel demo-reset"><h2>Demo data</h2><p className="muted">Your changes stay in this browser. Start over whenever you want.</p><Button secondary onClick={() => { resetDemo(); window.location.reload(); }}>Reset sample data</Button></section>}
      <div className="settings-grid">
        <section className="panel">
          <h2>Profile & editor</h2>
          <form
            className="form-stack"
            onSubmit={(e) => void save(e, "profile")}
          >
            <label>
              Name
              <input
                name="name"
                defaultValue={user?.name}
                required
                maxLength={100}
              />
            </label>
            <label>
              Email
              <input
                name="email"
                type="email"
                defaultValue={user?.email}
                disabled={isPublicDemo}
                required
              />
            </label>
            {!isPublicDemo && <label>
              Current password <small>(required to change email)</small>
              <input
                type="password"
                name="currentPassword"
                autoComplete="current-password"
              />
            </label>}
            <div className="two-fields">
              <label>
                Default language
                <select
                  name="defaultLanguage"
                  defaultValue={user?.defaultLanguage}
                >
                  {langs.data?.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Code font size
                <select name="fontSize" defaultValue={user?.fontSize}>
                  {[12, 13, 14, 15, 16, 18, 20, 22].map((n) => (
                    <option key={n} value={n}>
                      {n}px
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label className="check">
              <input
                type="checkbox"
                name="wordWrap"
                defaultChecked={user?.wordWrap}
              />
              Wrap long lines in the editor
            </label>
            <Button type="submit" disabled={busy}>
              Save preferences
            </Button>
          </form>
        </section>
        {!isPublicDemo && <section className="panel">
          <h2>Change password</h2>
          <p className="muted">
            Changing your password signs you out on all devices.
          </p>
          <form
            className="form-stack"
            onSubmit={(e) => void save(e, "password")}
          >
            <Password
              name="currentPassword"
              label="Current password"
              minLength={1}
            />
            <Password label="New password" />
            <Password name="confirmPassword" label="Confirm new password" />
            <Button type="submit" secondary disabled={busy}>
              Update password
            </Button>
          </form>
        </section>}
        <section className="panel">
          <h2>Custom languages</h2>
          <p className="muted">
            Use a Monaco language ID, such as ruby or markdown. Unknown IDs
            render as plain text.
          </p>
          <form
            className="form-stack"
            onSubmit={(e) => void save(e, "language")}
          >
            <label>
              Name
              <input name="name" required maxLength={50} />
            </label>
            <label>
              Syntax identifier
              <input
                name="monacoId"
                required
                pattern="[a-z][a-z0-9-]{0,29}"
                maxLength={30}
              />
            </label>
            <Button type="submit" secondary disabled={busy}>
              Add language
            </Button>
          </form>
          {langs.data
            ?.filter((l) => l.custom)
            .map((l) => (
              <div className="group-row" key={l.id}>
                <span>{l.name}</span>
                <Button secondary disabled={busy} onClick={() => setRemove(l)}>
                  Remove
                </Button>
              </div>
            ))}
        </section>
        <section className="panel">
          <h2>Library structure</h2>
          <p className="muted">
            Categories give each snippet a primary home. Tags connect it to
            other ideas.
          </p>
          <Link className="button secondary" to="/categories">
            Manage categories
          </Link>
        </section>
      </div>
      {remove && (
        <Confirm
          title={"Remove " + remove.name + "?"}
          description="Languages used by snippets cannot be removed. Move those snippets to another language first."
          busy={busy}
          onCancel={() => setRemove(null)}
          onConfirm={() => void removeLanguage()}
        />
      )}
    </>
  );
}
