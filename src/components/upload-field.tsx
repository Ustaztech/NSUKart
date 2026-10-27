"use client";
import { useState } from "react";
export function UploadField() {
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState("");
  return (
    <div>
      <label>
        Product image
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            setStatus("Uploading…");
            try {
              const form = new FormData();
              form.set("file", file);
              const response = await fetch("/api/uploads", {
                method: "POST",
                body: form,
              });
              const data = await response.json();
              if (!response.ok) throw new Error(data.error);
              setUrl(data.url);
              setStatus("Image uploaded.");
            } catch (error) {
              setStatus(
                error instanceof Error ? error.message : "Upload failed",
              );
            }
          }}
        />
      </label>
      <p role="status">{status}</p>
      <input type="hidden" name="image_url" value={url} />
    </div>
  );
}
