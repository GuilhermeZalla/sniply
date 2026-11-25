import { AlertCircle, Code2, RefreshCw } from "lucide-react";
import {
  useEffect,
  useRef,
  type ButtonHTMLAttributes,
  type ReactNode,
} from "react";
import { Link } from "react-router-dom";
export function Brand() {
  return (
    <Link className="brand" to="/">
      <span aria-hidden="true" className="brand-mark">
        <Code2 size={21} />
      </span>
      <span>
        sniply
      </span>
    </Link>
  );
}
export function Button({
  className = "",
  secondary = false,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { secondary?: boolean }) {
  return (
    <button
      type="button"
      className={"button " + (secondary ? "secondary " : "") + className}
      {...props}
    />
  );
}
export function Heading({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <header className="page-heading">
      <div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {action}
    </header>
  );
}
export function Loading() {
  return (
    <div className="loading" role="status">
      <span className="skeleton" />
      <span className="skeleton" />
      <span className="skeleton" />
      <p>Loading your library…</p>
    </div>
  );
}
export function ErrorBox({
  message,
  retry,
}: {
  message: string;
  retry?: () => void;
}) {
  return (
    <div className="error" role="alert">
      <AlertCircle size={18} />
      <p>{message}</p>
      {retry && (
        <button onClick={retry}>
          <RefreshCw size={14} /> Try again
        </button>
      )}
    </div>
  );
}
export function Empty({
  title = "Your library is waiting.",
  text = "Save your first code snippet and keep useful code within reach.",
  to = "/snippets/new",
  label = "Create your first snippet",
}: {
  title?: string;
  text?: string;
  to?: string;
  label?: string;
}) {
  return (
    <div className="empty">
      <Code2 size={25} />
      <h2>{title}</h2>
      <p>{text}</p>
      <Link className="button" to={to}>
        {label}
      </Link>
    </div>
  );
}
export function Notice({ children }: { children: ReactNode }) {
  return (
    <p className="notice" role="status">
      {children}
    </p>
  );
}
export function Confirm({
  title,
  description,
  busy,
  onCancel,
  onConfirm,
}: {
  title: string;
  description: string;
  busy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const el = ref.current;
    el?.showModal();
    return () => el?.close();
  }, []);
  return (
    <dialog
      ref={ref}
      className="confirm"
      onCancel={(e) => {
        e.preventDefault();
        if (!busy) onCancel();
      }}
      aria-labelledby="confirm-title"
      aria-describedby="confirm-body"
    >
      <h2 id="confirm-title">{title}</h2>
      <p id="confirm-body">{description}</p>
      <div className="actions">
        <Button secondary autoFocus disabled={busy} onClick={onCancel}>
          Cancel
        </Button>
        <Button className="danger" disabled={busy} onClick={onConfirm}>
          {busy ? "Removing..." : "Delete"}
        </Button>
      </div>
    </dialog>
  );
}
