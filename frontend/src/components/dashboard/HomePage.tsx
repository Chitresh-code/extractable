import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, FileText, Clock, CheckCircle2, XCircle, Loader2, MoreVertical, Eye, Download } from 'lucide-react'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from '../ui/breadcrumb'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table'
import { Badge } from '../ui/badge'
import { Spinner } from '../ui/spinner'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'
import { extractionApi } from '../../services/api'
import type { Extraction } from '../../types'
import { formatDistanceToNow } from 'date-fns'
import { AddExtractionDialog } from './AddExtractionDialog'
import { useNotificationStore } from '../../store/notificationStore'

export function HomePage() {
  const navigate = useNavigate()
  const [extractions, setExtractions] = React.useState<Extraction[]>([])
  const [loading, setLoading] = React.useState(true)
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const { addNotification } = useNotificationStore()

  React.useEffect(() => {
    loadExtractions()
  }, [])

  const loadExtractions = async () => {
    try {
      setLoading(true)
      const response = await extractionApi.list(1, 5, undefined, undefined)
      setExtractions(response.items)
    } catch (error) {
      console.error('Failed to load extractions:', error)
    } finally {
      setLoading(false)
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

  return (
    <div className="space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbPage>Dashboard</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here's an overview of your extractions.
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Extraction
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Extractions</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{extractions.length}</div>
            <p className="text-xs text-muted-foreground">
              Last 5 extractions shown
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {extractions.filter((e) => e.status === 'completed').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Processing</CardTitle>
            <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {extractions.filter((e) => e.status === 'processing').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {extractions.filter((e) => e.status === 'failed').length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Extractions</CardTitle>
              <CardDescription>
                Your last 5 extraction jobs
              </CardDescription>
            </div>
            <Button variant="outline" onClick={() => navigate('/dashboard/extractions')}>
              View All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Spinner className="h-6 w-6" />
            </div>
          ) : extractions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No extractions yet. Create your first extraction to get started.
            </div>
          ) : (
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
                  <TableRow
                    key={extraction.id}
                    className="cursor-pointer"
                    onClick={() => navigate(`/dashboard/extractions/${extraction.id}`)}
                  >
                    <TableCell className="font-medium">
                      {extraction.input_filename || `Extraction #${extraction.id}`}
                    </TableCell>
                    <TableCell>{getStatusBadge(extraction.status)}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {extraction.complexity}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {formatDistanceToNow(new Date(extraction.created_at), {
                        addSuffix: true,
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation()
                              navigate(`/dashboard/extractions/${extraction.id}`)
                            }}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View
                          </DropdownMenuItem>
                          {extraction.status === 'completed' && (
                            <>
                              <DropdownMenuItem
                                onClick={async (e) => {
                                  e.stopPropagation()
                                  try {
                                    const blob = await extractionApi.download(extraction.id, 'json')
                                    const url = window.URL.createObjectURL(blob)
                                    const a = document.createElement('a')
                                    a.href = url
                                    a.download = `extraction_${extraction.id}.json`
                                    document.body.appendChild(a)
                                    a.click()
                                    window.URL.revokeObjectURL(url)
                                    document.body.removeChild(a)
                                    addNotification({
                                      title: 'Download Complete',
                                      message: `Extraction ${extraction.id} downloaded as JSON.`,
                                      type: 'success',
                                    })
                                  } catch (err) {
                                    console.error('Download failed:', err)
                                    addNotification({
                                      title: 'Error',
                                      message: `Failed to download extraction ${extraction.id}.`,
                                      type: 'error',
                                    })
                                  }
                                }}
                              >
                                <Download className="mr-2 h-4 w-4" />
                                Download JSON
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={async (e) => {
                                  e.stopPropagation()
                                  try {
                                    const blob = await extractionApi.download(extraction.id, 'csv')
                                    const url = window.URL.createObjectURL(blob)
                                    const a = document.createElement('a')
                                    a.href = url
                                    a.download = `extraction_${extraction.id}.csv`
                                    document.body.appendChild(a)
                                    a.click()
                                    window.URL.revokeObjectURL(url)
                                    document.body.removeChild(a)
                                    addNotification({
                                      title: 'Download Complete',
                                      message: `Extraction ${extraction.id} downloaded as CSV.`,
                                      type: 'success',
                                    })
                                  } catch (err) {
                                    console.error('Download failed:', err)
                                    addNotification({
                                      title: 'Error',
                                      message: `Failed to download extraction ${extraction.id}.`,
                                      type: 'error',
                                    })
                                  }
                                }}
                              >
                                <Download className="mr-2 h-4 w-4" />
                                Download CSV
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={async (e) => {
                                  e.stopPropagation()
                                  try {
                                    const blob = await extractionApi.download(extraction.id, 'excel')
                                    const url = window.URL.createObjectURL(blob)
                                    const a = document.createElement('a')
                                    a.href = url
                                    a.download = `extraction_${extraction.id}.xlsx`
                                    document.body.appendChild(a)
                                    a.click()
                                    window.URL.revokeObjectURL(url)
                                    document.body.removeChild(a)
                                    addNotification({
                                      title: 'Download Complete',
                                      message: `Extraction ${extraction.id} downloaded as Excel.`,
                                      type: 'success',
                                    })
                                  } catch (err) {
                                    console.error('Download failed:', err)
                                    addNotification({
                                      title: 'Error',
                                      message: `Failed to download extraction ${extraction.id}.`,
                                      type: 'error',
                                    })
                                  }
                                }}
                              >
                                <Download className="mr-2 h-4 w-4" />
                                Download Excel
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AddExtractionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={(extraction) => {
          setDialogOpen(false)
          navigate(`/dashboard/extractions/${extraction.id}`)
        }}
      />
    </div>
  )
}

