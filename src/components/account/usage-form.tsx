"use client";

import { useState } from "react";

export function UsageForm() {
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [output, setOutput] = useState<string>("");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setStatus("loading");
    setOutput("");

    try {
      const response = await fetch(`/api/v1/me/usage`, {
        headers: { "x-api-key": String(formData.get("apiKey") || "") },
      });
      const payload = await response.json();
      setStatus("done");
      setOutput(JSON.stringify(payload, null, 2));
    } catch {
      setStatus("error");
      setOutput("Usage could not be loaded.");
    }
  }

  return (
    <>
      <form className="form inline" onSubmit={onSubmit}>
        <label>
          API key
          <input name="apiKey" type="password" placeholder="ibs_test_..." required />
        </label>
        <button className="button" type="submit" disabled={status === "loading"}>
          {status === "loading" ? "Loading usage..." : "Load usage"}
        </button>
      </form>

      {status === "loading" ? <div className="result">Loading usage...</div> : null}
      {status === "error" ? <div className="result">{output}</div> : null}
      {status === "done" ? (
        <div className="result">
          <pre>
            <code>{output}</code>
          </pre>
        </div>
      ) : null}
    </>
  );
}
