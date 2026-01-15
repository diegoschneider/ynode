import type { DragEvent } from 'react';
import {
  Zap,
  Globe,
  Split,
  GripVertical,
  Play,
  GitBranch,
  Shuffle,
  Plug,
  Timer,
  Code2,
  FileText,
  Variable,
  Combine,
  Clock,
  Webhook,
  Box,
  Brain,
  MessageSquare,
  Database,
  Wrench,
  Sparkles,
  Send,
  Type,
  type LucideIcon,
} from 'lucide-react';
import { Card } from '../ui/card';
import { useNodeTypesStore } from '../../store/nodeTypesStore';

const iconMap: Record<string, LucideIcon> = {
  Zap,
  Globe,
  Split,
  Play,
  GitBranch,
  Shuffle,
  Plug,
  Timer,
  Code2,
  FileText,
  Variable,
  Combine,
  Clock,
  Webhook,
  Box,
  Brain,
  MessageSquare,
  Database,
  Wrench,
  Sparkles,
  Send,
  Type,
};

const getColorClass = (color: string): string => {
  return `text-${color}`;
};

export function Sidebar() {
  const { nodes: allNodes, categories } = useNodeTypesStore();

  const onDragStart = (event: DragEvent<HTMLDivElement>, nodeType: string) => {
    event.dataTransfer.setData('application/ynodeType', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  const nodeTypes = allNodes.map((def) => ({
    type: def.type,
    label: def.label,
    description: def.description,
    icon: iconMap[def.icon] || Zap,
    color: getColorClass(def.color || 'zinc-500'),
    category: def.category,
  }));

  const categoryKeys = Object.keys(categories);

  return (
    <aside className="w-64 border-r border-white/5 bg-background p-2 flex flex-col gap-4 z-20">
      <div className="flex items-center gap-2 px-2 pb-4 border-b border-white/5">
        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
          Node Palette
        </span>
      </div>

      <div className="flex pl-1 pr-3 flex-col gap-3 overflow-y-auto flex-1">
        {categoryKeys.map((category) => {
          const categoryNodes = nodeTypes.filter(
            (n) => n.category === category
          );
          if (categoryNodes.length === 0) return null;

          const meta = categories[category];
          if (!meta) return null;
          const CategoryIcon = iconMap[meta.icon] || Zap;

          return (
            <div key={category} className="space-y-2">
              <div className="flex items-center gap-2 px-2 text-xs font-semibold text-muted-foreground uppercase">
                <CategoryIcon className="w-3 h-3" />
                {meta.label}
              </div>
              {categoryNodes.map((node) => (
                <div
                  key={node.type}
                  onDragStart={(event) => onDragStart(event, node.type)}
                  draggable
                  className="group relative"
                  title={node.description}
                >
                  <Card className="p-3 flex items-center gap-3 cursor-grab active:cursor-grabbing hover:border-primary/50 hover:bg-white/5 transition-all duration-300 group-hover:translate-x-0.5 group-hover:shadow-[0_0_15px_rgba(99,102,241,0.15)] bg-black/20 border-white/5">
                    <div
                      className={`p-2 rounded-md bg-white/5 ring-1 ring-white/10 group-hover:scale-110 transition-transform duration-300 ${node.color}`}
                    >
                      <node.icon className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-medium text-gray-200 group-hover:text-white transition-colors">
                      {node.label}
                    </span>
                    <GripVertical className="ml-auto w-4 h-4 text-muted-foreground/30 group-hover:text-muted-foreground/60" />
                  </Card>

                  <div className="absolute inset-0 -z-10 bg-gradient-to-r from-primary/20 to-transparent opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500 rounded-lg" />
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </aside>
  );
}
