export function CodePreview() {
  return (
    <div className="mx-auto mt-14 max-w-2xl overflow-hidden rounded-xl border border-slate-200 bg-slate-900 text-left shadow-lg">
      <div className="flex items-center gap-1.5 border-b border-slate-700/50 px-4 py-3">
        <span className="h-3 w-3 rounded-full bg-red-400" />
        <span className="h-3 w-3 rounded-full bg-amber-400" />
        <span className="h-3 w-3 rounded-full bg-green-400" />
        <span className="ml-3 text-xs text-slate-400">curl</span>
      </div>
      <pre className="scroll-thin overflow-x-auto px-4 py-4 text-sm leading-relaxed text-slate-100">
        <code>{`curl -X POST https://your-app/api/v1/notes \\
  -H "Authorization: Bearer mapi_•••••••••" \\
  -H "Content-Type: application/json" \\
  -d '{ "title": "Hello", "done": false }'`}</code>
      </pre>
    </div>
  );
}
