export default function DashboardLoading() {
    return (
        <div className="w-full space-y-6 animate-pulse">
            {/* Top indeterminate progress bar */}
            <div className="fixed top-0 left-0 right-0 h-1 z-50 overflow-hidden bg-primary/20">
                <div className="h-full bg-primary animate-indeterminate" />
            </div>

            {/* Header skeleton */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-2">
                    <div className="h-8 w-48 bg-muted rounded-lg" />
                    <div className="h-4 w-72 bg-muted/60 rounded" />
                </div>
                <div className="flex items-center gap-3">
                    <div className="h-10 w-28 bg-muted rounded-xl" />
                    <div className="h-10 w-32 bg-muted rounded-xl" />
                </div>
            </div>

            {/* Summary stat cards skeleton */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="glass-card p-5 space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="h-4 w-20 bg-muted rounded" />
                            <div className="w-9 h-9 rounded-xl bg-muted" />
                        </div>
                        <div className="h-7 w-24 bg-muted rounded-lg" />
                        <div className="h-3 w-32 bg-muted/50 rounded" />
                    </div>
                ))}
            </div>

            {/* Content area / table skeleton */}
            <div className="glass-card p-6 space-y-4">
                <div className="flex items-center justify-between">
                    <div className="h-6 w-36 bg-muted rounded-lg" />
                    <div className="h-9 w-64 bg-muted rounded-xl" />
                </div>
                <div className="space-y-3 pt-2">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="h-12 w-full bg-muted/40 rounded-xl" />
                    ))}
                </div>
            </div>
        </div>
    );
}
