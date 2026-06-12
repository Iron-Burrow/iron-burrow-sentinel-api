"use client";

import { useState } from "react";

interface KeyResult {
  ok: boolean;
  message?: string;
  api_key?: string;
  key?: { keyPrefix?: string };
}

export function ApiKeyForm() {
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [result, setResult] = useState<KeyResult | null>(null);
  const [errorText, setErrorText] = useState<string>("");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setStatus("loading");
    setResult(null);
    setErrorText("");

    try {
      const response = await fetch(`/api/v1/api-keys`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: formData.get("email"),
          name: formData.get("name"),
          keyName: formData.get("keyName") || "Demo key",
        }),
      });
      const payload: KeyResult = await response.json();

      if (!response.ok) {
        setStatus("error");
        setErrorText(payload.message || "Key creation failed.");
        return;
      }

      setStatus("done");
      setResult(payload);
    } catch {
      setStatus("error");
      setErrorText("Key creation failed because the API could not be reached.");
    }
  }

  return (
    <>
      <form className="form" onSubmit={onSubmit}>
        <label>
          Email
          <input name="email" type="email" placeholder="builder@example.com" required />
        </label>
        <label>
          Name
          <input name="name" type="text" placeholder="Hackathon Builder" required />
        </label>
        <label>
          Key name
          <input name="keyName" type="text" placeholder="Demo key" />
        </label>
        <button className="button" type="submit" disabled={status === "loading"}>
          {status === "loading" ? "Generating key..." : "Generate key"}
        </button>
      </form>

      {status === "loading" ? <div className="result">Generating key...</div> : null}
      {status === "error" ? <div className="result">{errorText}</div> : null}
      {status === "done" && result?.api_key ? (
        <div className="result">
          <strong>Save this key now:</strong>
          <pre>
            <code>{result.api_key}</code>
          </pre>
          <p>Prefix stored: {result.key?.keyPrefix}</p>
        </div>
      ) : null}
    </>
  );
}
