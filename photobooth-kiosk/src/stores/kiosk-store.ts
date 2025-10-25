import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { KioskState, SessionState, PhotoSession, PrinterConfig } from '@/types'

interface KioskStore extends KioskState {
  // Actions
  setState: (state: SessionState) => void
  setPrinterConfig: (config: PrinterConfig) => void
  setPrinterReady: (ready: boolean) => void
  setCameraReady: (ready: boolean) => void
  setFullscreen: (fullscreen: boolean) => void
  setWakeLockActive: (active: boolean) => void
  setTapTapMode: (mode: boolean) => void
  setCurrentPhotoIndex: (index: number) => void
  addPhoto: (photo: string) => void
  setPhotos: (photos: string[]) => void
  createSession: (session: PhotoSession) => void
  updateSession: (updates: Partial<PhotoSession>) => void
  resetSession: () => void
  reset: () => void
}

const initialState: KioskState = {
  currentState: 'CREATED',
  isPrinterReady: false,
  isCameraReady: false,
  isFullscreen: false,
  isWakeLockActive: false,
  tapTapMode: false,
  currentPhotoIndex: 0,
  photos: []
}

export const useKioskStore = create<KioskStore>()(
  persist(
    (set, get) => ({
      ...initialState,
      
      setState: (state) => set({ currentState: state }),
      
      setPrinterConfig: (config) => set({ printerConfig: config }),
      
      setPrinterReady: (ready) => set({ isPrinterReady: ready }),
      
      setCameraReady: (ready) => set({ isCameraReady: ready }),
      
      setFullscreen: (fullscreen) => set({ isFullscreen: fullscreen }),
      
      setWakeLockActive: (active) => set({ isWakeLockActive: active }),
      
      setTapTapMode: (mode) => set({ tapTapMode: mode }),
      
      setCurrentPhotoIndex: (index) => set({ currentPhotoIndex: index }),
      
      addPhoto: (photo) => set((state) => ({
        photos: [...state.photos, photo],
        currentPhotoIndex: state.photos.length
      })),
      
      setPhotos: (photos) => set({ photos, currentPhotoIndex: 0 }),
      
      createSession: (session) => set({ session }),
      
      updateSession: (updates) => set((state) => ({
        session: state.session ? { ...state.session, ...updates } : undefined
      })),
      
      resetSession: () => set({
        session: undefined,
        photos: [],
        currentPhotoIndex: 0,
        currentState: 'CREATED'
      }),
      
      reset: () => set(initialState)
    }),
    {
      name: 'kiosk-storage',
      partialize: (state) => ({
        printerConfig: state.printerConfig,
        tapTapMode: state.tapTapMode
      })
    }
  )
)
