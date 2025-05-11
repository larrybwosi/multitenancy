import { useState, useEffect } from 'react';
import { useOrganization } from '@/hooks/use-organization';

interface TaxRecord {
  id: string;
  date: Date;
  type: string;
  amount: number;
  status: string;
  description: string;
}

interface TaxReturn {
  id: string;
  period: string;
  type: string;
  amount: number;
  filingDate: Date;
  dueDate: Date;
  status: string;
  attachments: TaxReturnAttachment[];
}

interface TaxReturnAttachment {
  id: string;
  name: string;
  url: string;
}

interface TaxSchedule {
  id: string;
  type: string;
  amount: number;
  dueDate: Date;
  description?: string;
  isRecurring: boolean;
  recurringFrequency?: string;
  notificationDate?: Date;
  status: string;
}

interface VATSummary {
  totalSales: number;
  totalVAT: number;
  totalVatPaid: number;
  vatDue: number;
  vatRate: string;
}

export function useTaxRecords(month?: string) {
  const [taxRecords, setTaxRecords] = useState<TaxRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { organization } = useOrganization();

  useEffect(() => {
    if (!organization) return;

    const fetchTaxRecords = async () => {
      setLoading(true);
      try {
        const url = new URL('/api/taxes', window.location.origin);
        url.searchParams.append('organizationId', organization.id);
        if (month) {
          url.searchParams.append('month', month);
        }

        const response = await fetch(url.toString());
        if (!response.ok) {
          throw new Error('Failed to fetch tax records');
        }

        const data = await response.json();
        // Convert string dates to Date objects
        const formattedRecords = data.taxes.map((record: any) => ({
          ...record,
          date: new Date(record.date)
        }));
        
        setTaxRecords(formattedRecords);
      } catch (error) {
        setError(error instanceof Error ? error.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchTaxRecords();
  }, [organization, month]);

  return { taxRecords, loading, error };
}

export function useVATSummary(month?: string) {
  const [vatSummary, setVatSummary] = useState<VATSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { organization } = useOrganization();

  useEffect(() => {
    if (!organization) return;

    const fetchVATSummary = async () => {
      setLoading(true);
      try {
        const url = new URL('/api/taxes/vat', window.location.origin);
        url.searchParams.append('organizationId', organization.id);
        if (month) {
          url.searchParams.append('month', month);
        }

        const response = await fetch(url.toString());
        if (!response.ok) {
          throw new Error('Failed to fetch VAT summary');
        }

        const data = await response.json();
        setVatSummary(data);
      } catch (error) {
        setError(error instanceof Error ? error.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchVATSummary();
  }, [organization, month]);

  return { vatSummary, loading, error };
}

export function useTaxReturns() {
  const [taxReturns, setTaxReturns] = useState<TaxReturn[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { organization } = useOrganization();

  useEffect(() => {
    if (!organization) return;

    const fetchTaxReturns = async () => {
      setLoading(true);
      try {
        const url = new URL('/api/taxes/returns', window.location.origin);
        url.searchParams.append('organizationId', organization.id);

        const response = await fetch(url.toString());
        if (!response.ok) {
          throw new Error('Failed to fetch tax returns');
        }

        const data = await response.json();
        // Convert string dates to Date objects
        const formattedReturns = data.taxReturns.map((taxReturn: any) => ({
          ...taxReturn,
          filingDate: new Date(taxReturn.filingDate),
          dueDate: new Date(taxReturn.dueDate)
        }));
        
        setTaxReturns(formattedReturns);
      } catch (error) {
        setError(error instanceof Error ? error.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchTaxReturns();
  }, [organization]);

  return { taxReturns, loading, error };
}

export function useTaxSchedules() {
  const [taxSchedules, setTaxSchedules] = useState<TaxSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { organization } = useOrganization();

  useEffect(() => {
    if (!organization) return;

    const fetchTaxSchedules = async () => {
      setLoading(true);
      try {
        const url = new URL('/api/taxes/schedule', window.location.origin);
        url.searchParams.append('organizationId', organization.id);

        const response = await fetch(url.toString());
        if (!response.ok) {
          throw new Error('Failed to fetch tax schedules');
        }

        const data = await response.json();
        // Convert string dates to Date objects
        const formattedSchedules = data.scheduledPayments.map((schedule: any) => ({
          ...schedule,
          dueDate: new Date(schedule.dueDate),
          notificationDate: schedule.notificationDate ? new Date(schedule.notificationDate) : undefined
        }));
        
        setTaxSchedules(formattedSchedules);
      } catch (error) {
        setError(error instanceof Error ? error.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchTaxSchedules();
  }, [organization]);

  return { taxSchedules, loading, error };
} 