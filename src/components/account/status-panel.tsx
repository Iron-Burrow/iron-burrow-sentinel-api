"use client";

import { useEffect, useState } from "react";

type StatusResult = { output: string; isJson: boolean };

async function loadStatusResult(): Promise<StatusResult> {
  try {
    const response = await fetch(`/api/v1/status`);
    const payload = await response.json();
    return { output: JSON.stringify(payload, null, 2), isJson: true };
  } catch {
    return { output: "Status could not be loaded.", isJson: false };
  }
}

export function StatusPanel() {
  const [output, setOutput] = useState<string>("Loading status...");
  const [isJson, setIsJson] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  // Auto-load once on mount.
  useEffect(() => {
    let active = true;
    loadStatusResult().then((res) => {
      if (!active) return;
      setOutput(res.output);
      setIsJson(res.isJson);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  async function onRefresh() {
    setLoading(true);
    setOutput("Loading status...");
    setIsJson(false);
    const res = await loadStatusResult();
    setOutput(res.output);
    setIsJson(res.isJson);
    setLoading(false);
  }

  return (
    <>
      <button className="button" type="button" onClick={() => void onRefresh()} disabled={loading}>
        Refresh status
      </button>
      <div className="result">
        {isJson ? (
          <pre>
            <code>{output}</code>
          </pre>
        ) : (
          output
        )}
      </div>
    </>
  );
}
