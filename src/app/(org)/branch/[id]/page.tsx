'use client';
import BranchDetails from "@/components/organization/warehouse/warehouse-id";
import { use } from "react";
import { toast } from "sonner";
import useSWR from "swr";

const fetcher = (url: string) =>
  fetch(url).then(res => {
    if (!res.ok) throw new Error('Failed to fetch warehouse');
    return res.json();
  });
type Params = Promise<{ id: string }>;
export default function WarehouseDetailsPage(props: { params: Params }) {
  const params = use(props.params);
  // Enhanced API call to get comprehensive warehouse data

  const { data, error, isLoading, mutate } = useSWR(`/api/warehouse/${params.id}`, fetcher, {
    onError: err => {
      toast.error('Error', {
        description: err.message || 'Failed to load warehouse details',
      });
    },
    revalidateOnFocus: false,
    refreshInterval: 180000, // Auto-refresh every 3 minutes
  });
console.log(data)
  if(isLoading || error) return
  return <BranchDetails branch={data.warehouse} />;
}