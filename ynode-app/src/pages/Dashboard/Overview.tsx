import { useEffect, useState } from 'react';
import {
  Activity,
  Workflow,
  Clock,
  CheckCircle2,
  Play,
  Zap,
  ArrowRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { fetchUserExecutions } from '@/api/workflowApi';
import { useAuthStore } from '@/store/authStore';
import { useWorkflowDataStore } from '@/store/workflowDataStore';

export function Overview() {
  const user = useAuthStore((state) => state.user);
  const { workflows, fetchAllWorkflows } = useWorkflowDataStore();

  const [activeWorkflows, setActiveWorkflows] = useState(0);
  const [totalExecutions, setTotalExecutions] = useState(0);
  const [successRate, setSuccessRate] = useState('0%');
  const [avgDuration, setAvgDuration] = useState('0ms');

  useEffect(() => {
    fetchAllWorkflows();
  }, [fetchAllWorkflows]);

  useEffect(() => {
    setActiveWorkflows(workflows.filter((w: any) => w.isActive).length);
  }, [workflows]);

  useEffect(() => {
    const loadExecutionStats = async () => {
      try {
        const executions = await fetchUserExecutions(50);
        setTotalExecutions(user?.executionsThisMonth || 0);

        if (executions.length > 0) {
          const successCount = executions.filter(
            (e: any) => e.status === 'success'
          ).length;
          const rate = (successCount / executions.length) * 100;
          setSuccessRate(`${rate.toFixed(1)}%`);

          const completed = executions.filter(
            (e: any) => e.completedAt && e.startedAt
          );
          if (completed.length > 0) {
            const totalDuration = completed.reduce((acc: number, curr: any) => {
              return (
                acc +
                (new Date(curr.completedAt!).getTime() -
                  new Date(curr.startedAt).getTime())
              );
            }, 0);
            const avg = Math.round(totalDuration / completed.length);
            setAvgDuration(`${avg}ms`);
          }
        }
      } catch (error) {
        console.error('Failed to load execution stats:', error);
      }
    };

    loadExecutionStats();
  }, [user]);

  const stats = [
    {
      label: 'Active Workflows',
      value: activeWorkflows.toString(),
      icon: Workflow,
      color: 'text-violet-400',
      bg: 'bg-violet-500/10',
      border: 'border-violet-500/20',
    },
    {
      label: 'Total Executions',
      value: totalExecutions.toString(),
      sub: 'This Month',
      icon: Activity,
      color: 'text-cyan-400',
      bg: 'bg-cyan-500/10',
      border: 'border-cyan-500/20',
    },
    {
      label: 'Success Rate',
      value: successRate,
      sub: 'Last 50 Runs',
      icon: CheckCircle2,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20',
    },
    {
      label: 'Avg Duration',
      value: avgDuration,
      sub: 'Per Execution',
      icon: Clock,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/20',
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">
            Dashboard
          </h1>
          <p className="text-zinc-400 text-lg font-light">
            Overview of your automation ecosystem.
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            to="/new-workflow"
            className="group inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-medium transition-all shadow-lg shadow-zinc-900/25 hover:shadow-zinc-900/40 hover:-translate-y-0.5"
          >
            <Play className="h-4 w-4 fill-current" />
            <span>New Workflow</span>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="relative p-6 rounded-2xl bg-zinc-900/60 border border-white/5 backdrop-blur-md hover:border-white/10 transition-all duration-300 group overflow-hidden"
          >
            <div
              className={`absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity`}
            >
              <stat.icon className="w-24 h-24 rotate-12 -mr-8 -mt-8" />
            </div>

            <div className="relative z-10">
              <div
                className={`inline-flex p-3 rounded-xl ${stat.bg} ${stat.color} mb-4 ring-inset ${stat.border}`}
              >
                <stat.icon className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-3xl font-bold text-white tracking-tight">
                  {stat.value}
                </h3>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-zinc-400 font-medium">
                    {stat.label}
                  </p>
                  {stat.sub && (
                    <span className="text-[10px] uppercase tracking-wider text-zinc-600 bg-white/5 px-1.5 py-0.5 rounded border border-white/5">
                      {stat.sub}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-2xl bg-zinc-900/40 border border-white/5 overflow-hidden backdrop-blur-sm flex flex-col">
          <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
            <h2 className="text-lg font-semibold text-white tracking-tight flex items-center gap-2">
              <Workflow className="h-5 w-5 text-zinc-400" />
              Recent Workflows
            </h2>
            <Link
              to="/workflows"
              className="text-xs font-medium text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
            >
              View All <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="divide-y divide-white/5 flex-1">
            {workflows.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-center p-8">
                <div className="h-16 w-16 bg-zinc-900/80 rounded-full flex items-center justify-center mb-4 border border-white/5 shadow-inner">
                  <Workflow className="h-8 w-8 text-zinc-600" />
                </div>
                <h3 className="text-white font-medium mb-1">
                  No workflows yet
                </h3>
                <p className="text-zinc-500 text-sm max-w-xs mx-auto">
                  Create your first workflow to start automating your tasks.
                </p>
              </div>
            ) : (
              workflows.slice(0, 5).map((workflow) => (
                <div
                  key={workflow.id}
                  className="p-4 flex items-center justify-between gap-3 hover:bg-white/[0.02] transition-colors group"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div
                      className={`h-10 w-10 shrink-0 rounded-lg flex items-center justify-center border ${workflow.isActive
                        ? 'bg-green-500/10 border-green-500/20 text-green-400'
                        : 'bg-zinc-800/50 border-white/5 text-zinc-500'
                        }`}
                    >
                      <Workflow className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-white font-medium text-sm group-hover:text-primary transition-colors truncate">
                        {workflow.name}
                      </h3>
                      <p
                        className="text-xs text-zinc-500 font-mono"
                        title={workflow.id}
                      >
                        ID: {workflow.id.slice(0, 8)}…
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider whitespace-nowrap ${workflow.isActive
                        ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                        : 'bg-zinc-800 text-zinc-400 border border-white/5'
                        }`}
                    >
                      {workflow.isActive ? 'Active' : 'Stopped'}
                    </div>
                    <Link
                      to={`/editor/${workflow.id}`}
                      className="h-8 px-3 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-medium text-white transition-colors border border-white/5 hover:border-white/10 flex items-center"
                    >
                      Edit
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-2xl bg-zinc-900/40 border border-white/5 overflow-hidden flex flex-col h-full backdrop-blur-sm">
          <div className="p-6 border-b border-white/5 bg-white/[0.02]">
            <h2 className="text-lg font-semibold text-white tracking-tight flex items-center gap-2">
              <Zap className="h-5 w-5 text-amber-400" />
              System Status
            </h2>
          </div>
          <div className="p-6 flex-1 flex flex-col gap-6">
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-600/10 border border-green-500/20 p-5">
              <div className="flex items-start gap-4">
                <span className="relative flex h-3 w-3 mt-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                </span>
                <div>
                  <h3 className="text-sm font-semibold text-green-200">
                    ynode/core
                  </h3>
                  <p className="text-xs text-green-300/60 mt-1">
                    running v0.1.0
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">
                Quick Actions
              </h4>
              <button className="w-full text-left px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 transition-all group">
                <span className="block text-sm font-medium text-zinc-200 group-hover:text-white">
                  View Documentation (WIP)
                </span>
                <span className="block text-xs text-zinc-500 mt-0.5">
                  Learn how to build complex flows
                </span>
              </button>
              <button className="w-full text-left px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 transition-all group">
                <span className="block text-sm font-medium text-zinc-200 group-hover:text-white">
                  API Keys (WIP)
                </span>
                <span className="block text-xs text-zinc-500 mt-0.5">
                  Manage your access tokens
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
