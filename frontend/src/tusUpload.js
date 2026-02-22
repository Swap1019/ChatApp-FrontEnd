import * as tus from "tus-js-client";

export function uploadWithTus(file, { onProgress, onSuccess, onError }) {
  const endpoint = import.meta.env.VITE_TUS_ENDPOINT;

  const upload = new tus.Upload(file, {
    endpoint,
    retryDelays: [0, 1000, 3000, 5000],
    metadata: {
      filename: file.name,
      filetype: file.type || "application/octet-stream",
    },
    onError: (err) => onError?.(err),
    onProgress: (uploaded, total) => {
      const percent = Math.round((uploaded / total) * 100);
      onProgress?.({ uploaded, total, percent });
    },
    onSuccess: () => {
      // URL to uploaded file resource on tus server:
      onSuccess?.({ uploadUrl: upload.url });
    },
  });

  upload.findPreviousUploads().then((previous) => {
    if (previous.length) upload.resumeFromPreviousUpload(previous[0]);
    upload.start();
  });

  return upload; // so you can abort/pause if needed
}
