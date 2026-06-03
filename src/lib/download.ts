/** Trigger a browser download for a Blob with a clean filename. */
export function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Small delay so Safari has time to start the download
  setTimeout(() => URL.revokeObjectURL(url), 200);
}

/** Build a clean filename: IUSTA_Report_{Slug}_{YYYY-MM-DD}.{ext} */
export function buildReportFilename(
  titoloPratica: string | undefined | null,
  ext: "pdf" | "docx" | "zip",
  prefix = "IUSTA_Report",
) {
  const slug = (titoloPratica || "Pratica")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 60) || "Pratica";
  const date = new Date().toISOString().slice(0, 10);
  return `${prefix}_${slug}_${date}.${ext}`;
}
