import { Link } from "react-router-dom";
import { useAuth } from "../auth";
import { SnippetRows } from "../components/SnippetRows";
import { Empty, ErrorBox, Heading, Loading } from "../components/ui";
import { useData } from "../hooks/useData";
import { errorMessage } from "../lib/api";
import type { Overview } from "../lib/types";
export function Dashboard() {
  const { user } = useAuth();
  const q = useData<Overview>("overview", "/overview");
  if (q.isPending) return <Loading />;
  if (q.error)
    return (
      <ErrorBox
        message={errorMessage(q.error)}
        retry={() => void q.refetch()}
      />
    );
  const d = q.data;
  return (
    <>
      <div className="dashboard-intro">
        <div>
          <p className="eyebrow">SNIPLY / OVERVIEW</p>
          <Heading
            title="Your code library"
            description={"Welcome back, " + user?.name.split(" ")[0] + ". Find what you need and keep building."}
          />
        </div>
        {d.recent[0] && (
          <Link className="resume-snippet" to={"/snippets/" + d.recent[0].id}>
            <span>RECENTLY UPDATED / {d.recent[0].language}</span>
            <strong>{d.recent[0].title}</strong>
            <small>{d.recent[0].description || "Open this snippet to view the code."}</small>
            <span className="resume-action">Open snippet →</span>
          </Link>
        )}
      </div>
      <div className="stats" aria-label="Library totals">
        {[
          ["Saved snippets", d.total],
          ["Favorites", d.favorites],
          ["Collections", d.collections],
        ].map(([name, count]) => (
          <div key={String(name)}>
            <span>{String(name)}</span>
            <strong>{String(count)}</strong>
          </div>
        ))}
      </div>
      <div className="overview-grid">
        <section className="panel">
          <div className="section-heading">
            <h2>Recently updated</h2>
            <Link to="/snippets">
              View all <span aria-hidden="true">→</span>
            </Link>
          </div>
          {d.recent.length ? <SnippetRows items={d.recent} /> : <Empty />}
        </section>
        <aside className="overview-side">
          <section className="panel">
            <p className="eyebrow">AT A GLANCE</p>
            <h2>Your languages</h2>
            {d.languages.length ? (
              d.languages.map((l) => (
                <div className="distribution" key={l.id}>
                  <div>
                    <span>{l.name}</span>
                    <strong>{l.count}</strong>
                  </div>
                  <meter
                    aria-label={l.name + " snippets"}
                    min={0}
                    max={d.total}
                    value={l.count}
                  >
                    {l.count}
                  </meter>
                </div>
              ))
            ) : (
              <p className="muted">
                Languages appear when you save your first snippet.
              </p>
            )}
          </section>
        </aside>
      </div>
    </>
  );
}
