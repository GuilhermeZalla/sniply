import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronRight, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { ErrorBox } from "../components/ui";
import { api, errorMessage, json } from "../lib/api";
import { localDate } from "../lib/library";
import type { Snippet } from "../lib/types";
export function SnippetRows({ items }: { items: Snippet[] }) {
  const cache = useQueryClient();
  const favorite = useMutation({
    mutationFn: (s: Snippet) =>
      api(
        "/snippets/" + s.id + "/favorite",
        json("PUT", { isFavorite: !s.isFavorite }),
      ),
    onSuccess: () => cache.invalidateQueries(),
  });
  return (
    <>
      {favorite.error && <ErrorBox message={errorMessage(favorite.error)} />}
      <div className="snippet-list">
        {items.map((s) => (
          <article className="snippet-row" key={s.id}>
            <div className="snippet-info">
              <Link className="snippet-title" to={"/snippets/" + s.id}>
                {s.title}
              </Link>
              <p>{s.description || "No description added."}</p>
              <div className="inline-meta">
                <span className="language">{s.language}</span>
                {s.groups
                  .filter((g) => g.kind === "tag")
                  .slice(0, 3)
                  .map((g) => (
                    <Link key={g.id} to={"/snippets?group=" + g.id}>
                      #{g.name}
                    </Link>
                  ))}
              </div>
            </div>
            <time dateTime={s.updatedAt}>{localDate(s.updatedAt)}</time>
            <button
              className={s.isFavorite ? "icon-button favorited" : "icon-button"}
              aria-label={
                (s.isFavorite ? "Remove favorite: " : "Favorite: ") + s.title
              }
              aria-pressed={s.isFavorite}
              disabled={favorite.isPending}
              onClick={() => favorite.mutate(s)}
            >
              <Star size={18} fill={s.isFavorite ? "currentColor" : "none"} />
            </button>
            <Link
              className="icon-button"
              aria-label={"Open " + s.title}
              to={"/snippets/" + s.id}
            >
              <ChevronRight size={18} />
            </Link>
          </article>
        ))}
      </div>
    </>
  );
}
