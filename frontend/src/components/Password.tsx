import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
export function Password({
  name = "password",
  label = "Password",
  minLength = 10,
}: {
  name?: string;
  label?: string;
  minLength?: number;
}) {
  const [show, setShow] = useState(false);
  return (
    <label>
      {label}
      <span className="password-field">
        <input
          name={name}
          required
          minLength={minLength}
          maxLength={128}
          type={show ? "text" : "password"}
          autoComplete={
            name === "currentPassword" || minLength === 1
              ? "current-password"
              : "new-password"
          }
        />
        <button
          type="button"
          onClick={() => setShow(!show)}
          aria-label={show ? "Hide password" : "Show password"}
        >
          {show ? <EyeOff size={17} /> : <Eye size={17} />}
        </button>
      </span>
    </label>
  );
}
