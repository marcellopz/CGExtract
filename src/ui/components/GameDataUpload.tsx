import { useState } from "react";
import "./GameDataUpload.css";
import { RoleAssignmentDialog } from "./RoleAssignmentDialog";
import { uploadFile } from "../service/uploadFile";
import { useAuth } from "../hooks/useAuth";

import { type RoleAssignments } from "../../../gameTypes";

interface UploadedGameFile {
  name: string;
  type: "gameDetails" | "timeline" | "unknown";
  gameId: number | null;
  status: "pending" | "validating" | "ready" | "error";
  error?: string;
  size: string;
  data?: unknown;
  roleAssignments?: RoleAssignments;
}

export function GameDataUpload() {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedGameFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [selectedFileIndex, setSelectedFileIndex] = useState<number | null>(
    null
  );
  const [isUploading, setIsUploading] = useState(false);
  const { user } = useAuth();

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const detectFileType = (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: any,
    fileName: string
  ): "gameDetails" | "timeline" | "unknown" => {
    // Basic detection logic - you can enhance this based on your data structure
    if (fileName.toLowerCase().includes("timeline")) return "timeline";
    if (
      fileName.toLowerCase().includes("details") ||
      fileName.toLowerCase().includes("game")
    )
      return "gameDetails";

    // Check data structure
    if (data.frames && Array.isArray(data.frames)) return "timeline";
    if (data.gameId && data.participants) return "gameDetails";

    return "unknown";
  };

  const handleFileUpload = (files: FileList | null) => {
    if (!files) return;

    setIsProcessing(true);

    const filePromises = Array.from(files).map(async (file) => {
      try {
        const text = await file.text();
        const jsonData = JSON.parse(text);

        // Detect file type based on content and name
        const fileType = detectFileType(jsonData, file.name);

        // Extract gameId from various possible locations
        let gameId =
          jsonData.gameId ||
          jsonData.metadata?.gameId ||
          jsonData.extendedMatchData?.gameId ||
          jsonData.gameInfo?.gameId ||
          null;

        // If no gameId found in JSON data, try to extract from filename (timeline-<number>)
        if (!gameId) {
          const timelineMatch = file.name.match(/timeline-(\d+)/);
          if (timelineMatch) {
            gameId = parseInt(timelineMatch[1]);
          }
        }

        return {
          name: file.name,
          type: fileType,
          gameId: typeof gameId === "number" ? gameId : null,
          status: "ready" as const,
          size: formatFileSize(file.size),
          data: jsonData,
        };
      } catch (error) {
        console.error("Error parsing file:", error);
        return {
          name: file.name,
          type: "unknown" as const,
          gameId: null,
          status: "error" as const,
          error: "Invalid JSON file or parsing failed",
          size: formatFileSize(file.size),
        };
      }
    });

    Promise.all(filePromises).then((files) => {
      setUploadedFiles((prev) => [...prev, ...files]);
      setIsProcessing(false);
    });
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    handleFileUpload(event.target.files);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files);
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const clearAllFiles = () => {
    setUploadedFiles([]);
  };

  const openRoleDialog = (fileIndex: number) => {
    setSelectedFileIndex(fileIndex);
    setRoleDialogOpen(true);
  };

  const closeRoleDialog = () => {
    setRoleDialogOpen(false);
    setSelectedFileIndex(null);
  };

  const saveRoleAssignments = (roleAssignments: RoleAssignments) => {
    if (selectedFileIndex !== null) {
      // Transform role assignments to use summonerId instead of participantId
      const transformedAssignments = transformRoleAssignments(
        roleAssignments,
        uploadedFiles[selectedFileIndex]?.data
      );

      setUploadedFiles((prev) =>
        prev.map((file, index) =>
          index === selectedFileIndex
            ? { ...file, roleAssignments: transformedAssignments }
            : file
        )
      );
    }
  };

  const transformRoleAssignments = (
    roleAssignments: RoleAssignments,
    gameData: unknown
  ): RoleAssignments => {
    try {
      const data = gameData as Record<string, unknown>;

      // Check if we have participantIdentities to map participantId to summonerId
      if (
        !data?.participantIdentities ||
        !Array.isArray(data.participantIdentities)
      ) {
        console.warn(
          "No participantIdentities found, returning original assignments"
        );
        return roleAssignments;
      }

      const participantIdentities = data.participantIdentities as unknown[];
      const transformedAssignments: RoleAssignments = {};

      // Map each participantId to summonerId
      Object.entries(roleAssignments).forEach(([participantIdStr, role]) => {
        const participantId = parseInt(participantIdStr);

        // Find the corresponding participant identity
        const participantIdentity = participantIdentities.find(
          (identity: unknown) => {
            const id = identity as Record<string, unknown>;
            return id.participantId === participantId;
          }
        ) as Record<string, unknown> | undefined;

        const player = participantIdentity?.player as
          | Record<string, unknown>
          | undefined;
        const summonerId = player?.summonerId as number | undefined;

        if (summonerId) {
          transformedAssignments[summonerId] = role;
        } else {
          console.warn(
            `Could not find summonerId for participantId ${participantId}`
          );
          // Fallback: keep the original participantId as key
          transformedAssignments[participantId] = role;
        }
      });

      return transformedAssignments;
    } catch (error) {
      console.error("Error transforming role assignments:", error);
      return roleAssignments; // Return original if transformation fails
    }
  };

  const hasRoleAssignments = (file: UploadedGameFile) => {
    return file.roleAssignments && Object.keys(file.roleAssignments).length > 0;
  };

  const handleUploadFiles = async () => {
    if (!user) {
      alert("Please sign in to upload files");
      return;
    }

    const filesToUpload = readyFiles.filter(
      (file) => file.type !== "gameDetails" || hasRoleAssignments(file)
    );

    if (filesToUpload.length === 0) {
      alert("Please assign roles to all game details files before uploading");
      return;
    }

    setIsUploading(true);

    try {
      for (const file of filesToUpload) {
        // Update file status to uploading
        setUploadedFiles((prev) =>
          prev.map((f) =>
            f.name === file.name ? { ...f, status: "pending" as const } : f
          )
        );

        // Upload file using the upload service
        await uploadFile({
          type: file.type,
          gameId: file.gameId,
          data: file.data,
          roleAssignments: file.roleAssignments,
        });

        // Update file status to completed
        setUploadedFiles((prev) =>
          prev.map((f) =>
            f.name === file.name ? { ...f, status: "ready" as const } : f
          )
        );
      }

      alert(`Successfully uploaded ${filesToUpload.length} files!`);
    } catch (error) {
      console.error("Upload error:", error);
      alert("Failed to upload files. Please try again.");

      // Reset file statuses on error
      setUploadedFiles((prev) =>
        prev.map((f) =>
          filesToUpload.some((upload) => upload.name === f.name)
            ? { ...f, status: "ready" as const }
            : f
        )
      );
    } finally {
      setIsUploading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "ready":
        return "✅";
      case "error":
        return "❌";
      case "pending":
      case "validating":
        return "⏳";
      default:
        return "📄";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "gameDetails":
        return "🎮";
      case "timeline":
        return "📊";
      default:
        return "❓";
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "gameDetails":
        return "Game Details";
      case "timeline":
        return "Timeline";
      default:
        return "Unknown";
    }
  };

  const readyFiles = uploadedFiles.filter((f) => f.status === "ready");
  const errorFiles = uploadedFiles.filter((f) => f.status === "error");
  const gameDetailsFiles = readyFiles.filter((f) => f.type === "gameDetails");
  const gameDetailsWithoutRoles = gameDetailsFiles.filter(
    (f) => !hasRoleAssignments(f)
  );
  const uploadableFiles = readyFiles.filter(
    (file) => file.type !== "gameDetails" || hasRoleAssignments(file)
  );

  return (
    <div className="game-data-upload">
      <div className="upload-header">
        <h2>Game Data Upload</h2>
        <p>Upload game details and timeline JSON files for processing</p>
      </div>

      <div
        className={`upload-area ${dragActive ? "drag-active" : ""}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <div className="upload-content">
          <div className="upload-icon">📁</div>
          <h3>Drag & Drop Files Here</h3>
          <p>or</p>
          <label className="upload-button">
            Choose Files
            <input
              type="file"
              multiple
              accept=".json"
              onChange={handleInputChange}
              style={{ display: "none" }}
            />
          </label>
          <p className="upload-hint">
            Accepts JSON files (game details & timelines)
          </p>
        </div>
      </div>

      {isProcessing && (
        <div className="processing-indicator">
          <div className="spinner"></div>
          <span>Processing files...</span>
        </div>
      )}

      {uploadedFiles.length > 0 && (
        <div className="files-section">
          <div className="files-header">
            <h3>Uploaded Files ({uploadedFiles.length})</h3>
            <div className="files-stats">
              <span className="stat ready">✅ Ready: {readyFiles.length}</span>
              <span className="stat error">❌ Errors: {errorFiles.length}</span>
            </div>
            <button onClick={clearAllFiles} className="clear-button">
              Clear All
            </button>
          </div>

          <div className="files-list">
            {uploadedFiles.map((file, index) => (
              <div key={index} className={`file-item ${file.status}`}>
                <div className="file-info">
                  <div className="file-main">
                    <span className="file-status">
                      {getStatusIcon(file.status)}
                    </span>
                    <span className="file-type">{getTypeIcon(file.type)}</span>
                    <span className="file-name">{file.name}</span>
                  </div>
                  <div className="file-details">
                    <span className="file-type-label">
                      {getTypeLabel(file.type)}
                    </span>
                    <span className="file-size">{file.size}</span>
                    {file.gameId && (
                      <span className="game-id">Game ID: {file.gameId}</span>
                    )}
                    {file.type === "gameDetails" &&
                      hasRoleAssignments(file) && (
                        <span className="roles-assigned">
                          ✅ Roles Assigned
                        </span>
                      )}
                  </div>
                  {file.type === "gameDetails" && file.status === "ready" && (
                    <div className="file-actions">
                      <button
                        className="assign-roles-button"
                        onClick={() => openRoleDialog(index)}
                      >
                        {hasRoleAssignments(file)
                          ? "Edit Roles"
                          : "Assign Roles"}
                      </button>
                    </div>
                  )}
                  {file.error && (
                    <div className="file-error">
                      <span className="error-text">{file.error}</span>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => removeFile(index)}
                  className="remove-button"
                  title="Remove file"
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          {readyFiles.length > 0 && (
            <div className="upload-actions">
              <button
                className="upload-button-primary"
                onClick={handleUploadFiles}
                disabled={isUploading || !user || uploadableFiles.length === 0}
              >
                {isUploading
                  ? "Uploading..."
                  : `Upload Files (${uploadableFiles.length})`}
              </button>
              {!user && (
                <p className="upload-note">Please sign in to upload files</p>
              )}
              {user && !isUploading && gameDetailsWithoutRoles.length > 0 && (
                <p className="upload-note" style={{ color: "#ff6b6b" }}>
                  {gameDetailsWithoutRoles.length} game details file
                  {gameDetailsWithoutRoles.length > 1 ? "s" : ""} need role
                  assignments
                </p>
              )}
              {user &&
                !isUploading &&
                uploadableFiles.length > 0 &&
                gameDetailsWithoutRoles.length === 0 && (
                  <p className="upload-note">
                    Files will be uploaded to your account
                  </p>
                )}
            </div>
          )}
        </div>
      )}

      {selectedFileIndex !== null && (
        <RoleAssignmentDialog
          isOpen={roleDialogOpen}
          onClose={closeRoleDialog}
          onSave={saveRoleAssignments}
          matchData={uploadedFiles[selectedFileIndex]?.data}
          initialAssignments={uploadedFiles[selectedFileIndex]?.roleAssignments}
        />
      )}
    </div>
  );
}
