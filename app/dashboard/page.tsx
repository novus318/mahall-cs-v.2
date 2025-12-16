export default function DashboardPage() {
  return (
    <div className="grid auto-rows-min gap-4 md:grid-cols-3">
      <div className="bg-muted/50 aspect-video rounded-xl" />
      <div className="bg-muted/50 aspect-video rounded-xl" />
      <div className="bg-muted/50 aspect-video rounded-xl" />
      <div className="col-span-3 bg-muted/50 min-h-[50vh] rounded-xl" />
    </div>
  )
}
