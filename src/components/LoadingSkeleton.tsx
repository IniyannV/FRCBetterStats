export function CardSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="panel animate-pulse rounded-lg p-5">
          <div className="h-5 w-2/3 rounded bg-slate-200 dark:bg-slate-800" />
          <div className="mt-4 h-4 w-full rounded bg-slate-200 dark:bg-slate-800" />
          <div className="mt-2 h-4 w-1/2 rounded bg-slate-200 dark:bg-slate-800" />
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 8, columns = 6 }: { rows?: number; columns?: number }) {
  return (
    <div className="panel overflow-hidden rounded-lg">
      <div className="animate-pulse overflow-x-auto">
        <table className="min-w-full">
          <tbody>
            {Array.from({ length: rows }).map((_, row) => (
              <tr key={row} className="border-b border-slate-200 dark:border-slate-800">
                {Array.from({ length: columns }).map((__, column) => (
                  <td key={column} className="p-4">
                    <div className="h-4 rounded bg-slate-200 dark:bg-slate-800" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
