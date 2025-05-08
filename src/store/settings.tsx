"use client";
import { createContext, useContext, useRef, useCallback } from "react";

import { ObservablePersistLocalStorage } from "@legendapp/state/persist-plugins/local-storage";
import { useObservableSyncedQuery } from "@legendapp/state/sync-plugins/tanstack-react-query";
import { useObservable } from "@legendapp/state/react";
import { OrganizationDetails } from "./app";


function useFormState() {
  const serverState = useRef<Record<string, string>>({});
  const formState$ = useObservable();
  const state$ = useObservableSyncedQuery<OrganizationDetails>({
    query: {
      queryKey: ['organization'],
      queryFn: async () => {
        return fetch(`/api/organization`).then(v => v.json());
      },
      refetchOnMount: false,
    },
    mutation: {
      mutationFn: async function <Organization>(variables: Organization) {
        const sendData: Partial<Organization> = {};
        for (const k in serverState.current) {
          const key = k as keyof Organization;
          if (variables[key] !== serverState.current[key as string]) {
            sendData[key] = variables[key];
          }
        }
        return fetch(`/api/organization`, {
          method: 'POST',
          body: JSON.stringify(sendData),
        }).then(v => v.json());
      },
    },
    transform: {
      load: (data: OrganizationDetails) => {
        formState$.assign({ ...data });
        serverState.current = { ...data };
        return data;
      },
    },
    persist: {
      plugin: ObservablePersistLocalStorage,
      retrySync: true,
      name: 'organization',
    },
  });

  const onSave = useCallback(() => {
    state$.assign(formState$.get());
  }, [state$, formState$]);

  return { formState$, state$, onSave };
}

export const OrganizationContext = createContext<ReturnType<
  typeof useFormState
> | null>(null);

export function OrganizationProvider({ children }: { children: React.ReactNode; }) {
  const formState = useFormState();
  return <OrganizationContext.Provider value={formState}>{children}</OrganizationContext.Provider>;
}

export function useOrganization() {
  const context = useContext(OrganizationContext);
  if (!context) {
    throw new Error("useOrganization must be used within a OrganizationProvider");
  }
  return context;
}
