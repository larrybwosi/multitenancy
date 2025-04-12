"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { mockOrganization } from "@/lib/mock-data"

export function OrganizationDetails() {
  const [loading, setLoading] = useState(true)
  const [organization, setOrganization] = useState<any>(null)

  useEffect(() => {
    // Simulate API call
    const fetchData = async () => {
      // In a real app, you would fetch from your API
      // const response = await fetch('/api/organization');
      // const data = await response.json();

      // Using mock data for demonstration
      setTimeout(() => {
        setOrganization(mockOrganization)
        setLoading(false)
      }, 1000)
    }

    fetchData()
  }, [])

  if (loading) {
    return <OrganizationDetailsSkeleton />
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-6 items-start">
        <div className="relative w-32 h-32 rounded-lg overflow-hidden border">
          {organization.logo ? (
            <Image
              src={organization.logo || "/placeholder.svg"}
              alt={organization.name}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-muted">
              <span className="text-4xl font-bold text-muted-foreground">{organization.name.charAt(0)}</span>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-bold">{organization.name}</h2>
          {organization.slug && (
            <p className="text-sm text-muted-foreground">
              <span className="font-medium">Slug:</span> {organization.slug}
            </p>
          )}
          <p className="text-sm text-muted-foreground">
            <span className="font-medium">Created:</span> {new Date(organization.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>

      {organization.description && (
        <div>
          <h3 className="text-lg font-medium mb-2">Description</h3>
          <p className="text-muted-foreground">{organization.description}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-emerald-600">{organization.memberCount}</p>
              <p className="text-sm font-medium text-muted-foreground">Members</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-purple-600">{organization.invitationCount}</p>
              <p className="text-sm font-medium text-muted-foreground">Pending Invitations</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-amber-600">{organization.productCount}</p>
              <p className="text-sm font-medium text-muted-foreground">Products</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function OrganizationDetailsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-6 items-start">
        <Skeleton className="w-32 h-32 rounded-lg" />
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-40" />
        </div>
      </div>

      <div>
        <Skeleton className="h-6 w-32 mb-2" />
        <Skeleton className="h-20 w-full" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Skeleton className="h-10 w-16 mx-auto mb-2" />
              <Skeleton className="h-4 w-24 mx-auto" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Skeleton className="h-10 w-16 mx-auto mb-2" />
              <Skeleton className="h-4 w-24 mx-auto" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Skeleton className="h-10 w-16 mx-auto mb-2" />
              <Skeleton className="h-4 w-24 mx-auto" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
