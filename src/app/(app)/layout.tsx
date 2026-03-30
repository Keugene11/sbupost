import BottomNav from '@/components/BottomNav'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg pb-24">
      <div className="relative" style={{ zIndex: 1 }}>
        {children}
      </div>
      <BottomNav />
    </div>
  )
}
