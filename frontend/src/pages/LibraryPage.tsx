import { Plus, Search } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { SnippetRows } from "../components/SnippetRows";
import { Button, Empty, ErrorBox, Heading, Loading } from "../components/ui";
import { useData } from "../hooks/useData";
import { errorMessage } from "../lib/api";
import { pageQuery } from "../lib/library";
import type { Group, Language, Page, Snippet } from "../lib/types";
export function LibraryPage({ favorites = false }: { favorites?: boolean }) {
  const [params, setParams] = useSearchParams();
  const query = new URLSearchParams(params);
  if (favorites) query.set("favorite", "true");
  const q = useData<Page<Snippet>>("snippets", "/snippets?" + query);
  const langs = useData<Language[]>("languages", "/languages");
  const cats = useData<Group[]>("category", "/groups/category");
  const groups = useData<Group[]>("collections", "/groups/collection");
  const activeGroup = groups.data?.find((g) => g.id === params.get("group"));
  function filter(key: string, value: string) {
    setParams(pageQuery(params, key, value));
  }
  return (
    <>
      <p className="eyebrow library-kicker">{favorites ? "INDEX / SAVED FAVORITES" : "INDEX / CODE FILES"}</p>
      <Heading
        title={favorites ? "Favorites" : activeGroup?.name || "All snippets"}
        description={
          favorites
            ? "Snippets you marked to find again quickly."
            : activeGroup?.description ||
              "Search saved code by title, content, language, or tag."
        }
        action={
          <Link className="button" to="/snippets/new">
            <Plus size={16} />
            New snippet
          </Link>
        }
      />
      <div className="filters">
        <form
          className="search-field"
          key={params.get("search") || ""}
          onSubmit={(e) => {
            e.preventDefault();
            filter(
              "search",
              String(new FormData(e.currentTarget).get("search") || ""),
            );
          }}
        >
          <Search size={16} />
          <input
            name="search"
            aria-label="Search library"
            placeholder="Search title, code or tags..."
            defaultValue={params.get("search") || ""}
          />
          <button>Search</button>
        </form>
        <label>
          Language
          <select
            value={params.get("language") || ""}
            onChange={(e) => filter("language", e.target.value)}
          >
            <option value="">All languages</option>
            {langs.data?.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Category
          <select
            value={params.get("category") || ""}
            onChange={(e) => filter("category", e.target.value)}
          >
            <option value="">All categories</option>
            {cats.data?.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Sort by
          <select
            value={params.get("sort") || "updated"}
            onChange={(e) => filter("sort", e.target.value)}
          >
            <option value="updated">Last updated</option>
            <option value="created">Newest first</option>
            <option value="title">Title A–Z</option>
          </select>
        </label>
      </div>
      {(params.get("group") ||
        params.get("category") ||
        params.get("search") ||
        params.get("language")) && (
        <button className="clear-filter" onClick={() => setParams({})}>
          Clear filters
        </button>
      )}
      <section className="panel">
        {q.isPending ? (
          <Loading />
        ) : q.error ? (
          <ErrorBox
            message={errorMessage(q.error)}
            retry={() => void q.refetch()}
          />
        ) : q.data.items.length ? (
          <>
            <div className="list-label">
              <span>{q.data.total} snippets</span>
              <span>UPDATED</span>
            </div>
            <SnippetRows items={q.data.items} />
            <div className="pagination">
              <Button
                secondary
                disabled={q.data.page <= 1}
                onClick={() => filter("page", String(q.data.page - 1))}
              >
                Previous
              </Button>
              <span>
                Page {q.data.page} of {q.data.pages}
              </span>
              <Button
                secondary
                disabled={q.data.page >= q.data.pages}
                onClick={() => filter("page", String(q.data.page + 1))}
              >
                Next
              </Button>
            </div>
          </>
        ) : (
          <Empty
            title="No snippets here yet."
            text="Try another filter, or save something useful."
          />
        )}
      </section>
    </>
  );
}
