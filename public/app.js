const keyForm = document.querySelector("[data-create-key-form]");
const keyResult = document.querySelector("[data-key-result]");

if (keyForm && keyResult) {
  keyForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(keyForm);
    keyResult.hidden = false;
    keyResult.textContent = "Generating key...";

    try {
      const response = await fetch("/v1/api-keys", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: formData.get("email"),
          name: formData.get("name"),
          keyName: formData.get("keyName") || "Demo key"
        })
      });
      const payload = await response.json();

      if (!response.ok) {
        keyResult.textContent = payload.message || "Key creation failed.";
        return;
      }

      keyResult.innerHTML = `<strong>Save this key now:</strong><pre><code>${payload.api_key}</code></pre><p>Prefix stored: ${payload.key.keyPrefix}</p>`;
    } catch {
      keyResult.textContent = "Key creation failed because the API could not be reached.";
    }
  });
}

const usageForm = document.querySelector("[data-usage-form]");
const usageResult = document.querySelector("[data-usage-result]");

if (usageForm && usageResult) {
  usageForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(usageForm);
    usageResult.hidden = false;
    usageResult.textContent = "Loading usage...";

    try {
      const response = await fetch("/v1/me/usage", {
        headers: { "x-api-key": String(formData.get("apiKey") || "") }
      });
      const payload = await response.json();
      usageResult.innerHTML = `<pre><code>${JSON.stringify(payload, null, 2)}</code></pre>`;
    } catch {
      usageResult.textContent = "Usage could not be loaded.";
    }
  });
}

const statusButton = document.querySelector("[data-status-button]");
const statusResult = document.querySelector("[data-status-result]");

async function loadStatus() {
  if (!statusResult) {
    return;
  }

  statusResult.textContent = "Loading status...";

  try {
    const response = await fetch("/v1/status");
    const payload = await response.json();
    statusResult.innerHTML = `<pre><code>${JSON.stringify(payload, null, 2)}</code></pre>`;
  } catch {
    statusResult.textContent = "Status could not be loaded.";
  }
}

if (statusButton) {
  statusButton.addEventListener("click", loadStatus);
  loadStatus();
}
