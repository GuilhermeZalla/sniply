import { lazy, Suspense } from "react";
import { useParams } from "react-router-dom";
import { Brand, ErrorBox, Heading, Loading } from "../components/ui";
import { useData } from "../hooks/useData";
const CodeEditor = lazy(() => import("../components/CodeEditor"));
export function PublicPage() {
  const { slug } = useParams();
  const q = useData<{
    title: string;
    description: string;
    code: string;
    language: string;
    monacoId: string;
  }>("public", "/public/" + slug);
  return (
    <div className="public-page">
      <Brand />
      <p className="eyebrow">SHARED SNIPPET / READ ONLY</p>
      {q.isPending ? (
        <Loading />
      ) : q.error ? (
        <ErrorBox message="This link is unavailable. The owner may have disabled sharing." />
      ) : (
        <>
          <Heading title={q.data.title} description={q.data.description} />
          <section className="editor-panel">
            <div className="editor-toolbar">{q.data.language}</div>
            <Suspense fallback={<Loading />}>
              <CodeEditor
                value={q.data.code}
                language={q.data.monacoId}
                readOnly
              />
            </Suspense>
          </section>
        </>
      )}
      <p className="muted">
        Code is displayed as text, never executed. Review it before using it.
      </p>
    </div>
  );
}
