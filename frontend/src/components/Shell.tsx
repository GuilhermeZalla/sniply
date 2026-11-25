import {
  ChevronRight,
  Code2,
  Folder,
  Hash,
  LayoutDashboard,
  LogOut,
  Menu,
  Plus,
  Search,
  Settings,
  Star,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  Link,
  Navigate,
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { useAuth } from "../auth";
import { Brand, Loading } from "../components/ui";
import { initials } from "../lib/library";
import { isPublicDemo } from "../lib/demo";
export function Shell() {
  const { user, loading, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const [mobile, setMobile] = useState(
    () => window.matchMedia("(max-width:650px)").matches,
  );
  const drawer = useRef<HTMLElement>(null);
  useEffect(() => {
    const media = window.matchMedia("(max-width:650px)");
    const update = () => setMobile(media.matches);
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  useEffect(() => {
    if (!mobile || !open) return;
    const previous = document.activeElement as HTMLElement;
    drawer.current
      ?.querySelector<HTMLButtonElement>(".mobile-nav-close")
      ?.focus();
    return () => previous?.focus();
  }, [mobile, open]);
  const nav = useNavigate();
  const loc = useLocation();
  const hasPageSearch = loc.pathname === "/snippets" || loc.pathname === "/favorites";
  if (loading) return <Loading />;
  if (!user)
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: loc.pathname + loc.search }}
      />
    );
  const items = [
    ["/", "Overview", LayoutDashboard],
    ["/snippets", "All snippets", Code2],
    ["/favorites", "Favorites", Star],
    ["/collections", "Collections", Folder],
    ["/tags", "Tags", Hash],
    ["/settings", "Settings", Settings],
  ] as const;
  return (
    <div className="workspace">
      <aside
        ref={drawer}
        className={open ? "sidebar open" : "sidebar"}
        inert={mobile && !open}
        role={mobile ? "dialog" : undefined}
        aria-modal={mobile && open ? true : undefined}
        aria-label={mobile ? "Navigation" : undefined}
        onKeyDown={(e) => {
          if (e.key === "Escape") setOpen(false);
          if (e.key === "Tab" && mobile && open) {
            const nodes = drawer.current?.querySelectorAll<HTMLElement>(
              "a[href],button:not([disabled])",
            );
            if (!nodes?.length) return;
            const first = nodes[0],
              last = nodes[nodes.length - 1];
            if (e.shiftKey && document.activeElement === first) {
              e.preventDefault();
              last.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
              e.preventDefault();
              first.focus();
            }
          }
        }}
      >
        <button className="mobile-nav-close" onClick={() => setOpen(false)}>
          Close
        </button>
        <Brand />
        <p className="eyebrow nav-label">YOUR LIBRARY</p>
        <nav aria-label="Main navigation">
          {items.map(([to, label, Icon]) => (
            <NavLink key={to} to={to} end onClick={() => setOpen(false)}>
              <Icon size={17} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <span className="avatar">{initials(user.name)}</span>
          <div>
            <strong>{user.name}</strong>
            <small>Code library</small>
          </div>
          {!isPublicDemo && <button
            aria-label="Sign out"
            onClick={() => void signOut().catch(() => {})}
          >
            <LogOut size={17} />
          </button>}
        </div>
      </aside>
      {open && (
        <button
          className="scrim"
          aria-label="Close navigation"
          onClick={() => setOpen(false)}
        />
      )}
      <div className="main">
        <header className="topbar">
          <button
            className="mobile-toggle"
            aria-label="Toggle navigation"
            aria-expanded={open}
            onClick={() => setOpen(!open)}
          >
            <Menu size={20} />
          </button>
          <span className="breadcrumb">
            Workspace <ChevronRight size={13} />{" "}
            {loc.pathname === "/" ? "Overview" : loc.pathname.split("/")[1]}
          </span>
          {!hasPageSearch && <form
            className="global-search"
            onSubmit={(e) => {
              e.preventDefault();
              nav(
                "/snippets?search=" +
                  encodeURIComponent(
                    String(new FormData(e.currentTarget).get("search") || ""),
                  ),
              );
            }}
          >
            <Search size={15} />
            <input
              name="search"
              aria-label="Search snippets"
              placeholder="Search your snippets..."
            />
          </form>}
          {!hasPageSearch && <Link className="button compact" to="/snippets/new">
            <Plus size={15} />
            <span>New snippet</span>
          </Link>}
        </header>
        {isPublicDemo && <div className="demo-notice" role="status">PUBLIC DEMO <span>Sample data is saved only in this browser.</span></div>}
        <main id="main-content" className="content">
          <Outlet />
        </main>
        <footer className="workspace-footer">
          SNIPLY / PERSONAL CODE LIBRARY
        </footer>
      </div>
    </div>
  );
}
