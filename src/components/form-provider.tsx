"use client"

import type * as React from "react"
import { FormProvider as HookFormProvider } from "react-hook-form"

interface FormProviderProps extends React.PropsWithChildren {
  methods: any
}

export function FormProvider({ children, methods }: FormProviderProps) {
  return <HookFormProvider {...methods}>{children}</HookFormProvider>
}

export function FormWrapper({ children, methods }: FormProviderProps) {
  return (
    <FormProvider methods={methods}>
      <form onSubmit={methods.handleSubmit}>{children}</form>
    </FormProvider>
  )
}
