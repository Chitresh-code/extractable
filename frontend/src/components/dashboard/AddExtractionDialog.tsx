import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { ExtractionForm } from "../extraction/ExtractionForm";
import type { Extraction } from "../../types";

interface AddExtractionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (extraction: Extraction) => void;
}

export function AddExtractionDialog({
  open,
  onOpenChange,
  onSuccess,
}: AddExtractionDialogProps) {
  const handleSuccess = (extraction: Extraction) => {
    onSuccess(extraction);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Extraction</DialogTitle>
          <DialogDescription>
            Upload a PDF or image file to extract structured table data.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4">
          <ExtractionForm
            onSuccess={handleSuccess}
            onCancel={() => onOpenChange(false)}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
