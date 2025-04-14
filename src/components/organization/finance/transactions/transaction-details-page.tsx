"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeftIcon, EditIcon, TrashIcon, DownloadIcon, ArrowDownIcon, ArrowUpIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"

interface TransactionDetailsPageProps {
  id: string
}

export function TransactionDetailsPage({ id }: TransactionDetailsPageProps) {
  const router = useRouter()
  const [transaction, setTransaction] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    const fetchTransaction = async () => {
      setIsLoading(true)
      try {
        const response = await fetch(`/api/finance/transactions/${id}`)
        if (!response.ok) {
          throw new Error("Failed to fetch transaction")
        }
        const data = await response.json()
        setTransaction(data)
      } catch (error) {
        console.error("Error fetching transaction:", error)
        toast("Error",{
          description: "Failed to fetch transaction details.",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchTransaction()
  }, [id])

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/finance/transactions/${id}`, {
        method: "DELETE",
      })
      if (!response.ok) {
        throw new Error("Failed to delete transaction")
      }
      toast.success("Transaction deleted",{
        description: "The transaction has been deleted successfully.",
      })
      router.push("/organization/finance/transactions")
    } catch (error) {
      console.error("Error deleting transaction:", error)
      toast.error("Error",{
        description: "Failed to delete transaction. Please try again.",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date)
  }

  const formatDateTime = (dateTimeString: string) => {
    const date = new Date(dateTimeString)
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return <Badge variant="default">Completed</Badge>
      case "pending":
        return <Badge variant="outline">Pending</Badge>
      case "failed":
        return <Badge variant="destructive">Failed</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="icon" asChild>
            <Link href="/organization/finance/transactions">
              <ArrowLeftIcon className="h-4 w-4" />
              <span className="sr-only">Back</span>
            </Link>
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Transaction Details</h1>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm">
            <EditIcon className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <TrashIcon className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the transaction and remove it from our
                  servers.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {isDeleting ? "Deleting..." : "Delete"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {isLoading ? (
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-6 w-1/2" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-6 w-1/2" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-6 w-1/2" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-6 w-1/2" />
              </div>
            </div>
            <Separator />
            <div className="space-y-2">
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-20 w-full" />
            </div>
          </CardContent>
        </Card>
      ) : transaction ? (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">{transaction.description}</CardTitle>
                  <CardDescription>Transaction ID: {transaction.id}</CardDescription>
                </div>
                <div className="flex items-center">
                  {transaction.type === "income" ? (
                    <ArrowUpIcon className="mr-2 h-5 w-5 text-green-500" />
                  ) : (
                    <ArrowDownIcon className="mr-2 h-5 w-5 text-red-500" />
                  )}
                  <span
                    className={`text-2xl font-bold ${
                      transaction.type === "income" ? "text-green-500" : "text-red-500"
                    }`}
                  >
                    {transaction.type === "income" ? "+" : "-"}
                    {formatCurrency(transaction.amount)}
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Date</h3>
                  <p className="text-base">{formatDate(transaction.date)}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Category</h3>
                  <p className="text-base">
                    <Badge variant="outline" className="mt-1">
                      {transaction.category}
                    </Badge>
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Payment Method</h3>
                  <p className="text-base">{transaction.paymentMethod}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Status</h3>
                  <p className="text-base">{getStatusBadge(transaction.status)}</p>
                </div>
              </div>

              {transaction.notes && (
                <>
                  <Separator />
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Notes</h3>
                    <p className="mt-2 whitespace-pre-wrap text-base">{transaction.notes}</p>
                  </div>
                </>
              )}

              {transaction.attachments && transaction.attachments.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Attachments</h3>
                    <div className="mt-2 space-y-2">
                      {transaction.attachments.map((attachment: any) => (
                        <div key={attachment.id} className="flex items-center justify-between rounded-md border p-3">
                          <div className="flex items-center space-x-2">
                            <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center">
                              <span className="text-xs">.{attachment.name.split(".").pop()}</span>
                            </div>
                            <div>
                              <p className="text-sm font-medium">{attachment.name}</p>
                              <p className="text-xs text-muted-foreground">{attachment.size}</p>
                            </div>
                          </div>
                          <Button variant="ghost" size="icon" asChild>
                            <a href={attachment.url} target="_blank" rel="noopener noreferrer">
                              <DownloadIcon className="h-4 w-4" />
                              <span className="sr-only">Download</span>
                            </a>
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
            <CardFooter className="border-t bg-muted/50 px-6 py-3">
              <div className="flex w-full justify-between text-xs text-muted-foreground">
                <div>Created: {formatDateTime(transaction.metadata.createdAt)}</div>
                {transaction.metadata.updatedAt !== transaction.metadata.createdAt && (
                  <div>Last Updated: {formatDateTime(transaction.metadata.updatedAt)}</div>
                )}
              </div>
            </CardFooter>
          </Card>
        </div>
      ) : (
        <Card>
          <CardContent className="flex h-40 items-center justify-center">
            <p className="text-muted-foreground">Transaction not found</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
