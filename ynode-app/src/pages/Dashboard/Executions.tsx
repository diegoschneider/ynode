import { useEffect, useState } from 'react';
import {
  Clock,
  CheckCircle2,
  XCircle,
  Play,
  Calendar,
  Search,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import { fetchUserExecutions, type Execution } from '@/api/workflowApi';
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';

export function Executions() {
  const [executions, setExecutions] = useState<
    (Execution & { workflowName: string })[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadExecutions();
  }, []);

  const loadExecutions = async () => {
    try {
      setLoading(true);
      const data = await fetchUserExecutions(100);
      setExecutions(data);
    } catch (error) {
      console.error('Failed to load executions:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatusBadge = ({ status }: { status: string }) => {
    const styles = {
      success:
        'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_10px_-2px_theme(colors.emerald.500/0.3)]',
      error:
        'bg-red-500/10 text-red-400 border-red-500/20 shadow-[0_0_10px_-2px_theme(colors.red.500/0.3)]',
      running: 'bg-blue-500/10 text-blue-400 border-blue-500/20 animate-pulse',
      default: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
    };
    const style = styles[status as keyof typeof styles] || styles.default;

    return (
      <div
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${style}`}
      >
        {status === 'success' && <CheckCircle2 className="h-3 w-3" />}
        {status === 'error' && <XCircle className="h-3 w-3" />}
        {status === 'running' && (
          <Loader2 className="h-3 w-3 animate-spin flow-root" />
        )}
        <span className="capitalize">{status}</span>
      </div>
    );
  };

  const filteredExecutions = executions.filter(
    (ex) =>
      ex.workflowName?.toLowerCase().includes(search.toLowerCase()) ||
      ex.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">
            Execution History
          </h1>
          <p className="text-zinc-400 font-light">
            View and analyze your recent workflow runs.
          </p>
        </div>
      </div>

      <div className="relative group">
        <div className="absolute -inset-0.5 bg-primary rounded-xl opacity-20 group-focus-within:opacity-50 blur transition duration-500" />
        <div className="relative flex items-center bg-zinc-900/90 rounded-xl border border-white/10 p-1">
          <Search className="h-5 w-5 text-zinc-500 ml-3 mr-2" />
          <input
            type="text"
            placeholder="Search executions by workflow name or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent border-none focus:ring-0 focus:outline-none text-white placeholder-zinc-500 h-10 min-w-0"
          />
        </div>
      </div>

      <div className="rounded-2xl bg-zinc-900/40 border border-white/5 overflow-hidden backdrop-blur-sm shadow-xl shadow-black/20">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/[0.02] text-zinc-400 font-medium border-b border-white/5">
              <tr>
                <th className="px-6 py-5 font-semibold tracking-wider text-xs uppercase">
                  Status
                </th>
                <th className="px-6 py-5 font-semibold tracking-wider text-xs uppercase">
                  Workflow
                </th>
                <th className="px-6 py-5 font-semibold tracking-wider text-xs uppercase">
                  Trigger
                </th>
                <th className="px-6 py-5 font-semibold tracking-wider text-xs uppercase">
                  Started
                </th>
                <th className="px-6 py-5 font-semibold tracking-wider text-xs uppercase">
                  Duration
                </th>
                <th className="px-6 py-5 font-semibold tracking-wider text-xs uppercase text-right">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <Loader2 className="h-8 w-8 text-primary animate-spin mb-4" />
                      <p className="text-zinc-500">
                        Loading execution history...
                      </p>
                    </div>
                  </td>
                </tr>
              ) : filteredExecutions.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-20 text-center text-zinc-500"
                  >
                    No executions found
                  </td>
                </tr>
              ) : (
                filteredExecutions.map((execution) => (
                  <tr
                    key={execution.id}
                    className="hover:bg-white/[0.04] transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <StatusBadge status={execution.status} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-zinc-200 group-hover:text-white transition-colors">
                        {execution.workflowName}
                      </div>
                      <div className="text-xs text-zinc-500 font-mono mt-0.5 opacity-60 group-hover:opacity-100 transition-opacity">
                        #{execution.id.slice(0, 8)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-zinc-400">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-md bg-zinc-800/50">
                          <Play className="h-3 w-3 text-zinc-400" />
                        </div>
                        <span className="capitalize text-sm">
                          {execution.triggerType || 'Manual'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-zinc-400">
                      <div
                        className="flex items-center gap-2"
                        title={new Date(execution.startedAt).toLocaleString()}
                      >
                        <Calendar className="h-3.5 w-3.5 text-zinc-500" />
                        <span>
                          {formatDistanceToNow(new Date(execution.startedAt), {
                            addSuffix: true,
                          })}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-zinc-400">
                      <div className="flex items-center gap-2">
                        <Clock className="h-3.5 w-3.5 text-zinc-500" />
                        <span className="font-mono text-xs">
                          {execution.completedAt
                            ? `${new Date(execution.completedAt).getTime() - new Date(execution.startedAt).getTime()}ms`
                            : '-'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        to={`/executions/${execution.id}`}
                        className="inline-flex items-center justify-center p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-all active:scale-95"
                      >
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
