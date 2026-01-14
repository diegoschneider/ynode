import { useWorkflowStore } from '../../store/workflowStore';
import { useAuthStore } from '../../store/authStore';
import { Trash2, Cloud, LogOut, User, LayoutDashboard } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { cn } from '../../lib/utils';

export function Header() {
  const navigate = useNavigate();

  const workflowName = useWorkflowStore((state) => state.workflowName);
  const workflowId = useWorkflowStore((state) => state.workflowId);
  const setWorkflowName = useWorkflowStore((state) => state.setWorkflowName);
  const clearWorkflow = useWorkflowStore((state) => state.clearWorkflow);
  const saveStatus = useWorkflowStore((state) => state.saveStatus);
  const saveError = useWorkflowStore((state) => state.saveError);

  const { user, logout } = useAuthStore();

  const handleClear = () => {
    clearWorkflow();
    navigate('/editor');
  };

  const handleLogout = () => {
    logout();
  };

  const isSaving = saveStatus === 'saving';
  const hasError = saveStatus === 'error';
  const isSynced = workflowId !== null;

  return (
    <header className="h-14 border-b border-white/5 bg-background flex items-center justify-between px-4 z-50">
      <div className="flex items-center gap-6">
        <Link
          to="/"
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <img
            src="/ynode_white.svg"
            alt="Ynode Logo"
            className="w-16 h-9 select-none"
            draggable={false}
          />
        </Link>

        <div className="flex items-center gap-3">
          <Input
            value={workflowName}
            onChange={(e) => setWorkflowName(e.target.value)}
            placeholder="Workflow Name"
            className="w-64 bg-black/20 outline-none border-white/10 transition-all h-8"
          />

          <div
            className={cn(
              'flex items-center gap-1.5 px-2 py-1 rounded-md text-xs transition-colors',
              hasError
                ? 'text-red-400'
                : isSynced
                  ? 'text-green-400'
                  : 'text-zinc-500'
            )}
            title={
              hasError
                ? saveError || 'Save failed'
                : isSaving
                  ? 'Saving...'
                  : isSynced
                    ? 'Synced to cloud'
                    : 'Not saved'
            }
          >
            <Cloud className={cn('w-4 h-4', isSaving && 'animate-spin')} />
            {hasError && <span className="text-red-400">!</span>}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClear}
          className="text-muted-foreground hover:text-red-400 hover:bg-red-950/30"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          New
        </Button>

        <div className="h-4 w-px bg-white/10 mx-2" />

        {user && (
          <div className="flex items-center gap-3">
            <Link to="/">
              <Button
                variant="ghost"
                size="sm"
                className="text-zinc-400 hover:text-white"
              >
                <LayoutDashboard className="w-4 h-4 mr-2" />
                Dashboard
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <span className="text-xs text-gray-400 truncate max-w-[120px]">
                {user.email}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-muted-foreground hover:text-red-400 hover:bg-red-950/30"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
