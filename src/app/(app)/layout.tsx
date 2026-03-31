import BottomNav from '@/components/BottomNav'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="bg-bg pb-24 relative z-0 isolate">
        {children}
      </div>
      <BottomNav />
    </>
  )
}
