'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'

export default function DownloadPage() {
  const params = useParams()
  const code = params.code as string
  
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (code) {
      fetchSession(code)
    }
  }, [code])

  const fetchSession = async (downloadCode: string) => {
    try {
      setLoading(true)
      // In a real implementation, this would fetch from your API
      // For now, we'll simulate a session
      const mockSession = {
        id: `session_${Date.now()}`,
        download_code: downloadCode,
        photos: [
          '/placeholder-photo-1.jpg',
          '/placeholder-photo-2.jpg', 
          '/placeholder-photo-3.jpg'
        ],
        collage: '/placeholder-collage.jpg',
        layout: 'Strip 58 – Classic',
        created_at: new Date().toISOString(),
        booth_name: 'Photobooth Kiosk'
      }
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      setSession(mockSession)
    } catch (err) {
      setError('Session not found or expired')
    } finally {
      setLoading(false)
    }
  }

  const downloadPhoto = (photoUrl: string, filename: string) => {
    const link = document.createElement('a')
    link.href = photoUrl
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const downloadAll = () => {
    if (session) {
      session.photos.forEach((photo: string, index: number) => {
        downloadPhoto(photo, `photobooth-${session.download_code}-${index + 1}.jpg`)
      })
      if (session.collage) {
        downloadPhoto(session.collage, `photobooth-${session.download_code}-collage.jpg`)
      }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-lg">Loading your photos...</p>
        </div>
      </div>
    )
  }

  if (error || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md mx-8">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-red-600">Session Not Found</CardTitle>
            <CardDescription>
              The download code may be invalid or expired
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600 mb-4">
              Code: <span className="font-mono">{code}</span>
            </p>
            <Button 
              onClick={() => window.location.href = '/'}
              className="kiosk-button"
            >
              Back to Photobooth
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <Card className="mb-8">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold">Your Photobooth Photos</CardTitle>
            <CardDescription className="text-lg">
              Download code: <span className="font-mono font-bold">{session.download_code}</span>
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Individual Photos */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-xl">Individual Photos</CardTitle>
            <CardDescription>Download each photo separately</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {session.photos.map((photo: string, index: number) => (
                <div key={index} className="text-center">
                  <div className="bg-white p-4 rounded-lg border-2 border-gray-200 mb-4">
                    <div className="w-full h-64 bg-gray-200 rounded flex items-center justify-center">
                      <span className="text-gray-500">Photo {index + 1}</span>
                    </div>
                  </div>
                  <Button
                    onClick={() => downloadPhoto(photo, `photobooth-${session.download_code}-${index + 1}.jpg`)}
                    className="kiosk-button"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download Photo {index + 1}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Collage */}
        {session.collage && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-xl">Photo Strip</CardTitle>
              <CardDescription>Download your printed photo strip</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="bg-white p-4 rounded-lg border-2 border-gray-200 mb-4 inline-block">
                  <div className="w-96 h-48 bg-gray-200 rounded flex items-center justify-center">
                    <span className="text-gray-500">Photo Strip Preview</span>
                  </div>
                </div>
                <div>
                  <Button
                    onClick={() => downloadPhoto(session.collage, `photobooth-${session.download_code}-strip.jpg`)}
                    className="kiosk-button"
                    size="lg"
                  >
                    <Download className="mr-2 h-5 w-5" />
                    Download Photo Strip
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Download All */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Download All</CardTitle>
            <CardDescription>Download all photos and the photo strip at once</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button
              onClick={downloadAll}
              className="kiosk-button"
              size="xl"
            >
              <Download className="mr-2 h-6 w-6" />
              Download All Photos
            </Button>
          </CardContent>
        </Card>

        {/* Session Info */}
        <div className="mt-8 text-center text-sm text-gray-600">
          <p>Session created: {new Date(session.created_at).toLocaleString()}</p>
          <p>Booth: {session.booth_name}</p>
        </div>
      </div>
    </div>
  )
}
