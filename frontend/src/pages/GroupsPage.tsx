import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Folder, Hash, Trash2 } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Button, Confirm, ErrorBox, Heading, Loading } from "../components/ui";
import { useData } from "../hooks/useData";
import { api, errorMessage, json } from "../lib/api";
import type { Group } from "../lib/types";
export function GroupsPage({
  kind,
}: {
  kind: "tag" | "collection" | "category";
}) {
  const q = useData<Group[]>(kind, "/groups/" + kind);
  const [edit, setEdit] = useState<Group | null>(null),
    [name, setName] = useState(""),
    [description, setDescription] = useState(""),
    [remove, setRemove] = useState<Group | null>(null);
  const cache = useQueryClient();
  const title =
    kind === "collection"
      ? "Collections"
      : kind === "tag"
        ? "Tags"
        : "Categories";
  const change = useMutation({
    mutationFn: async (deleting: boolean) => {
      if (deleting)
        return api("/groups/" + kind + "/" + remove?.id, { method: "DELETE" });
      return api(
        "/groups/" + kind + (edit ? "/" + edit.id : ""),
        json(edit ? "PUT" : "POST", { name, description }),
      );
    },
    onSuccess: () => {
      void cache.invalidateQueries();
      setEdit(null);
      setRemove(null);
      setName("");
      setDescription("");
    },
  });
  return (
    <>
      <Heading
        title={title}
        description={
          kind === "collection"
            ? "Group snippets you use together."
            : "A simple structure for finding the right code."
        }
      />
      <form
        className="panel group-form"
        onSubmit={(e) => {
          e.preventDefault();
          change.mutate(false);
        }}
      >
        <label>
          {edit ? "Rename" : "New"} {kind}
          <input
            required
            maxLength={60}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={
              kind === "collection"
                ? "e.g. Everyday utilities"
                : "e.g. Frontend"
            }
          />
        </label>
        <label>
          Description (optional)
          <input
            maxLength={500}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </label>
        <Button type="submit" disabled={change.isPending}>
          {edit ? "Save changes" : "Create " + kind}
        </Button>
        {edit && (
          <Button
            secondary
            onClick={() => {
              setEdit(null);
              setName("");
              setDescription("");
            }}
          >
            Cancel
          </Button>
        )}
      </form>
      {change.error && <ErrorBox message={errorMessage(change.error)} />}
      <section className="panel">
        {q.isPending ? (
          <Loading />
        ) : q.error ? (
          <ErrorBox message={errorMessage(q.error)} />
        ) : !q.data.length ? (
          <p className="empty-text">
            No {title.toLowerCase()} yet. Create your first one above.
          </p>
        ) : (
          q.data.map((g) => (
            <article className="group-row" key={g.id}>
              <span className="code-symbol">
                {kind === "collection" ? (
                  <Folder size={20} />
                ) : (
                  <Hash size={20} />
                )}
              </span>
              <div>
                <Link
                  className="snippet-title"
                  to={
                    "/snippets?" +
                    (kind === "category" ? "category" : "group") +
                    "=" +
                    g.id
                  }
                >
                  {g.name}
                </Link>
                <p>{g.description || g.count + " snippets"}</p>
              </div>
              <span className="count">{g.count}</span>
              <Button
                secondary
                onClick={() => {
                  setEdit(g);
                  setName(g.name);
                  setDescription(g.description);
                }}
              >
                Edit
              </Button>
              <button
                className="icon-button danger-text"
                aria-label={"Delete " + g.name}
                onClick={() => setRemove(g)}
              >
                <Trash2 size={16} />
              </button>
            </article>
          ))
        )}
      </section>
      {remove && (
        <Confirm
          title={"Delete " + remove.name + "?"}
          description="Your snippets will stay in your library. Only this grouping will be removed."
          busy={change.isPending}
          onCancel={() => setRemove(null)}
          onConfirm={() => change.mutate(true)}
        />
      )}
    </>
  );
}
