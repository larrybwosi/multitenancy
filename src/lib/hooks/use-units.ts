// lib/hooks/useUnitOfMeasure.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

// types/inventory.ts
export enum UnitType {
  COUNT = 'COUNT',
  VOLUME = 'VOLUME',
  WEIGHT = 'WEIGHT',
  LENGTH = 'LENGTH',
  AREA = 'AREA',
  TIME = 'TIME',
}

export interface CreateUnitOfMeasureInput {
  name: string;
  symbol: string;
  organizationId: string;
  unitType?: UnitType;
  baseUnitId?: string;
  conversionFactor?: number;
}

export interface UnitOfMeasure {
  id: string;
  name: string;
  symbol: string;
  organizationId: string;
  unitType: UnitType;
  baseUnitId: string | null;
  conversionFactor: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export function useCreateUnitOfMeasure() {
  const queryClient = useQueryClient();
  return useMutation<UnitOfMeasure, Error, CreateUnitOfMeasureInput>({
    mutationFn: async (input: CreateUnitOfMeasureInput) => {
      const response = await axios.post('/api/units-of-measure', input);
      return response.data;
    },
    onSuccess: data => {
      // You can add success handling here
      queryClient.invalidateQueries({queryKey:['unitsOfMeasure']});
      console.log('Unit created successfully:', data);
    },
    //eslint-disable-next-line
    onError: (error: any) => {
      // You can add error handling here
      console.error('Unit creation failed:', error.response?.data?.message || error.message);
    },
  });
}


/**
 * Hook to fetch units of measure for an organization using TanStack Query and Axios.
 * @param organizationId - The ID of the organization
 * @returns TanStack Query result with units of measure
 */
export function useUnitsOfMeasure() {
  return useQuery<UnitOfMeasure[], Error>({
    queryKey: ['unitsOfMeasure'],
    queryFn: async () => {
      const response = await axios.get<UnitOfMeasure[]>(`/api/units-of-measure`);
      return response.data;
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    retry: 2, // Retry failed requests up to 2 times
  });
}