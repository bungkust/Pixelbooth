'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useKioskStore } from '@/stores/kiosk-store'

export default function Bootstrap() {
  const router = useRouter()
  const { printerConfig, setPrinterReady } = useKioskStore()

  useEffect(() => {
    // Check if printer is configured
    if (!printerConfig) {
      // Redirect to printer setup
      router.push('/setup/printer')
      return
    }

    // Test printer connection
    testPrinterConnection()
      .then((isReady) => {
        setPrinterReady(isReady)
        if (isReady) {
          router.push('/preflight')
        } else {
          router.push('/setup/printer')
        }
      })
      .catch(() => {
        setPrinterReady(false)
        router.push('/setup/printer')
      })
  }, [printerConfig, router, setPrinterReady])

  const testPrinterConnection = async (): Promise<boolean> => {
    if (!printerConfig) return false

    try {
      // Test printer connection based on type
      switch (printerConfig.connection) {
        case 'LAN':
          return await testLANConnection(printerConfig.host, printerConfig.port)
        case 'Proxy':
          return await testProxyConnection(printerConfig.host, printerConfig.port)
        case 'WebUSB':
          return await testWebUSBConnection()
        default:
          return false
      }
    } catch (error) {
      console.error('Printer connection test failed:', error)
      return false
    }
  }

  const testLANConnection = async (host: string, port: number): Promise<boolean> => {
    try {
      // Simple TCP connection test
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)
      
      const response = await fetch(`http://${host}:${port}/status`, {
        method: 'GET',
        signal: controller.signal,
        mode: 'no-cors'
      })
      
      clearTimeout(timeoutId)
      return true
    } catch (error) {
      return false
    }
  }

  const testProxyConnection = async (host: string, port: number): Promise<boolean> => {
    try {
      const response = await fetch(`http://${host}:${port}/api/printer/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ test: true })
      })
      return response.ok
    } catch (error) {
      return false
    }
  }

  const testWebUSBConnection = async (): Promise<boolean> => {
    try {
      if (!navigator.usb) return false
      const devices = await navigator.usb.getDevices()
      return devices.length > 0
    } catch (error) {
      return false
    }
  }

  return (
    <div className="kiosk-mode flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
        <h1 className="text-2xl font-bold text-black mb-2">Initializing Photobooth</h1>
        <p className="text-gray-700">Checking printer configuration...</p>
      </div>
    </div>
  )
}
