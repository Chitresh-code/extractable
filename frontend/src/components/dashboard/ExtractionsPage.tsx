import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Plus,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  Download,
  AlertTriangle,
} from 'lucide-react'
import { Button } from '../ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'
import { Badge } from '../ui/badge'
import { Input } from '../ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select'
import { Spinner } from '../ui/spinner'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '../ui/pagination'
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '../ui/empty'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '../ui/breadcrumb'
import { extractionApi } from '../../services/api'
import type { Extraction } from '../../types'
import { formatDistanceToNow } from 'date-fns'
import { AddExtractionDialog } from './AddExtractionDialog'
import { EditExtractionDialog } from './EditExtractionDialog'
import { useNotificationStore } from '../../store/notificationStore'
import { useCallback } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog'

export function ExtractionsPage() {
  const navigate = useNavigate()
  const addNotification = useNotificationStore((state) => state.addNotification)
  const [extractions, setExtractions] = React.useState<Extraction[]>([])
  const [loading, setLoading] = React.useState(true)
  const [page, setPage] = React.useState(1)
  const [total, setTotal] = React.useState(0)
  const [pageSize] = React.useState(20)
  const [searchTerm, setSearchTerm] = React.useState('')
  const [statusFilter, setStatusFilter] = React.useState<string>('all')
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [editDialogOpen, setEditDialogOpen] = React.useState(false)
  const [extractionToEdit, setExtractionToEdit] = React.useState<Extraction | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [extractionToDelete, setExtractionToDelete] = React.useState<number | null>(null)
  const [extractionToDeleteName, setExtractionToDeleteName] = React.useState<string | null>(null)

  const loadExtractions = useCallback(async () => {
    try {
      setLoading(true)
      const response = await extractionApi.list(
        page,
        pageSize,
        statusFilter,
        searchTerm || undefined
      )
      setExtractions(response.items)
      setTotal(response.total)
    } catch (error) {
      console.error('Failed to load extractions:', error)
      addNotification({
        title: 'Error',
        message: 'Failed to load extractions',
        type: 'error',
      })
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, statusFilter, searchTerm, addNotification])

  React.useEffect(() => {
    loadExtractions()
  }, [loadExtractions])

  React.useEffect(() => {
    // Reset to page 1 when search term changes
    if (searchTerm && page !== 1) {
      setPage(1)
    }
  }, [searchTerm, page])


  const handleDelete = async (id: number) => {
    try {
      await extractionApi.delete(id)
      addNotification({
        title: 'Success',
        message: 'Extraction deleted successfully',
        type: 'success',
      })
      loadExtractions()
    } catch (error) {
      addNotification({
        title: 'Error',
        message: 'Failed to delete extraction',
        type: 'error',
      })
    } finally {
      setDeleteDialogOpen(false)
      setExtractionToDelete(null)
      setExtractionToDeleteName(null)
    }
  }

  const handleDownload = async (id: number, format: string) => {
    try {
      const blob = await extractionApi.download(id, format)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `extraction-${id}.${format}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      addNotification({
        title: 'Success',
        message: `Downloaded as ${format.toUpperCase()}`,
        type: 'success',
      })
    } catch (error) {
      addNotification({
        title: 'Error',
        message: 'Failed to download extraction',
        type: 'error',
      })
    }
  }

  const getStatusBadge = (status: Extraction['status']) => {
    const variants = {
      pending: 'secondary',
      processing: 'default',
      completed: 'default',
      failed: 'destructive',
    } as const

    const icons = {
      pending: Clock,
      processing: Loader2,
      completed: CheckCircle2,
      failed: XCircle,
    }

    const Icon = icons[status]
    const variant = variants[status]

    return (
      <Badge variant={variant} className="flex items-center gap-1">
        {status === 'processing' && <Icon className="h-3 w-3 animate-spin" />}
        {status !== 'processing' && <Icon className="h-3 w-3" />}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className="space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink onClick={() => navigate('/dashboard')}>
              Dashboard
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Extractions</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Extractions</h1>
          <p className="text-muted-foreground">
            Manage and view all your extraction jobs
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Extraction
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <Input
          placeholder="Search by name or ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              loadExtractions()
            }
          }}
          className="max-w-sm"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="processing">Processing</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner className="h-8 w-8" />
        </div>
      ) : extractions.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyTitle>No extractions found</EmptyTitle>
            <EmptyDescription>
              {searchTerm || statusFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Create your first extraction to get started'}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Complexity</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {extractions.map((extraction) => (
                  <TableRow key={extraction.id}>
                    <TableCell className="font-medium">
                      {extraction.input_filename || `Extraction #${extraction.id}`}
                    </TableCell>
                    <TableCell>{getStatusBadge(extraction.status)}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{extraction.complexity}</Badge>
                    </TableCell>
                    <TableCell>
                      {formatDistanceToNow(new Date(extraction.created_at), {
                        addSuffix: true,
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() =>
                              navigate(`/dashboard/extractions/${extraction.id}`)
                            }
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View
                          </DropdownMenuItem>
                          {extraction.status !== 'processing' && (
                            <DropdownMenuItem
                              onClick={() => {
                                setExtractionToEdit(extraction)
                                setEditDialogOpen(true)
                              }}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                          )}
                          {extraction.status === 'completed' && (
                            <>
                              <DropdownMenuItem
                                onClick={() => handleDownload(extraction.id, 'json')}
                              >
                                <Download className="mr-2 h-4 w-4" />
                                Download JSON
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDownload(extraction.id, 'csv')}
                              >
                                <Download className="mr-2 h-4 w-4" />
                                Download CSV
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDownload(extraction.id, 'excel')}
                              >
                                <Download className="mr-2 h-4 w-4" />
                                Download Excel
                              </DropdownMenuItem>
                            </>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => {
                              setExtractionToDelete(extraction.id)
                              setExtractionToDeleteName(extraction.input_filename || `Extraction #${extraction.id}`)
                              setDeleteDialogOpen(true)
                            }}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className={page === 1 ? 'pointer-events-none opacity-50' : ''}
                  />
                </PaginationItem>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <PaginationItem key={p}>
                    <PaginationLink
                      onClick={() => setPage(p)}
                      isActive={p === page}
                    >
                      {p}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className={page === totalPages ? 'pointer-events-none opacity-50' : ''}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </>
      )}

      <AddExtractionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={(extraction) => {
          setDialogOpen(false)
          navigate(`/dashboard/extractions/${extraction.id}`)
        }}
      />

      <EditExtractionDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        extraction={extractionToEdit}
        onSuccess={() => {
          loadExtractions()
        }}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="sm:max-w-[425px]">
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <AlertDialogTitle className="text-xl">Delete Extraction</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-base pt-2">
              Are you sure you want to delete <span className="font-semibold text-foreground">{extractionToDeleteName}</span>? This action cannot be undone and will permanently delete the extraction and all its data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel className="mt-0">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (extractionToDelete) {
                  handleDelete(extractionToDelete)
                  setExtractionToDeleteName(null)
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

