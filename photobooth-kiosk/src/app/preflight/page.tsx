'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useKioskStore } from '@/stores/kiosk-store'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Camera, Monitor, Zap, Printer, CheckCircle, XCircle } from 'lucide-react'

export default function Preflight() {
  const router = useRouter()
  const { 
    isPrinterReady, 
    setCameraReady, 
    setFullscreen, 
    setWakeLockActive,
    setPrinterReady 
  } = useKioskStore()

  const [checks, setChecks] = useState({
    camera: { status: 'pending' as 'pending' | 'success' | 'error', message: 'Checking camera access...' },
    fullscreen: { status: 'pending' as 'pending' | 'success' | 'error', message: 'Requesting fullscreen mode...' },
    wakeLock: { status: 'pending' as 'pending' | 'success' | 'error', message: 'Activating wake lock...' },
    printer: { status: 'pending' as 'pending' | 'success' | 'error', message: 'Testing printer connection...' }
  })

  const [isComplete, setIsComplete] = useState(false)
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    runPreflightChecks()
  }, [])

  const runPreflightChecks = async () => {
    setChecks(prev => ({
      camera: { status: 'pending', message: 'Checking camera access...' },
      fullscreen: { status: 'pending', message: 'Requesting fullscreen mode...' },
      wakeLock: { status: 'pending', message: 'Activating wake lock...' },
      printer: { status: 'pending', message: 'Testing printer connection...' }
    }))

    // Check camera
    await checkCamera()
    
    // Check fullscreen
    await checkFullscreen()
    
    // Check wake lock
    await checkWakeLock()
    
    // Check printer
    await checkPrinter()
  }

  const checkCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'user',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        } 
      })
      
      // Stop the stream immediately as we just need to test access
      stream.getTracks().forEach(track => track.stop())
      
      setChecks(prev => ({
        ...prev,
        camera: { status: 'success', message: 'Camera access granted' }
      }))
      setCameraReady(true)
    } catch (error) {
      console.error('Camera check failed:', error)
      setChecks(prev => ({
        ...prev,
        camera: { status: 'error', message: 'Camera access denied' }
      }))
      setCameraReady(false)
    }
  }

  const checkFullscreen = async () => {
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen()
        setChecks(prev => ({
          ...prev,
          fullscreen: { status: 'success', message: 'Fullscreen mode activated' }
        }))
        setFullscreen(true)
      } else {
        throw new Error('Fullscreen not supported')
      }
    } catch (error) {
      console.error('Fullscreen check failed:', error)
      setChecks(prev => ({
        ...prev,
        fullscreen: { status: 'error', message: 'Fullscreen not available' }
      }))
      setFullscreen(false)
    }
  }

  const checkWakeLock = async () => {
    try {
      if ('wakeLock' in navigator) {
        const wakeLock = await (navigator as any).wakeLock.request('screen')
        
        // Handle wake lock release
        wakeLock.addEventListener('release', () => {
          console.log('Wake lock released')
          setWakeLockActive(false)
        })
        
        setChecks(prev => ({
          ...prev,
          wakeLock: { status: 'success', message: 'Wake lock activated' }
        }))
        setWakeLockActive(true)
      } else {
        throw new Error('Wake lock not supported')
      }
    } catch (error) {
      console.error('Wake lock check failed:', error)
      setChecks(prev => ({
        ...prev,
        wakeLock: { status: 'error', message: 'Wake lock not supported' }
      }))
      setWakeLockActive(false)
    }
  }

  const checkPrinter = async () => {
    try {
      if (isPrinterReady) {
        setChecks(prev => ({
          ...prev,
          printer: { status: 'success', message: 'Printer ready' }
        }))
      } else {
        throw new Error('Printer not ready')
      }
    } catch (error) {
      console.error('Printer check failed:', error)
      setChecks(prev => ({
        ...prev,
        printer: { status: 'error', message: 'Printer not ready' }
      }))
      setPrinterReady(false)
    }
  }

  useEffect(() => {
    const allChecks = Object.values(checks)
    const allSuccess = allChecks.every(check => check.status === 'success')
    const hasError = allChecks.some(check => check.status === 'error')
    const allComplete = allChecks.every(check => check.status !== 'pending')

    if (allComplete) {
      if (allSuccess) {
        setIsComplete(true)
        setTimeout(() => {
          router.push('/kiosk')
        }, 2000)
      } else if (hasError) {
        setIsComplete(false)
      }
    }
  }, [checks, router])

  const handleRetry = () => {
    setRetryCount(prev => prev + 1)
    runPreflightChecks()
  }

  const getProgress = () => {
    const completed = Object.values(checks).filter(check => check.status !== 'pending').length
    return (completed / Object.keys(checks).length) * 100
  }

  const CheckIcon = ({ status }: { status: 'pending' | 'success' | 'error' }) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-6 w-6 text-green-600" />
      case 'error':
        return <XCircle className="h-6 w-6 text-red-600" />
      default:
        return <div className="h-6 w-6 rounded-full border-2 border-gray-300 animate-pulse" />
    }
  }

  return (
    <div className="kiosk-mode flex items-center justify-center bg-gray-50 p-8">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">System Check</CardTitle>
          <CardDescription className="text-center">
            Verifying all systems are ready for photobooth operation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>{Math.round(getProgress())}%</span>
            </div>
            <Progress value={getProgress()} className="h-2" />
          </div>

          {/* Check Items */}
          <div className="space-y-4">
            {Object.entries(checks).map(([key, check]) => (
              <div key={key} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-md">
                <CheckIcon status={check.status} />
                <div className="flex-1">
                  <div className="font-medium capitalize">{key}</div>
                  <div className="text-sm text-gray-600">{check.message}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Status Messages */}
          {isComplete && (
            <div className="p-4 bg-green-100 text-green-800 border border-green-200 rounded-md text-center">
              ✓ All systems ready! Starting photobooth...
            </div>
          )}

          {!isComplete && Object.values(checks).some(check => check.status === 'error') && (
            <div className="space-y-4">
              <div className="p-4 bg-red-100 text-red-800 border border-red-200 rounded-md text-center">
                ✗ Some checks failed. Please resolve issues and retry.
              </div>
              <Button
                onClick={handleRetry}
                className="w-full kiosk-button"
                size="xl"
              >
                Retry ({retryCount + 1})
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
