import { useMutation, useQueryClient } from "@tanstack/react-query";
import { lazy, Suspense, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth";
import { Button, ErrorBox, Heading, Loading, Notice } from "../components/ui";
import { api, errorMessage, json } from "../lib/api";
import { editorPayload } from "../lib/library";
import type { Group, Language, Snippet } from "../lib/types";
const CodeEditor = lazy(() => import("../components/CodeEditor"));
export function EditorForm({
  snippet,
  languages,
  categories,
  groups,
  defaultLanguage,
}: {
  snippet?: Snippet;
  languages: Language[];
  categories: Group[];
  groups: Group[];
  defaultLanguage: string;
}) {
  const { user } = useAuth();
  const [title, setTitle] = useState(snippet?.title || ""),
    [description, setDescription] = useState(snippet?.description || ""),
    [code, setCode] = useState(snippet?.code || ""),
    [language, setLanguage] = useState(snippet?.languageId || defaultLanguage),
    [category, setCategory] = useState(snippet?.categoryId || ""),
    [selected, setSelected] = useState(snippet?.groups.map((g) => g.id) || []),
    [error, setError] = useState("");
  const nav = useNavigate(),
    cache = useQueryClient();
  const save = useMutation({
    mutationFn: () =>
      api<Snippet>(
        "/snippets" + (snippet ? "/" + snippet.id : ""),
        json(
          snippet ? "PUT" : "POST",
          editorPayload(title, description, code, language, category, selected),
        ),
      ),
    onSuccess: (s) => {
      void cache.invalidateQueries();
      nav("/snippets/" + s.id);
    },
    onError: (e) => setError(errorMessage(e)),
  });
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        save.mutate();
      }}
    >
      <Heading
        title={snippet ? "Edit snippet" : "New snippet"}
        description="Add code, then choose how to find it later."
        action={
          <div className="actions">
            <Link
              className="button secondary"
              to={snippet ? "/snippets/" + snippet.id : "/snippets"}
            >
              Cancel
            </Link>
            <Button type="submit" disabled={save.isPending}>
              {save.isPending ? "Saving..." : "Save snippet"}
            </Button>
          </div>
        }
      />
      {error && <ErrorBox message={error} />}
      {snippet?.isPublic && (
        <Notice>
          This snippet has an active public link. Saved changes will be visible
          to anyone with that link.
        </Notice>
      )}
      <div className="editor-layout">
        <div>
          <section className="panel form-stack">
            <label>
              Title
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={160}
                required
                placeholder="e.g. Debounce a search input"
              />
            </label>
            <label>
              <span>Description <span className="muted">(optional)</span></span>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={2000}
                rows={2}
                placeholder="When is this useful?"
              />
            </label>
          </section>
          <section className="editor-panel">
            <div className="editor-toolbar">
              <strong>Code</strong>
              <span>
                {languages.find((l) => l.id === language)?.name || "Plain text"}
              </span>
            </div>
            <Suspense fallback={<Loading />}>
              <CodeEditor
                value={code}
                onChange={setCode}
                language={
                  languages.find((l) => l.id === language)?.monacoId ||
                  "plaintext"
                }
                fontSize={user?.fontSize}
                wordWrap={user?.wordWrap}
              />
            </Suspense>
          </section>
        </div>
        <aside className="panel editor-options">
          <h2>Make it easy to find</h2>
          <label>
            Language
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
            >
              {languages.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Category
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="">Uncategorized</option>
              {categories.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </label>
          {["tag", "collection"].map((kind) => (
            <fieldset key={kind}>
              <legend>{kind === "tag" ? "Tags" : "Collections"}</legend>
              {groups
                .filter((g) => g.kind === kind)
                .map((g) => (
                  <label className="check" key={g.id}>
                    <input
                      type="checkbox"
                      checked={selected.includes(g.id)}
                      onChange={(e) =>
                        setSelected(
                          e.target.checked
                            ? [...selected, g.id]
                            : selected.filter((x) => x !== g.id),
                        )
                      }
                    />
                    {g.name}
                  </label>
                ))}
              {!groups.some((g) => g.kind === kind) && (
                <p className="muted">
                  Create {kind === "tag" ? "tags" : "collections"} from the
                  sidebar.
                </p>
              )}
            </fieldset>
          ))}
        </aside>
      </div>
    </form>
  );
}
