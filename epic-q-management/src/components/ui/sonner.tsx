"use client"

import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-4 text-green-600" />,
        info: <InfoIcon className="size-4 text-blue-600" />,
        warning: <TriangleAlertIcon className="size-4 text-yellow-600" />,
        error: <OctagonXIcon className="size-4 text-red-600" />,
        loading: <Loader2Icon className="size-4 animate-spin text-gray-600" />,
      }}
      toastOptions={{
        style: {
          background: 'white',
          border: '1px solid #e5e7eb',
          color: '#1f2937',
        },
        classNames: {
          success: '!bg-green-100 !border-green-300 !text-green-900',
          error: '!bg-red-100 !border-red-300 !text-red-900',
          warning: '!bg-yellow-100 !border-yellow-300 !text-yellow-900',
          info: '!bg-blue-100 !border-blue-300 !text-blue-900',
          description: '!text-green-800',
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
