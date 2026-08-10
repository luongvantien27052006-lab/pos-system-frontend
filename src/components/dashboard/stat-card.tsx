'use client';

import type { LucideIcon } from 'lucide-react';
import { formatVnd } from '@/lib/format';
import { cn } from '@/lib/utils';
import { AnimatedNumber } from './animated-number';

export function StatCard({
  label,
  value,
  icon: Icon,
  hero = false,
  tone = 'default',
}: {
  label: string;
  value: number;
  icon: LucideIcon;
  hero?: boolean;
  tone?: 'default' | 'cash' | 'transfer';
}) {
  const toneText =
    tone === 'cash'
      ? 'text-success'
      : tone === 'transfer'
        ? 'text-info'
        : 'text-accent';

  return (
    <div className={cn('rounded-2xl border bg-card', hero ? 'p-7' : 'p-5')}>
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <Icon className="h-4 w-4" /> {label}
      </div>
      <div
        className={cn(
          'mt-2 font-extrabold tabular',
          toneText,
          hero ? 'text-5xl sm:text-6xl' : 'text-3xl',
        )}
      >
        <AnimatedNumber value={value} format={formatVnd} />
      </div>
    </div>
  );
}