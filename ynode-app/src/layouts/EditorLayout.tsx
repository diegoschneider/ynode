import { Outlet } from 'react-router-dom';

export function EditorLayout() {
  return (
    <div className="h-screen w-screen bg-background text-foreground overflow-hidden">
      <Outlet />
    </div>
  );
}
