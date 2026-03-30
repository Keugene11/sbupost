import BottomNav from '@/components/BottomNav'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="min-h-screen bg-bg pb-24" style={{ position: 'relative', zIndex: 0 }}>
        {children}
      </div>
      <BottomNav />
    </>
  )
}
