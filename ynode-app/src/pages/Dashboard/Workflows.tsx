import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Workflow, Search, Plus, Calendar, ArrowRight, Trash2 } from 'lucide-react';
import { useWorkflowDataStore } from '@/store/workflowDataStore';
import { formatDistanceToNow } from 'date-fns';

export function Workflows() {
  const { workflows, workflowsLoading, fetchAllWorkflows, deleteWorkflow } =
    useWorkflowDataStore();
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchAllWorkflows();
  }, [fetchAllWorkflows]);

  const filteredWorkflows = workflows.filter(
    (w) =>
      w.name.toLowerCase().includes(search.toLowerCase()) ||
      w.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">
            Workflows
          </h1>
          <p className="text-zinc-400 font-light">
            Manage and monitor your automation workflows.
          </p>
        </div>
        <Link
          to="/new-workflow"
          className="group inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-medium transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
        >
          <Plus className="h-4 w-4" />
          <span>Create Workflow</span>
        </Link>
      </div>

      <div className="relative group">
        <div className="absolute -inset-0.5 bg-primary rounded-xl opacity-20 group-focus-within:opacity-50 blur transition duration-500" />
        <div className="relative flex items-center bg-zinc-900/90 rounded-xl border border-white/10 p-1">
          <Search className="h-5 w-5 text-zinc-500 ml-3 mr-2" />
          <input
            type="text"
            placeholder="Search workflows by name or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent border-none focus:ring-0 focus:outline-none text-white placeholder-zinc-500 h-10 min-w-0"
          />
        </div>
      </div>

      {workflowsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-48 rounded-2xl bg-zinc-900/40 border border-white/5 animate-pulse"
            />
          ))}
        </div>
      ) : filteredWorkflows.length === 0 ? (
        <div className="text-center py-20 rounded-3xl bg-zinc-900/20 border border-white/5 border-dashed">
          <div className="h-20 w-20 bg-gradient-to-br from-zinc-800 to-zinc-900 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner ring-1 ring-white/5">
            <Workflow className="h-10 w-10 text-zinc-500" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">
            No workflows found
          </h3>
          <p className="text-zinc-500 mb-8 max-w-md mx-auto">
            Get started by creating your first automation workflow.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredWorkflows.map((workflow) => (
            <div
              key={workflow.id}
              className="group relative flex flex-col p-6 rounded-2xl bg-zinc-900/40 border border-white/5 hover:border-white/10 hover:bg-zinc-900/60 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/50"
            >
              <div className="flex items-start justify-between mb-6">
                <div
                  className={`p-3.5 rounded-xl border ${workflow.isActive
                    ? 'bg-green-500/10 text-green-400 border-green-500/20 shadow-[0_0_15px_-3px_theme(colors.green.500/0.3)]'
                    : 'bg-zinc-800/50 text-zinc-500 border-white/5'
                    }`}
                >
                  <Workflow className="h-6 w-6" />
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider border ${workflow.isActive
                      ? 'bg-green-500/10 text-green-400 border-green-500/20'
                      : 'bg-zinc-800/50 text-zinc-500 border-white/5'
                      }`}
                  >
                    {workflow.isActive ? 'Active' : 'Inactive'}
                  </div>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (confirm('Are you sure you want to delete this workflow?')) {
                        deleteWorkflow(workflow.id);
                      }
                    }}
                    className="p-2 ml-2 text-zinc-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                    title="Delete Workflow"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="mb-6 flex-1">
                <h3 className="text-lg font-bold text-white mb-1.5 group-hover:text-primary transition-colors line-clamp-1">
                  {workflow.name}
                </h3>
                <p className="text-xs text-zinc-500 font-mono truncate bg-white/5 rounded px-1.5 py-0.5 inline-block border border-white/5">
                  {workflow.id}
                </p>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-white/5 mt-auto">
                <span className="text-xs text-zinc-500 flex items-center gap-1.5">
                  <Calendar className="h-3 w-3" />
                  {workflow.updatedAt
                    ? formatDistanceToNow(new Date(workflow.updatedAt), {
                      addSuffix: true,
                    })
                    : 'Just now'}
                </span>

                <Link
                  to={`/editor/${workflow.id}`}
                  className="flex items-center gap-1.5 text-xs font-medium text-zinc-300 hover:text-white transition-colors group/link"
                >
                  Edit Workflow
                  <ArrowRight className="h-3 w-3 group-hover/link:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
