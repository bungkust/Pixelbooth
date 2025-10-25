'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useKioskStore } from '@/stores/kiosk-store'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PrinterConfig } from '@/types'

export default function PrinterSetup() {
  const router = useRouter()
  const { setPrinterConfig, setPrinterReady } = useKioskStore()
  
  const [connectionType, setConnectionType] = useState<'LAN' | 'Proxy' | 'WebUSB'>('LAN')
  const [host, setHost] = useState('192.168.1.100')
  const [port, setPort] = useState(9100)
  const [paper, setPaper] = useState<'58mm' | '80mm'>('58mm')
  const [density, setDensity] = useState(8)
  const [isTesting, setIsTesting] = useState(false)
  const [testResult, setTestResult] = useState<'idle' | 'success' | 'error'>('idle')

  const handleTestConnection = async () => {
    setIsTesting(true)
    setTestResult('idle')

    try {
      const config: PrinterConfig = {
        host,
        port,
        paper,
        dpi: 203,
        density,
        connection: connectionType
      }

      let success = false
      switch (connectionType) {
        case 'LAN':
          success = await testLANConnection(host, port)
          break
        case 'Proxy':
          success = await testProxyConnection(host, port)
          break
        case 'WebUSB':
          success = await testWebUSBConnection()
          break
      }

      if (success) {
        setTestResult('success')
        setPrinterConfig(config)
        setPrinterReady(true)
        setTimeout(() => {
          router.push('/preflight')
        }, 2000)
      } else {
        setTestResult('error')
      }
    } catch (error) {
      console.error('Test failed:', error)
      setTestResult('error')
    } finally {
      setIsTesting(false)
    }
  }

  const testLANConnection = async (host: string, port: number): Promise<boolean> => {
    try {
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
    <div className="kiosk-mode flex items-center justify-center bg-gray-50 p-8">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Printer Setup</CardTitle>
          <CardDescription className="text-center">
            Configure your thermal printer connection
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Connection Type */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Connection Type</label>
            <div className="grid grid-cols-3 gap-2">
              {(['LAN', 'Proxy', 'WebUSB'] as const).map((type) => (
                <Button
                  key={type}
                  variant={connectionType === type ? 'default' : 'outline'}
                  onClick={() => setConnectionType(type)}
                  className="kiosk-button"
                >
                  {type}
                </Button>
              ))}
            </div>
          </div>

          {/* Host and Port */}
          {connectionType !== 'WebUSB' && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Host/IP Address</label>
                <input
                  type="text"
                  value={host}
                  onChange={(e) => setHost(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                  placeholder="192.168.1.100"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Port</label>
                <input
                  type="number"
                  value={port}
                  onChange={(e) => setPort(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                  placeholder="9100"
                />
              </div>
            </div>
          )}

          {/* Paper Size */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Paper Size</label>
            <div className="grid grid-cols-2 gap-2">
              {(['58mm', '80mm'] as const).map((size) => (
                <Button
                  key={size}
                  variant={paper === size ? 'default' : 'outline'}
                  onClick={() => setPaper(size)}
                  className="kiosk-button"
                >
                  {size}
                </Button>
              ))}
            </div>
          </div>

          {/* Density */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Print Density (1-15)</label>
            <input
              type="range"
              min="1"
              max="15"
              value={density}
              onChange={(e) => setDensity(Number(e.target.value))}
              className="w-full"
            />
            <div className="text-center text-sm text-gray-600">{density}</div>
          </div>

          {/* Test Result */}
          {testResult !== 'idle' && (
            <div className={`p-4 rounded-md text-center ${
              testResult === 'success' 
                ? 'bg-green-100 text-green-800 border border-green-200' 
                : 'bg-red-100 text-red-800 border border-red-200'
            }`}>
              {testResult === 'success' 
                ? '✓ Printer connection successful!' 
                : '✗ Printer connection failed. Please check settings.'}
            </div>
          )}

          {/* Test Button */}
          <Button
            onClick={handleTestConnection}
            disabled={isTesting}
            className="w-full kiosk-button"
            size="xl"
          >
            {isTesting ? 'Testing Connection...' : 'Test & Save Configuration'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
