import './globals.css'
import { AuthProvider } from './contexts/AuthContext'

export const metadata = {
  title: 'CycleOS - 週次サイクルで目標達成',
  description: 'AIコーチと一緒に週次サイクルを回して目標を達成しよう',
}

export default function RootLayout({ children }) {
  return (
    <html lang="ja">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
