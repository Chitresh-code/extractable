import * as React from "react";
import { useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "../ui/breadcrumb";
import { Button } from "../ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Badge } from "../ui/badge";
import { Progress } from "../ui/progress";
import { Spinner } from "../ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import {
  ArrowLeft,
  Download,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react";
import { extractionApi } from "../../services/api";
import type { Extraction } from "../../types";
import { formatDistanceToNow } from "date-fns";
import { useNotificationStore } from "../../store/notificationStore";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

export function ExtractionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const addNotification = useNotificationStore(
    (state) => state.addNotification,
  );
  const [extraction, setExtraction] = React.useState<Extraction | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [polling, setPolling] = React.useState(false);
  const [currentStep, setCurrentStep] = React.useState<number | null>(null);
  const [stepMessage, setStepMessage] = React.useState<string>("");
  const previousStatusRef = React.useRef<Extraction["status"] | null>(null);
  const eventSourceRef = React.useRef<EventSource | null>(null);

  const loadExtraction = useCallback(async () => {
    if (!id) return;
    try {
      const data = await extractionApi.get(Number(id));
      const previousStatus = previousStatusRef.current;
      previousStatusRef.current = data.status;

      // Show notification if status changed from processing/pending to completed/failed
      // This handles both initial load (if was processing) and polling updates
      if (
        previousStatus &&
        (previousStatus === "processing" || previousStatus === "pending")
      ) {
        if (data.status === "completed") {
          addNotification({
            title: "Extraction Completed",
            message: `Extraction #${data.id} has been completed successfully`,
            type: "success",
          });
        } else if (data.status === "failed") {
          addNotification({
            title: "Extraction Failed",
            message: `Extraction #${data.id} has failed`,
            type: "error",
          });
        }
      }

      setExtraction(data);
    } catch (error) {
      console.error("Failed to load extraction:", error);
      addNotification({
        title: "Error",
        message: "Failed to load extraction details",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [id, addNotification]);

  React.useEffect(() => {
    if (id) {
      loadExtraction();
    }
  }, [id, loadExtraction]);

  // SSE connection for real-time updates
  React.useEffect(() => {
    // Close existing EventSource if any
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    // Only connect to SSE stream if status is pending or processing
    if (
      !extraction ||
      (extraction.status !== "pending" && extraction.status !== "processing")
    ) {
      setPolling(false);
      setCurrentStep(null);
      setStepMessage("");
      return;
    }

    setPolling(true);

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
      `${apiBaseUrl}/extractions/${extraction.id}/stream?token=${encodeURIComponent(token)}`,
    );

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === "notification") {
          // Handle notification events
          addNotification({
            title: data.title || "Notification",
            message: data.message || "",
            type:
              data.notification_type === "error"
                ? "error"
                : data.notification_type === "success"
                  ? "success"
                  : "info",
          });
        } else if (data.type === "status_update") {
          // Only fetch if status actually changed
          const newStatus = data.status;
          const prevStatus = previousStatusRef.current;

          if (newStatus !== prevStatus) {
            previousStatusRef.current = newStatus;

            // Update local state immediately with status from SSE
            if (extraction) {
              setExtraction({ ...extraction, status: newStatus });
            }

            // Show notification when status changes to completed/failed
            if (
              prevStatus &&
              (prevStatus === "processing" || prevStatus === "pending")
            ) {
              if (newStatus === "completed") {
                addNotification({
                  title: "Extraction Completed",
                  message: `Extraction #${extraction?.id || data.extraction_id} has been completed successfully`,
                  type: "success",
                });
              } else if (newStatus === "failed") {
                addNotification({
                  title: "Extraction Failed",
                  message: `Extraction #${extraction?.id || data.extraction_id} has failed`,
                  type: "error",
                });
              }
            }

            // Only fetch full extraction data when status changes to completed/failed
            // For other status changes, we already updated the status above
            if (newStatus === "completed" || newStatus === "failed") {
              const extractionId = extraction?.id || data.extraction_id;
              if (extractionId) {
                extractionApi
                  .get(extractionId)
                  .then((updated) => {
                    setExtraction(updated);
                    setCurrentStep(null);
                    setStepMessage("");
                    setPolling(false);
                    eventSource.close();
                    eventSourceRef.current = null;
                  })
                  .catch((err) => {
                    console.error("Failed to fetch updated extraction:", err);
                  });
              } else {
                // Close stream if we don't have extraction ID
                setCurrentStep(null);
                setStepMessage("");
                setPolling(false);
                eventSource.close();
                eventSourceRef.current = null;
              }
            }
          }
        } else if (data.type === "step_update") {
          // Update UI with step progress
          setCurrentStep(data.step);
          setStepMessage(data.message || "");
        }
      } catch (err) {
        console.error("Failed to parse SSE message:", err);
      }
    };

    eventSource.onerror = (error) => {
      console.error("SSE connection error:", error);
      // Close the connection on error
      eventSource.close();
      eventSourceRef.current = null;
      // Don't fallback to polling - just log the error
      // The component will handle status updates through normal navigation
    };

    eventSourceRef.current = eventSource;

    // Cleanup on unmount or when extraction changes
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [extraction?.id, extraction?.status, addNotification]);

  const handleDownload = async (format: string) => {
    if (!id) return;
    try {
      const blob = await extractionApi.download(Number(id), format);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `extraction-${id}.${format === "excel" ? "xlsx" : format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      addNotification({
        title: "Success",
        message: `Downloaded as ${format.toUpperCase()}`,
        type: "success",
      });
    } catch (error) {
      addNotification({
        title: "Error",
        message: "Failed to download extraction",
        type: "error",
      });
    }
  };

  const getStatusBadge = (status: Extraction["status"]) => {
    const variants = {
      pending: "secondary",
      processing: "default",
      completed: "default",
      failed: "destructive",
    } as const;

    const icons = {
      pending: Clock,
      processing: Loader2,
      completed: CheckCircle2,
      failed: XCircle,
    };

    const Icon = icons[status];
    const variant = variants[status];

    return (
      <Badge variant={variant} className="flex items-center gap-1">
        {status === "processing" && <Icon className="h-3 w-3 animate-spin" />}
        {status !== "processing" && <Icon className="h-3 w-3" />}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getProgress = () => {
    if (!extraction) return 0;
    switch (extraction.status) {
      case "pending":
        return 10;
      case "processing":
        // Calculate progress based on current step
        if (currentStep !== null) {
          return Math.min(10 + currentStep * 18, 90); // 10% + (step * 18%) up to 90%
        }
        return 50;
      case "completed":
        return 100;
      case "failed":
        return 0;
      default:
        return 0;
    }
  };

  const getStepDescription = (step: number, message: string): string => {
    const stepNames = [
      "Starting pipeline...",
      "Processing input files",
      "Extracting tables from images",
      "Validating extractions",
      "Generating final output",
      "Storing results",
    ];

    if (message) {
      return `Step ${step}: ${message}`;
    }

    if (step >= 0 && step < stepNames.length) {
      return `Step ${step}: ${stepNames[step]}`;
    }

    return `Step ${step}: Processing...`;
  };

  const renderTableData = () => {
    if (!extraction?.table_data) return null;

    const tableData = extraction.table_data;
    if (typeof tableData !== "object" || tableData === null) return null;

    // Handle different table data structures
    if ("tables" in tableData && Array.isArray(tableData.tables)) {
      return (tableData.tables as Array<Record<string, unknown>>).map(
        (table, idx) => (
          <div key={idx} className="mb-6">
            <h3 className="text-lg font-semibold mb-2">Table {idx + 1}</h3>
            {renderTable(table)}
          </div>
        ),
      );
    }

    // If it's a single table object
    return renderTable(tableData as Record<string, unknown>);
  };

  const renderTable = (data: Record<string, unknown>) => {
    // Try to find rows and columns
    let rows: unknown[] = [];
    let columns: string[] = [];

    if ("rows" in data && Array.isArray(data.rows)) {
      rows = data.rows;
      if (rows.length > 0 && typeof rows[0] === "object" && rows[0] !== null) {
        columns = Object.keys(rows[0] as Record<string, unknown>);
      }
    } else if (Array.isArray(data)) {
      rows = data;
      if (rows.length > 0 && typeof rows[0] === "object" && rows[0] !== null) {
        columns = Object.keys(rows[0] as Record<string, unknown>);
      }
    } else {
      // Try to extract columns from object keys
      columns = Object.keys(data);
      rows = [data];
    }

    if (columns.length === 0) {
      return (
        <div className="p-4 bg-muted rounded-md">
          <pre className="text-sm overflow-auto">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      );
    }

    return (
      <div className="rounded-md border overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col) => (
                <TableHead key={col}>{col}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.slice(0, 100).map((row, idx) => (
              <TableRow key={idx}>
                {columns.map((col) => {
                  const value = (row as Record<string, unknown>)[col];
                  return (
                    <TableCell key={col}>
                      {value !== null && value !== undefined
                        ? String(value)
                        : "-"}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {rows.length > 100 && (
          <div className="p-4 text-sm text-muted-foreground text-center">
            Showing first 100 rows of {rows.length} total rows
          </div>
        )}
      </div>
    );
  };

  if (loading && !extraction) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (!extraction) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Extraction not found</AlertTitle>
        <AlertDescription>
          The extraction you're looking for doesn't exist or has been deleted.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink onClick={() => navigate("/dashboard")}>
              Dashboard
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink onClick={() => navigate("/dashboard/extractions")}>
              Extractions
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>
              {extraction.input_filename || `Extraction #${extraction.id}`}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">
              {extraction.input_filename || `Extraction #${extraction.id}`}
            </h1>
            <p className="text-muted-foreground">
              Created{" "}
              {formatDistanceToNow(new Date(extraction.created_at), {
                addSuffix: true,
              })}
            </p>
          </div>
        </div>
        {extraction.status === "completed" && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button>
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleDownload("json")}>
                Download as JSON
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDownload("csv")}>
                Download as CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDownload("excel")}>
                Download as Excel
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {getStatusBadge(extraction.status)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Complexity</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant="outline" className="text-lg">
              {extraction.complexity}
            </Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Input Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {extraction.input_type || "N/A"}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Multiple Tables
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {extraction.multiple_tables ? "Yes" : "No"}
            </div>
          </CardContent>
        </Card>
      </div>

      {(extraction.status === "pending" ||
        extraction.status === "processing") && (
        <Card>
          <CardHeader>
            <CardTitle>Processing Status</CardTitle>
            <CardDescription>{polling && "Auto-refreshing..."}</CardDescription>
          </CardHeader>
          <CardContent>
            <Progress value={getProgress()} className="h-2" />
            <p className="text-sm text-muted-foreground mt-2">
              {extraction.status === "pending"
                ? "Waiting to start processing..."
                : currentStep !== null
                  ? getStepDescription(currentStep, stepMessage)
                  : "Processing your extraction..."}
            </p>
          </CardContent>
        </Card>
      )}

      {extraction.status === "completed" && extraction.table_data && (
        <Card>
          <CardHeader>
            <CardTitle>Extracted Data</CardTitle>
            <CardDescription>
              Structured table data extracted from your document
            </CardDescription>
          </CardHeader>
          <CardContent>{renderTableData()}</CardContent>
        </Card>
      )}

      {extraction.status === "failed" && (
        <Alert variant="destructive">
          <AlertTitle>Extraction Failed</AlertTitle>
          <AlertDescription>
            The extraction process encountered an error. Please try again or
            contact support.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
