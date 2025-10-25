# Photobooth Kiosk PWA

A Progressive Web Application (PWA) photobooth designed for kiosk mode. Users can capture 3 photos, create a collage/strip, print to thermal printer, and download via QR code.

## Features

- **PWA Support**: Installable, offline-first, works on any device
- **Kiosk Mode**: Fullscreen, touch-friendly interface
- **3-Photo Capture**: Automatic countdown and capture sequence
- **Thermal Printing**: ESC/POS support for 58mm and 80mm printers
- **QR Code Download**: Secure download system with signed URLs
- **Black & White Pixel Theme**: Optimized for thermal printing
- **Tap-Tap Mode**: Quick 2-tap operation for high-volume events

## Tech Stack

- **Next.js 16** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **shadcn/ui** for components
- **Zustand** for state management
- **IndexedDB** for offline storage
- **PWA** with service worker

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Thermal printer (58mm or 80mm)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd photobooth-kiosk
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### First Time Setup

1. **Printer Configuration**: The app will redirect to `/setup/printer` on first run
2. **System Check**: Complete the preflight checks for camera, fullscreen, and printer
3. **Ready to Use**: Start capturing photos in kiosk mode

## Printer Setup

The app supports three connection types:

### LAN Connection (Recommended)
- Direct TCP connection to printer
- Fastest and most reliable
- Requires printer IP address and port (usually 9100)

### Proxy Connection
- HTTP proxy for printer communication
- Useful for cloud printing or remote access
- Requires proxy server endpoint

### WebUSB Connection
- Direct USB connection via WebUSB API
- Limited browser support
- Requires user permission

## Usage

### Kiosk Mode
1. **Ready Screen**: Tap "Start Taking Photos" to begin
2. **Capture**: Look at camera, 3-2-1 countdown for each photo
3. **Review**: Check photos, retake if needed
4. **Print**: Automatic collage generation and printing
5. **Download**: QR code displayed for photo download

### Tap-Tap Mode
1. **First Tap**: Start capture sequence
2. **Second Tap**: Skip review, go directly to print
3. **Auto Reset**: Returns to ready screen after print

## Configuration

### Layout Presets
- **Strip 58 – Classic**: 3 photos + QR + booth name
- **Strip 58 – Compact QR**: Smaller QR code, more photo space
- **Grid 80 – 2x2**: 2x2 grid with logo slot
- **Poster 80 – XL Single**: Large single photo
- **Polaroid 80 – Caption**: Single photo with caption area

### Security Features
- **CSP Headers**: Strict content security policy
- **Permissions Policy**: Limited camera and USB access
- **Signed URLs**: Secure download links with expiration
- **Rate Limiting**: Protection against abuse

## Development

### Project Structure
```
src/
├── app/                 # Next.js app router pages
│   ├── setup/printer/   # Printer configuration
│   ├── preflight/       # System checks
│   ├── kiosk/          # Main photobooth interface
│   └── d/[code]/       # Download page
├── components/ui/       # Reusable UI components
├── lib/                # Utilities and layouts
├── stores/             # Zustand state management
└── types/              # TypeScript definitions
```

### Key Components
- **Bootstrap**: Initial setup and printer detection
- **Preflight**: Camera, fullscreen, and printer checks
- **Kiosk**: Main photobooth interface with state machine
- **Download**: QR code and photo download system

### State Management
The app uses a state machine with these states:
- `CREATED`: Initial state, ready to start
- `CAPTURING`: Taking photos (3 photos)
- `REVIEW`: Review and retake photos
- `COMPOSING`: Generating collage
- `PRINTING`: Sending to printer
- `PRINTED`: Displaying QR code
- `ERROR`: Error state with retry options

## Deployment

### Production Build
```bash
npm run build
npm start
```

### PWA Installation
1. Open the app in a supported browser
2. Look for the "Install" button in the address bar
3. Or use the browser menu to "Install App"

### Kiosk Deployment
1. Install the PWA on the target device
2. Configure browser to open in kiosk mode
3. Set up printer connection
4. Test all functionality before going live

## Browser Support

- **Chrome/Edge**: Full support including WebUSB
- **Firefox**: Full support except WebUSB
- **Safari**: Full support on iOS/macOS
- **Mobile**: Full PWA support

## Troubleshooting

### Camera Issues
- Ensure HTTPS in production
- Check browser permissions
- Try different camera constraints

### Printer Issues
- Verify network connectivity
- Check printer IP and port
- Test with printer utility first

### Performance Issues
- Use hardware acceleration
- Close unnecessary browser tabs
- Ensure adequate device memory

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:
- Create an issue on GitHub
- Check the troubleshooting section
- Review the documentation
