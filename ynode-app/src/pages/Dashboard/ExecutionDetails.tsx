import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  Terminal,
  FileJson,
  Loader2,
  Activity,
} from 'lucide-react';
import { fetchExecution, type Execution } from '@/api/workflowApi';
import { formatDistanceToNow } from 'date-fns';

export function ExecutionDetails() {
  const { executionId } = useParams<{ executionId: string }>();
  const [execution, setExecution] = useState<Execution | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!executionId) return;
    loadExecution(executionId);
  }, [executionId]);

  const loadExecution = async (id: string) => {
    try {
      setLoading(true);
      const data = await fetchExecution(id);
      setExecution(data);
    } catch (err) {
      setError('Failed to load execution details');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'success':
        return 'border-emerald-500/20 text-emerald-400 bg-emerald-500/10 shadow-[0_0_15px_-3px_theme(colors.emerald.500/0.2)]';
      case 'error':
        return 'border-red-500/20 text-red-400 bg-red-500/10 shadow-[0_0_15px_-3px_theme(colors.red.500/0.2)]';
      case 'running':
        return 'border-blue-500/20 text-blue-400 bg-blue-500/10 animate-pulse';
      default:
        return 'border-zinc-500/20 text-zinc-400 bg-zinc-500/10';
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 min-h-[60vh]">
        <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
        <p className="text-zinc-500 animate-pulse">
          Loading execution details...
        </p>
      </div>
    );
  }

  if (error || !execution) {
    return (
      <div className="flex flex-col items-center justify-center p-20 min-h-[60vh] text-center">
        <div className="h-20 w-20 rounded-full bg-red-500/10 flex items-center justify-center mb-6 border border-red-500/20">
          <XCircle className="h-10 w-10 text-red-500" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">
          Error Loading Execution
        </h2>
        <p className="text-zinc-400 mb-8 max-w-sm">
          {error || 'Execution not found or deleted.'}
        </p>
        <Link
          to="/executions"
          className="px-6 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/5 hover:border-white/10 transition-all font-medium"
        >
          Return to Execution History
        </Link>
      </div>
    );
  }

  const duration =
    execution.completedAt && execution.startedAt
      ? new Date(execution.completedAt).getTime() -
        new Date(execution.startedAt).getTime()
      : null;

  return (
    <div className="space-y-8 max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <Link
          to="/executions"
          className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-white transition-colors mb-6 group"
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
          Back to History
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-4 mb-2">
              <h1 className="text-3xl font-bold text-white tracking-tight">
                Execution Details
              </h1>
              <div
                className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border flex items-center gap-2 ${getStatusStyle(execution.status)}`}
              >
                {execution.status === 'success' && (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                )}
                {execution.status === 'error' && (
                  <XCircle className="h-3.5 w-3.5" />
                )}
                {execution.status === 'running' && (
                  <Activity className="h-3.5 w-3.5" />
                )}
                {execution.status}
              </div>
            </div>
            <div className="flex items-center gap-6 text-sm text-zinc-400">
              <span className="font-mono bg-white/5 px-2 py-0.5 rounded border border-white/5 text-zinc-300">
                {execution.id}
              </span>
              <span className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-zinc-500" />
                {formatDistanceToNow(new Date(execution.startedAt), {
                  addSuffix: true,
                })}
              </span>
              {duration && (
                <span className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-zinc-500" />
                  <span className="font-mono">{duration}ms</span>
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-zinc-900/40 border border-white/5 overflow-hidden backdrop-blur-sm shadow-2xl relative">
        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />
        <div className="p-5 border-b border-white/5 bg-white/[0.02] flex items-center justify-between relative z-10">
          <h2 className="font-semibold text-white flex items-center gap-2.5">
            <Terminal className="h-4 w-4 text-primary" />
            Execution Log Stream
          </h2>
          <span className="text-xs font-medium text-zinc-500 uppercase tracking-widest">
            {execution.logs.length} Steps
          </span>
        </div>

        <div className="relative p-6 space-y-8">
          <div className="absolute top-10 bottom-10 left-[2.85rem] w-px bg-white/5" />

          {execution.logs.length === 0 ? (
            <div className="py-12 text-center text-zinc-500 italic">
              Waiting for execution logs...
            </div>
          ) : (
            execution.logs.map((log, index) => (
              <div key={index} className="relative z-10 group">
                <div className="flex items-start gap-4">
                  <div
                    className={`mt-1.5 h-3 w-3 rounded-full shrink-0 ring-4 ring-zinc-950 z-20 ${
                      log.status === 'success'
                        ? 'bg-emerald-500 shadow-[0_0_10px_theme(colors.emerald.500)]'
                        : log.status === 'error'
                          ? 'bg-red-500 shadow-[0_0_10px_theme(colors.red.500)]'
                          : 'bg-blue-500 shadow-[0_0_10px_theme(colors.blue.500)]'
                    }`}
                  />

                  <div className="flex-1 min-w-0 bg-zinc-900/50 rounded-xl border border-white/5 p-4 hover:border-white/10 hover:bg-zinc-900/80 transition-all">
                    <div className="flex items-center justify-between gap-4 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-zinc-200">
                          {log.nodeName}
                        </span>
                        <span className="text-[10px] text-zinc-500 font-mono bg-white/5 px-1.5 py-0.5 rounded opacity-60 group-hover:opacity-100 transition-opacity">
                          {log.nodeId}
                        </span>
                      </div>
                      <span className="text-xs text-zinc-500 font-mono tabular-nums">
                        {new Date(log.timestamp).toLocaleTimeString()}
                        <span className="text-zinc-700 ml-0.5 text-[10px]">
                          .
                          {new Date(log.timestamp)
                            .getMilliseconds()
                            .toString()
                            .padStart(3, '0')}
                        </span>
                      </span>
                    </div>

                    <p className="text-sm text-zinc-400 break-words leading-relaxed">
                      {String(log.message)}
                    </p>

                    {(() => {
                      const data = log.data;
                      if (
                        data &&
                        typeof data === 'object' &&
                        !Array.isArray(data) &&
                        Object.keys(data).length > 0
                      ) {
                        return (
                          <div className="mt-3">
                            <details className="group/details">
                              <summary className="flex items-center gap-2 text-xs font-medium text-zinc-500 cursor-pointer hover:text-zinc-300 transition-colors select-none">
                                <FileJson className="h-3.5 w-3.5" />
                                <span>View Output Data</span>
                              </summary>
                              <div className="mt-2 text-xs font-mono bg-black/50 rounded-lg border border-white/5 p-3 overflow-x-auto text-zinc-400 animate-in slide-in-from-top-2 fade-in duration-200">
                                <pre>{JSON.stringify(data, null, 2)}</pre>
                              </div>
                            </details>
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
