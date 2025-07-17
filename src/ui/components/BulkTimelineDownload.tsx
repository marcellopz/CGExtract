import { useState } from "react";
import "./BulkTimelineDownload.css";

interface UploadedFile {
  name: string;
  gameId: number | null;
  status: "pending" | "processing" | "ready" | "error";
  error?: string;
  timelineData?: unknown;
  retryCount?: number;
}

export function BulkTimelineDownload() {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const filePromises = Array.from(files).map(async (file) => {
      try {
        const text = await file.text();
        const jsonData = JSON.parse(text);

        // Try to extract gameId from different possible locations
        const gameId =
          jsonData.gameId ||
          jsonData.extendedMatchData?.gameId ||
          jsonData.metadata?.gameId ||
          null;

        return {
          name: file.name,
          gameId: typeof gameId === "number" ? gameId : null,
          status: "pending" as const,
          retryCount: 0,
        };
      } catch {
        return {
          name: file.name,
          gameId: null,
          status: "error" as const,
          error: "Invalid JSON file",
          retryCount: 0,
        };
      }
    });

    Promise.all(filePromises).then((files) => {
      setUploadedFiles(files);
    });

    // Reset the input
    event.target.value = "";
  };

  const fetchTimelineData = async (gameId: number) => {
    try {
      const timelineData = await window.electron.getGameTimeline(gameId);
      return timelineData;
    } catch (error) {
      console.error(`Failed to fetch timeline for gameId ${gameId}:`, error);
      throw error;
    }
  };

  const downloadTimelineFile = (
    timelineData: unknown,
    gameId: number,
    fileName: string
  ) => {
    const dataStr = JSON.stringify(timelineData, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });

    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `timeline-${gameId}-${fileName.replace(".json", "")}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const retryFetchTimeline = async (fileName: string, gameId: number) => {
    // Update status to processing
    setUploadedFiles((prev) =>
      prev.map((f) =>
        f.name === fileName ? { ...f, status: "processing" } : f
      )
    );

    try {
      const timelineData = await fetchTimelineData(gameId);

      // Update status to ready with timeline data
      setUploadedFiles((prev) =>
        prev.map((f) =>
          f.name === fileName ? { ...f, status: "ready", timelineData } : f
        )
      );
    } catch {
      // Update status to error and increment retry count
      setUploadedFiles((prev) =>
        prev.map((f) =>
          f.name === fileName
            ? {
                ...f,
                status: "error",
                error: "Failed to fetch timeline",
                retryCount: (f.retryCount || 0) + 1,
              }
            : f
        )
      );
    }
  };

  const fetchAllTimelines = async () => {
    setIsProcessing(true);

    const validFiles = uploadedFiles.filter(
      (file) => file.gameId !== null && file.status === "pending"
    );

    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i];

      // Update status to processing
      setUploadedFiles((prev) =>
        prev.map((f) =>
          f.name === file.name ? { ...f, status: "processing" } : f
        )
      );

      try {
        const timelineData = await fetchTimelineData(file.gameId!);

        // Update status to ready with timeline data
        setUploadedFiles((prev) =>
          prev.map((f) =>
            f.name === file.name ? { ...f, status: "ready", timelineData } : f
          )
        );

        // Small delay to avoid overwhelming the API
        if (i < validFiles.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      } catch {
        // Update status to error
        setUploadedFiles((prev) =>
          prev.map((f) =>
            f.name === file.name
              ? {
                  ...f,
                  status: "error",
                  error: "Failed to fetch timeline",
                  retryCount: (f.retryCount || 0) + 1,
                }
              : f
          )
        );
      }
    }

    setIsProcessing(false);
  };

  const clearFiles = () => {
    setUploadedFiles([]);
  };

  const validFiles = uploadedFiles.filter((file) => file.gameId !== null);
  const invalidFiles = uploadedFiles.filter((file) => file.gameId === null);
  const pendingFiles = validFiles.filter((file) => file.status === "pending");

  return (
    <div className="bulk-timeline-download">
      <h2>Bulk Timeline Download</h2>
      <p>
        Upload match detail JSON files to automatically download their game
        timelines.
      </p>

      <div className="upload-section">
        <input
          type="file"
          multiple
          accept=".json"
          onChange={handleFileUpload}
          disabled={isProcessing}
          id="file-upload"
        />
        <label htmlFor="file-upload" className="upload-button">
          📁 Select JSON Files
        </label>
      </div>

      {uploadedFiles.length > 0 && (
        <div className="file-summary">
          <div className="summary-stats">
            <span>Total files: {uploadedFiles.length}</span>
            <span>Valid: {validFiles.length}</span>
            <span>Invalid: {invalidFiles.length}</span>
          </div>

          <div className="action-buttons">
            <button
              onClick={fetchAllTimelines}
              disabled={isProcessing || pendingFiles.length === 0}
              className="process-button"
            >
              {isProcessing
                ? "Fetching..."
                : `Fetch ${pendingFiles.length} Timelines`}
            </button>
            <button
              onClick={clearFiles}
              disabled={isProcessing}
              className="clear-button"
            >
              Clear All
            </button>
          </div>
        </div>
      )}

      {uploadedFiles.length > 0 && (
        <div className="file-list">
          <h3>Uploaded Files</h3>
          {uploadedFiles.map((file, index) => (
            <div key={index} className={`file-item ${file.status}`}>
              <div className="file-info">
                <span className="file-name">{file.name}</span>
                <span className="game-id">
                  {file.gameId ? `Game ID: ${file.gameId}` : "No Game ID found"}
                </span>
              </div>
              <div className="file-status">
                {file.status === "pending" && "⏳"}
                {file.status === "processing" && "🔄"}
                {file.status === "ready" && "✅"}
                {file.status === "error" && "❌"}
                <span className="status-text">{file.status}</span>
                {file.error && (
                  <span className="error-text">
                    {file.error}
                    {file.retryCount &&
                      file.retryCount > 0 &&
                      ` (Attempt ${file.retryCount + 1})`}
                  </span>
                )}
                {file.status === "ready" && file.timelineData && (
                  <button
                    className="download-file-btn"
                    onClick={() =>
                      downloadTimelineFile(
                        file.timelineData!,
                        file.gameId!,
                        file.name
                      )
                    }
                    title="Download timeline"
                  >
                    📥
                  </button>
                )}
                {file.status === "error" && file.gameId && (
                  <button
                    className="retry-btn"
                    onClick={() => retryFetchTimeline(file.name, file.gameId!)}
                    disabled={isProcessing}
                    title="Retry fetching timeline"
                  >
                    🔄 Retry
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
