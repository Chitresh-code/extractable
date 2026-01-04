import { useEffect, useState, useRef } from "react";
import { extractionApi } from "../../services/api";
import type { Extraction } from "../../types";

interface ResultsDisplayProps {
  extraction: Extraction;
}

export const ResultsDisplay: React.FC<ResultsDisplayProps> = ({
  extraction,
}) => {
  const [currentExtraction, setCurrentExtraction] = useState(extraction);
  const [downloading, setDownloading] = useState(false);
  const [downloadFormat, setDownloadFormat] = useState<
    "json" | "csv" | "excel"
  >("json");
  const [currentStep, setCurrentStep] = useState<number | null>(null);
  const [stepMessage, setStepMessage] = useState<string>("");
  const eventSourceRef = useRef<EventSource | null>(null);

  // Update state when prop changes
  useEffect(() => {
    setCurrentExtraction(extraction);
  }, [extraction]);

  // SSE connection for real-time updates (no polling)
  useEffect(() => {
    // Close existing EventSource if any
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    // Only connect to SSE stream if status is pending or processing
    const shouldStream =
      currentExtraction.status === "pending" ||
      currentExtraction.status === "processing";

    if (!shouldStream) {
      return; // Don't connect if already completed/failed
    }

    // Get auth token from localStorage
    const token = localStorage.getItem("access_token");
    if (!token) {
      console.error("No auth token found");
      return;
    }

    // Create EventSource for SSE stream
    const apiBaseUrl =
      import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";
    const eventSource = new EventSource(
      `${apiBaseUrl}/extractions/${currentExtraction.id}/stream?token=${encodeURIComponent(token)}`,
    );

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === "status_update") {
          // Fetch full extraction data when status changes
          extractionApi
            .get(currentExtraction.id)
            .then((updated) => {
              setCurrentExtraction(updated);

              // Close stream if completed or failed
              if (
                updated.status === "completed" ||
                updated.status === "failed"
              ) {
                setCurrentStep(null);
                setStepMessage("");
                eventSource.close();
                eventSourceRef.current = null;
              }
            })
            .catch((err) => {
              console.error("Failed to fetch updated extraction:", err);
            });
        } else if (data.type === "step_update") {
          // Update UI with step progress
          setCurrentStep(data.step);
          setStepMessage(data.message || "");
          console.log(
            `Step ${data.step}: ${data.message} (${data.time_elapsed}s)`,
          );
        }
      } catch (err) {
        console.error("Failed to parse SSE message:", err);
      }
    };

    eventSource.onerror = (error) => {
      console.error("SSE connection error:", error);
      eventSource.close();
      eventSourceRef.current = null;
    };

    eventSourceRef.current = eventSource;

    // Cleanup on unmount or when extraction ID changes
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [currentExtraction.id, currentExtraction.status]);

  // Initial status check when component mounts or extraction ID changes
  useEffect(() => {
    let mounted = true;

    const checkStatus = async () => {
      try {
        const updated = await extractionApi.get(currentExtraction.id);
        if (mounted) {
          setCurrentExtraction(updated);
        }
      } catch (err) {
        console.error("Failed to fetch initial extraction status:", err);
      }
    };

    // Check status once on mount/ID change
    checkStatus();

    return () => {
      mounted = false;
    };
  }, [currentExtraction.id]);

  const handleDownload = async (format: "json" | "csv" | "excel") => {
    if (!currentExtraction.table_data) return;

    setDownloading(true);
    try {
      const blob = await extractionApi.download(currentExtraction.id, format);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const extension = format === "excel" ? "xlsx" : format;
      a.download = `extraction_${currentExtraction.id}.${extension}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error("Download failed:", err);
    } finally {
      setDownloading(false);
    }
  };

  // Extract timing metrics from LLM output
  const timingMetrics =
    currentExtraction.llm_final_output?.timing_metrics || null;

  // Render table data
  const renderTableData = () => {
    if (!currentExtraction.table_data) return null;

    const tableData = currentExtraction.table_data;

    // Handle different table data structures
    if (
      tableData &&
      typeof tableData === "object" &&
      "tables" in tableData &&
      Array.isArray(tableData.tables)
    ) {
      const tables = tableData.tables as Array<{
        columns?: string[];
        rows?: Array<Record<string, unknown>>;
      }>;

      return tables.map((table, tableIdx: number) => (
        <div key={tableIdx} className="mt-4">
          {tables.length > 1 && (
            <h3 className="text-lg font-semibold mb-2">Table {tableIdx + 1}</h3>
          )}
          {table.columns && table.rows && (
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-100">
                    {table.columns.map((col: string, idx: number) => (
                      <th
                        key={idx}
                        className="border border-gray-300 px-4 py-2 text-left font-semibold"
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {table.rows.map(
                    (row: Record<string, unknown>, rowIdx: number) => (
                      <tr
                        key={rowIdx}
                        className={rowIdx % 2 === 0 ? "bg-white" : "bg-gray-50"}
                      >
                        {table.columns?.map((col: string, colIdx: number) => (
                          <td
                            key={colIdx}
                            className="border border-gray-300 px-4 py-2"
                          >
                            {row[col] !== null && row[col] !== undefined
                              ? String(row[col])
                              : ""}
                          </td>
                        ))}
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ));
    }

    // Fallback: try to render as simple object
    return (
      <div className="bg-gray-50 p-4 rounded">
        <pre className="text-sm overflow-auto">
          {JSON.stringify(tableData, null, 2)}
        </pre>
      </div>
    );
  };

  return (
    <div className="bg-card p-6 rounded-lg border space-y-4">
      <h2 className="text-xl font-bold">Extraction Status</h2>

      <div className="space-y-2">
        <div>
          <span className="font-medium">Status: </span>
          <span
            className={`px-2 py-1 rounded text-sm ${
              currentExtraction.status === "completed"
                ? "bg-green-100 text-green-800"
                : currentExtraction.status === "failed"
                  ? "bg-red-100 text-red-800"
                  : "bg-yellow-100 text-yellow-800"
            }`}
          >
            {currentExtraction.status}
          </span>
        </div>

        {currentExtraction.status === "processing" && currentStep !== null && (
          <div className="space-y-2">
            <div className="text-sm">
              <span className="font-medium">Current Step: </span>
              <span className="text-primary font-semibold">
                Step {currentStep} of 5
              </span>
            </div>
            {stepMessage && (
              <div className="text-sm text-muted-foreground">{stepMessage}</div>
            )}
            <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-primary h-2.5 rounded-full transition-all duration-300"
                style={
                  {
                    width: `${Math.min((currentStep / 5) * 100, 100)}%`,
                  } as React.CSSProperties
                }
              />
            </div>
            <div className="text-xs text-muted-foreground space-y-1">
              <div
                className={
                  currentStep >= 1
                    ? "text-green-600"
                    : currentStep === 0
                      ? "text-primary"
                      : ""
                }
              >
                {currentStep >= 1 ? "✓" : currentStep === 0 ? "→" : "○"} Step 1:
                Processing input files
              </div>
              <div
                className={
                  currentStep >= 2
                    ? "text-green-600"
                    : currentStep === 1
                      ? "text-primary"
                      : ""
                }
              >
                {currentStep >= 2 ? "✓" : currentStep === 1 ? "→" : "○"} Step 2:
                Extracting tables
              </div>
              <div
                className={
                  currentStep >= 3
                    ? "text-green-600"
                    : currentStep === 2
                      ? "text-primary"
                      : ""
                }
              >
                {currentStep >= 3 ? "✓" : currentStep === 2 ? "→" : "○"} Step 3:
                Validating extractions
              </div>
              <div
                className={
                  currentStep >= 4
                    ? "text-green-600"
                    : currentStep === 3
                      ? "text-primary"
                      : ""
                }
              >
                {currentStep >= 4 ? "✓" : currentStep === 3 ? "→" : "○"} Step 4:
                Generating final output
              </div>
              <div
                className={
                  currentStep >= 5
                    ? "text-green-600"
                    : currentStep === 4
                      ? "text-primary"
                      : ""
                }
              >
                {currentStep >= 5 ? "✓" : currentStep === 4 ? "→" : "○"} Step 5:
                Storing results
              </div>
            </div>
          </div>
        )}

        {currentExtraction.input_filename && (
          <div>
            <span className="font-medium">File: </span>
            <span>{currentExtraction.input_filename}</span>
          </div>
        )}

        {timingMetrics && (
          <div className="text-sm text-gray-600 space-y-1">
            <div>
              <span className="font-medium">Total Time: </span>
              {timingMetrics.total_time != null
                ? `${timingMetrics.total_time.toFixed(2)}s`
                : "N/A"}
            </div>
            <div className="ml-4 space-y-0.5">
              <div>
                Step 1 (File Processing):{" "}
                {timingMetrics.step_1_file_processing != null
                  ? `${timingMetrics.step_1_file_processing.toFixed(2)}s`
                  : "N/A"}
              </div>
              <div>
                Step 2 (Extraction):{" "}
                {timingMetrics.step_2_extraction != null
                  ? `${timingMetrics.step_2_extraction.toFixed(2)}s`
                  : "N/A"}
              </div>
              <div>
                Step 3 (Validation):{" "}
                {timingMetrics.step_3_validation != null
                  ? `${timingMetrics.step_3_validation.toFixed(2)}s`
                  : "N/A"}
              </div>
              <div>
                Step 4 (Finalization):{" "}
                {timingMetrics.step_4_finalization != null
                  ? `${timingMetrics.step_4_finalization.toFixed(2)}s`
                  : "N/A"}
              </div>
              <div>
                Step 5 (Storage):{" "}
                {timingMetrics.step_5_storage != null
                  ? `${timingMetrics.step_5_storage.toFixed(2)}s`
                  : "N/A"}
              </div>
            </div>
          </div>
        )}
      </div>

      {currentExtraction.status === "completed" &&
        currentExtraction.table_data && (
          <div className="space-y-4">
            <div className="border-t pt-4">
              <h3 className="text-lg font-semibold mb-3">Extracted Data</h3>
              {renderTableData()}
            </div>

            <div className="border-t pt-4">
              <h3 className="text-lg font-semibold mb-3">Download</h3>
              <div className="flex gap-2 items-center">
                <select
                  value={downloadFormat}
                  onChange={(e) =>
                    setDownloadFormat(
                      e.target.value as "json" | "csv" | "excel",
                    )
                  }
                  className="px-3 py-2 border rounded-md"
                  title="Select download format"
                  aria-label="Download format"
                >
                  <option value="json">JSON</option>
                  <option value="csv">CSV</option>
                  <option value="excel">Excel</option>
                </select>
                <button
                  onClick={() => handleDownload(downloadFormat)}
                  disabled={downloading}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
                >
                  {downloading ? "Downloading..." : "Download"}
                </button>
              </div>
            </div>
          </div>
        )}

      {currentExtraction.status === "failed" && (
        <div className="bg-red-50 border border-red-200 rounded p-3 text-red-800">
          <p className="font-medium">Extraction failed</p>
          <p className="text-sm mt-1">
            Please try again or contact support if the issue persists.
          </p>
        </div>
      )}
    </div>
  );
};
