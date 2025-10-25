'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useKioskStore } from '@/stores/kiosk-store'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Camera, RotateCcw, Check, X, Download } from 'lucide-react'
import { generateDownloadCode } from '@/lib/utils'
import { ThermalPrinter } from '@/lib/thermal-printer'
import { createCollage } from '@/lib/collage-generator'
import { getLayoutByName } from '@/lib/layouts'

export default function Kiosk() {
  const router = useRouter()
  const { 
    currentState, 
    photos, 
    addPhoto, 
    setPhotos, 
    setState, 
    createSession,
    tapTapMode,
    setTapTapMode
  } = useKioskStore()

  const [stream, setStream] = useState<MediaStream | null>(null)
  const [countdown, setCountdown] = useState(0)
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)
  const [showInstructions, setShowInstructions] = useState(true)
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    initializeCamera()
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
      }
    }
  }, [])

  useEffect(() => {
    if (currentState === 'CREATED' && photos.length === 0) {
      setShowInstructions(true)
    }
  }, [currentState, photos.length])

  const initializeCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'user',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      })
      setStream(mediaStream)
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
      }
    } catch (error) {
      console.error('Camera initialization failed:', error)
    }
  }

  const startCapture = () => {
    setShowInstructions(false)
    setState('CAPTURING')
    setCurrentPhotoIndex(0)
    setPhotos([])
    capturePhoto()
  }

  const capturePhoto = () => {
    if (countdown > 0) return

    setCountdown(3)
    const countdownInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownInterval)
          takePhoto()
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const takePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')

    if (!ctx) return

    // Set canvas size to match video
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    // Draw video frame to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    // Convert to blob
    canvas.toBlob((blob) => {
      if (blob) {
        const photoUrl = URL.createObjectURL(blob)
        addPhoto(photoUrl)
        
        if (photos.length + 1 < 3) {
          setCurrentPhotoIndex(photos.length + 1)
          setTimeout(() => capturePhoto(), 1000)
        } else {
          setState('REVIEW')
        }
      }
    }, 'image/webp', 0.9)
  }

  const retakePhoto = (index: number) => {
    const newPhotos = [...photos]
    newPhotos.splice(index, 1)
    setPhotos(newPhotos)
    setCurrentPhotoIndex(index)
    setState('CAPTURING')
    capturePhoto()
  }

  const confirmPhotos = async () => {
    if (photos.length === 3) {
      // Create session
      const downloadCode = generateDownloadCode()
      const session = {
        id: `session_${Date.now()}`,
        download_code: downloadCode,
        photos: photos,
        layout: 'Strip 58 – Classic',
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
        paper: '58mm' as const,
        booth_name: 'Photobooth Kiosk',
        checksum: ''
      }
      
      createSession(session)
      setState('COMPOSING')
      
      try {
        // Generate collage
        const layout = getLayoutByName('Strip 58 – Classic')
        if (!layout) throw new Error('Layout not found')
        
        const downloadUrl = `${window.location.origin}/d/${downloadCode}`
        const collageImageData = await createCollage({
          photos: photos,
          layout: layout,
          boothName: 'Photobooth Kiosk',
          downloadCode: downloadCode,
          downloadUrl: downloadUrl
        })
        
        setState('PRINTING')
        
        // Print collage
        const printerConfig = useKioskStore.getState().printerConfig
        if (printerConfig) {
          const printer = new ThermalPrinter(printerConfig)
          const printSuccess = await printer.printImage(collageImageData, layout)
          
          if (printSuccess) {
            setState('PRINTED')
            showDownloadQR()
          } else {
            setState('ERROR')
            // Retry printing after 3 seconds
            setTimeout(() => {
              setState('PRINTING')
              confirmPhotos()
            }, 3000)
          }
        } else {
          // No printer configured, just show QR
          setState('PRINTED')
          showDownloadQR()
        }
      } catch (error) {
        console.error('Collage generation or printing failed:', error)
        setState('ERROR')
        // Retry after 3 seconds
        setTimeout(() => {
          setState('PRINTING')
          confirmPhotos()
        }, 3000)
      }
    }
  }

  const showDownloadQR = () => {
    // Show QR code for download
    setTimeout(() => {
      setState('CREATED')
      setPhotos([])
      setCurrentPhotoIndex(0)
      setShowInstructions(true)
    }, 10000) // Auto reset after 10 seconds
  }

  const renderReadyScreen = () => (
    <div className="kiosk-mode flex flex-col items-center justify-center bg-gray-50 h-screen">
      <Card className="w-full max-w-2xl mx-8">
        <CardHeader className="text-center">
          <CardTitle className="text-4xl font-bold mb-4">📸 Photobooth Ready</CardTitle>
          <CardDescription className="text-xl">
            {tapTapMode 
              ? 'Tap anywhere to start and capture 3 photos automatically'
              : 'Ready to capture 3 amazing photos!'
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!tapTapMode && (
            <div className="text-center space-y-4">
              <div className="text-lg">
                <p>• Look at the camera</p>
                <p>• Smile for each photo</p>
                <p>• Get your printed strip!</p>
              </div>
            </div>
          )}
          
          <div className="flex flex-col space-y-4">
            <Button
              onClick={startCapture}
              className="kiosk-button"
              size="xl"
            >
              <Camera className="mr-2 h-6 w-6" />
              {tapTapMode ? 'Tap to Start' : 'Start Taking Photos'}
            </Button>
            
            <Button
              variant="outline"
              onClick={() => setTapTapMode(!tapTapMode)}
              className="kiosk-button"
            >
              {tapTapMode ? 'Switch to Manual Mode' : 'Switch to Tap-Tap Mode'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderCapturingScreen = () => (
    <div className="kiosk-mode flex flex-col items-center justify-center bg-gray-50 h-screen">
      <div className="relative w-full max-w-4xl">
        {/* Camera Feed */}
        <div className="relative bg-black rounded-lg overflow-hidden">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-auto"
          />
          
          {/* Countdown Overlay */}
          {countdown > 0 && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
              <div className="text-white text-8xl font-bold">
                {countdown}
              </div>
            </div>
          )}
          
          {/* Photo Counter */}
          <div className="absolute top-4 left-4 bg-black bg-opacity-75 text-white px-4 py-2 rounded-md">
            Photo {currentPhotoIndex + 1} of 3
          </div>
        </div>
        
        {/* Progress */}
        <div className="mt-4">
          <Progress value={(currentPhotoIndex / 3) * 100} className="h-2" />
        </div>
      </div>
      
      <canvas ref={canvasRef} className="hidden" />
    </div>
  )

  const renderReviewScreen = () => (
    <div className="kiosk-mode flex flex-col items-center justify-center bg-gray-50 h-screen p-8">
      <Card className="w-full max-w-6xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Review Your Photos</CardTitle>
          <CardDescription className="text-center">
            Tap any photo to retake it, or confirm to proceed
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 mb-6">
            {photos.map((photo, index) => (
              <div key={index} className="relative group">
                <img
                  src={photo}
                  alt={`Photo ${index + 1}`}
                  className="w-full h-64 object-cover rounded-lg border-2 border-gray-200"
                />
                <Button
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => retakePhoto(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
                <div className="absolute bottom-2 left-2 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-sm">
                  Photo {index + 1}
                </div>
              </div>
            ))}
          </div>
          
          <div className="flex justify-center space-x-4">
            <Button
              variant="outline"
              onClick={() => setState('CAPTURING')}
              className="kiosk-button"
            >
              <RotateCcw className="mr-2 h-5 w-5" />
              Retake All
            </Button>
            <Button
              onClick={confirmPhotos}
              className="kiosk-button"
              size="xl"
            >
              <Check className="mr-2 h-5 w-5" />
              Confirm & Print
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderProcessingScreen = () => (
    <div className="kiosk-mode flex flex-col items-center justify-center bg-gray-50 h-screen">
      <Card className="w-full max-w-2xl mx-8">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">
            {currentState === 'COMPOSING' ? 'Creating Your Collage' : 'Printing Your Photos'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-black mx-auto mb-4"></div>
            <p className="text-lg">
              {currentState === 'COMPOSING' 
                ? 'Generating your photo strip...' 
                : 'Sending to printer...'
              }
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderDownloadScreen = () => (
    <div className="kiosk-mode flex flex-col items-center justify-center bg-gray-50 h-screen">
      <Card className="w-full max-w-2xl mx-8">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Your Photos Are Ready!</CardTitle>
          <CardDescription>
            Scan the QR code to download your photos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <div className="bg-white p-4 rounded-lg border-2 border-gray-200 inline-block">
              <div className="w-48 h-48 bg-gray-200 rounded flex items-center justify-center">
                <Download className="h-16 w-16 text-gray-400" />
              </div>
            </div>
            <p className="mt-4 text-lg font-mono">
              Code: {useKioskStore.getState().session?.download_code}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderErrorScreen = () => (
    <div className="kiosk-mode flex flex-col items-center justify-center bg-gray-50 h-screen">
      <Card className="w-full max-w-2xl mx-8">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-red-600">Print Error</CardTitle>
          <CardDescription>
            There was an issue printing your photos. Retrying...
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-red-600 mx-auto mb-4"></div>
            <p className="text-lg">
              Attempting to print again...
            </p>
          </div>
          <div className="flex justify-center space-x-4">
            <Button
              variant="outline"
              onClick={() => setState('CREATED')}
              className="kiosk-button"
            >
              Start Over
            </Button>
            <Button
              onClick={() => setState('PRINTING')}
              className="kiosk-button"
            >
              Retry Print
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  // Render based on current state
  switch (currentState) {
    case 'CREATED':
      return renderReadyScreen()
    case 'CAPTURING':
      return renderCapturingScreen()
    case 'REVIEW':
      return renderReviewScreen()
    case 'COMPOSING':
    case 'PRINTING':
      return renderProcessingScreen()
    case 'PRINTED':
      return renderDownloadScreen()
    case 'ERROR':
      return renderErrorScreen()
    default:
      return renderReadyScreen()
  }
}
