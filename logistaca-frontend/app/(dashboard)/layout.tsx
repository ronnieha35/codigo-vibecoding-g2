import Sidebar from '@/components/layout/Sidebar'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-8 bg-zinc-50 dark:bg-zinc-900 overflow-auto">
        {children}
      </main>
    </div>
  )
}
