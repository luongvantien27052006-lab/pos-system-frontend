// ==================================================================
//  POS FRONTEND  (Next.js)
//  Dat tai:  src/components/dashboard/store-hours-card.tsx
//  >> FILE MOI (tao moi)
// ==================================================================

'use client';

import { useEffect, useState } from 'react';
import { Clock, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { type StoreHours } from '@/types';
import { Button } from '@/components/ui/button';

type Override = 'auto' | 'open' | 'closed';

function overrideOf(h: StoreHours): Override {
  if (h.manualOverride === true) return 'open';
  if (h.manualOverride === false) return 'closed';
  return 'auto';
}

const OPTIONS: [Override, string][] = [
  ['auto', 'Theo giờ'],
  ['open', 'Mở'],
  ['closed', 'Tạm đóng'],
];

export function StoreHoursCard() {
  const [hours, setHours] = useState<StoreHours | null>(null);
  const [openTime, setOpenTime] = useState('07:00');
  const [closeTime, setCloseTime] = useState('22:00');
  const [override, setOverride] = useState<Override>('auto');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const h = await api.getStoreHours();
        if (!active) return;
        setHours(h);
        setOpenTime(h.openTime);
        setCloseTime(h.closeTime);
        setOverride(overrideOf(h));
      } catch {
        if (active) setMsg('Không tải được cấu hình giờ');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const save = async () => {
    setSaving(true);
    setMsg(null);
    try {
      const h = await api.updateStoreHours({ openTime, closeTime, override });
      setHours(h);
      setOverride(overrideOf(h));
      setMsg('Đã lưu');
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Lưu thất bại');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-2xl border-2 border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="flex items-center gap-2 font-bold">
          <Clock className="h-4 w-4" /> Giờ mở cửa
        </h3>
        {hours && (
          <span
            className={`rounded-lg px-2 py-1 text-xs font-bold ${
              hours.isOpen
                ? 'bg-success/20 text-success-foreground'
                : 'bg-destructive/15 text-destructive'
            }`}
          >
            {hours.isOpen ? 'Đang mở' : 'Đang đóng'}
          </span>
        )}
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Đang tải…
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <label className="flex flex-1 flex-col text-xs font-medium text-muted-foreground">
              Mở cửa
              <input
                type="time"
                value={openTime}
                onChange={(e) => setOpenTime(e.target.value)}
                className="mt-1 rounded-lg border border-border bg-background px-2 py-1.5 text-sm text-foreground"
              />
            </label>
            <label className="flex flex-1 flex-col text-xs font-medium text-muted-foreground">
              Đóng cửa
              <input
                type="time"
                value={closeTime}
                onChange={(e) => setCloseTime(e.target.value)}
                className="mt-1 rounded-lg border border-border bg-background px-2 py-1.5 text-sm text-foreground"
              />
            </label>
          </div>

          <div>
            <p className="mb-1 text-xs font-medium text-muted-foreground">
              Trạng thái nhận đơn
            </p>
            <div className="flex gap-2">
              {OPTIONS.map(([val, label]) => (
                <button
                  key={val}
                  onClick={() => setOverride(val)}
                  className={`flex-1 rounded-lg border-2 px-2 py-1.5 text-sm font-semibold ${
                    override === val
                      ? 'border-accent bg-accent/10 text-accent-foreground'
                      : 'border-border text-muted-foreground'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            {override === 'closed' && (
              <p className="mt-1 text-xs text-destructive">
                Khách sẽ không đặt được đơn cho tới khi mở lại.
              </p>
            )}
            {override === 'auto' && (
              <p className="mt-1 text-xs text-muted-foreground">
                Tự nhận đơn trong khung giờ trên.
              </p>
            )}
            {override === 'open' && (
              <p className="mt-1 text-xs text-muted-foreground">
                Luôn nhận đơn, bỏ qua khung giờ.
              </p>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Button size="sm" variant="primary" disabled={saving} onClick={save}>
              {saving ? 'Đang lưu…' : 'Lưu'}
            </Button>
            {msg && (
              <span className="text-xs text-muted-foreground">{msg}</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}