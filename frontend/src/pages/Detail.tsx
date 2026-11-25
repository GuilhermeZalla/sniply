import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Copy, Share2, Star, Trash2 } from "lucide-react";
import { lazy, Suspense, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../auth";
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
import { localDate } from "../lib/library";
import { isPublicDemo } from "../lib/demo";
import type { Snippet } from "../lib/types";
const CodeEditor = lazy(() => import("../components/CodeEditor"));
export function Detail() {
  const { id } = useParams();
  const { user } = useAuth();
  const q = useData<Snippet>("snippet", "/snippets/" + id);
  const cache = useQueryClient(),
    nav = useNavigate();
  const [notice, setNotice] = useState(""),
    [remove, setRemove] = useState(false),
    [error, setError] = useState("");
  const mutation = useMutation({
    mutationFn: async (action: string) => {
      if (action === "delete") {
        await api("/snippets/" + id, { method: "DELETE" });
        nav("/snippets");
      } else {
        await api(
          "/snippets/" + id + "/" + action,
          json(
            "PUT",
            action === "share"
              ? { isPublic: !q.data?.isPublic }
              : { isFavorite: !q.data?.isFavorite },
          ),
        );
      }
    },
    onSuccess: () => cache.invalidateQueries(),
    onError: (e) => setError(errorMessage(e)),
  });
  async function copy(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setNotice("Copied to clipboard.");
    } catch {
      setError(
        "Clipboard access was blocked. Select the code to copy it manually.",
      );
    }
  }
  if (q.isPending) return <Loading />;
  if (q.error)
    return (
      <ErrorBox
        message={errorMessage(q.error)}
        retry={() => void q.refetch()}
      />
    );
  const s = q.data;
  return (
    <>
      <Link className="back-link" to="/snippets">
        <ArrowLeft size={14} /> All snippets
      </Link>
      <Heading
        title={s.title}
        description={s.description}
        action={
          <div className="actions">
            <Button
              secondary
              onClick={() => mutation.mutate("favorite")}
              disabled={mutation.isPending}
            >
              <Star size={15} fill={s.isFavorite ? "currentColor" : "none"} />
              {s.isFavorite ? "Favorited" : "Favorite"}
            </Button>
            <Link className="button" to={"/snippets/" + id + "/edit"}>
              Edit snippet
            </Link>
          </div>
        }
      />
      <div className="detail-meta">
        <span className="language">{s.language}</span>
        <span>{s.category || "Uncategorized"}</span>
        <span>Updated {localDate(s.updatedAt)}</span>
        {s.groups.map((g) => (
          <Link key={g.id} to={"/snippets?group=" + g.id}>
            #{g.name}
          </Link>
        ))}
      </div>
      {error && <ErrorBox message={error} />}{" "}
      {notice && <Notice>{notice}</Notice>}
      <section className="editor-panel">
        <div className="editor-toolbar">
          <span>
            {s.language} <small>/ READ ONLY</small>
          </span>
          <Button secondary onClick={() => void copy(s.code || "")}>
            <Copy size={14} />
            Copy code
          </Button>
        </div>
        <Suspense fallback={<Loading />}>
          <CodeEditor
            value={s.code || ""}
            language={s.monacoId}
            readOnly
            fontSize={user?.fontSize}
            wordWrap={user?.wordWrap}
          />
        </Suspense>
      </section>
      <section className="share-section">
        <div>
          <h2>Share on your terms.</h2>
          <p>
            {s.isPublic
              ? "Anyone with this link can read this snippet. Disable sharing to revoke access."
              : "This snippet is private. Create a public link only if the code is safe to share."}
          </p>
          {s.publicSlug && (
            <Link className="public-link" to={"/share/" + s.publicSlug}>
              {isPublicDemo ? location.origin + location.pathname + "#/share/" + s.publicSlug : location.origin + "/share/" + s.publicSlug}
            </Link>
          )}
        </div>
        <div className="actions">
          <Button
            secondary
            disabled={mutation.isPending}
            onClick={() => mutation.mutate("share")}
          >
            <Share2 size={15} />
            {s.isPublic ? "Disable link" : "Create public link"}
          </Button>
          {s.publicSlug && (
            <Button
              secondary
              onClick={() =>
                void copy(isPublicDemo ? location.origin + location.pathname + "#/share/" + s.publicSlug : location.origin + "/share/" + s.publicSlug)
              }
            >
              Copy link
            </Button>
          )}
          <Button
            secondary
            className="danger-text"
            onClick={() => setRemove(true)}
          >
            <Trash2 size={15} />
            Delete
          </Button>
        </div>
      </section>
      {remove && (
        <Confirm
          title="Delete this snippet?"
          description="The code and its public link will be permanently removed. This cannot be undone."
          busy={mutation.isPending}
          onCancel={() => setRemove(false)}
          onConfirm={() => mutation.mutate("delete")}
        />
      )}
    </>
  );
}
