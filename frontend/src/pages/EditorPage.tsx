import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { useAuth } from "../auth";
import { ErrorBox, Loading } from "../components/ui";
import { useData } from "../hooks/useData";
import { api, errorMessage } from "../lib/api";
import type { Group, Language, Snippet } from "../lib/types";
import { EditorForm } from "../pages/EditorForm";
export function EditorPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const q = useQuery({
    queryKey: ["snippet", "/snippets/" + id],
    queryFn: () => api<Snippet>("/snippets/" + id),
    enabled: !!id,
  });
  const langs = useData<Language[]>("languages", "/languages");
  const cats = useData<Group[]>("category", "/groups/category");
  const tags = useData<Group[]>("tag", "/groups/tag");
  const collections = useData<Group[]>("collections", "/groups/collection");
  if (id && q.isPending) return <Loading />;
  if (q.error) return <ErrorBox message={errorMessage(q.error)} />;
  return (
    <EditorForm
      key={q.data?.id || "new"}
      snippet={q.data}
      languages={langs.data || []}
      categories={cats.data || []}
      groups={[...(tags.data || []), ...(collections.data || [])]}
      defaultLanguage={user?.defaultLanguage || "typescript"}
    />
  );
}
