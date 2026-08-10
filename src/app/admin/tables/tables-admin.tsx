'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';
import {
  ArrowLeft,
  Loader2,
  Plus,
  Printer,
  RotateCcw,
  Trash2,
} from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import { cn } from '@/lib/utils';
import type { AdminTable } from '@/types';
import { Button } from '@/components/ui/button';
import { Toast, type ToastState } from '@/components/ui/toast';

export function TablesAdmin() {
  const [tables, setTables] = useState<AdminTable[]>([]);
  const [origin, setOrigin] = useState('');
  const [tableNumber, setTableNumber] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);

  // origin chỉ có ở client — dùng để dựng URL trong QR
  useEffect(() => setOrigin(window.location.origin), []);
  useEffect(() => {
    api
      .listTablesAdmin()
      .then(setTables)
      .catch(() =>
        setToast({ type: 'error', message: 'Không tải được danh sách bàn' }),
      );
  }, []);

  const menuUrl = (t: AdminTable) =>
    `${origin}/menu?table=${encodeURIComponent(t.tableNumber)}`;

  const add = async () => {
    if (!tableNumber.trim())
      return setToast({ type: 'error', message: 'Nhập số bàn' });
    setSubmitting(true);
    try {
      await api.createTable({
        tableNumber: tableNumber.trim(),
        displayName: displayName.trim() || undefined,
      });
      setToast({ type: 'success', message: `Đã thêm bàn ${tableNumber.trim()}` });
      setTableNumber('');
      setDisplayName('');
      setTables(await api.listTablesAdmin());
    } catch (e) {
      setToast({
        type: 'error',
        message: e instanceof ApiError ? e.message : 'Thêm bàn thất bại',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const deactivate = async (id: number) => {
    try {
      await api.deleteTable(id);
      setTables((p) =>
        p.map((x) => (x.id === id ? { ...x, isActive: false } : x)),
      );
    } catch {
      setToast({ type: 'error', message: 'Không thể ngừng dùng bàn' });
    }
  };

  const reactivate = async (id: number) => {
    try {
      await api.restoreTable(id);
      setTables((p) =>
        p.map((x) => (x.id === id ? { ...x, isActive: true } : x)),
      );
    } catch {
      setToast({ type: 'error', message: 'Không thể bật lại bàn' });
    }
  };

  return (
    <main className="mx-auto min-h-dvh max-w-5xl px-5 py-8">
      <Toast toast={toast} onClose={() => setToast(null)} />

      <header className="no-print mb-6">
        <Link
          href="/"
          className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Trang chủ
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-bold">Quản lý bàn &amp; mã QR</h1>
          <Button
            variant="outline"
            onClick={() => window.print()}
            disabled={tables.length === 0}
          >
            <Printer className="h-4 w-4" /> In tất cả mã QR
          </Button>
        </div>
      </header>

      {/* Form thêm bàn */}
      <div className="no-print mb-8 flex flex-wrap items-end gap-3 rounded-2xl border bg-card p-5">
        <div className="min-w-[140px] flex-1">
          <label className="mb-1 block text-sm font-medium">Số bàn</label>
          <input
            className="w-full rounded-xl border bg-background px-3 py-2 outline-none transition focus:border-accent"
            value={tableNumber}
            onChange={(e) => setTableNumber(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && add()}
            placeholder="VD: 09 hoặc VIP1"
          />
        </div>
        <div className="min-w-[140px] flex-1">
          <label className="mb-1 block text-sm font-medium">
            Tên hiển thị (tùy chọn)
          </label>
          <input
            className="w-full rounded-xl border bg-background px-3 py-2 outline-none transition focus:border-accent"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && add()}
            placeholder="VD: Bàn sân vườn"
          />
        </div>
        <Button variant="accent" disabled={submitting} onClick={add}>
          {submitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
          Thêm bàn
        </Button>
      </div>

      {/* Lưới mã QR — vùng được in */}
      <div
        id="qr-print-area"
        className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4"
      >
        {tables.map((t) => (
          <div
            key={t.id}
            className={cn(
              'qr-card flex flex-col items-center gap-2 rounded-xl border bg-card p-4 text-center',
              !t.isActive && 'opacity-50',
            )}
          >
            <div className="text-lg font-bold">Bàn {t.tableNumber}</div>
            {t.displayName && (
              <div className="-mt-1 text-xs text-muted-foreground">
                {t.displayName}
              </div>
            )}

            {origin ? (
              <div className="rounded-lg bg-white p-2">
                <QRCodeSVG value={menuUrl(t)} size={132} level="M" />
              </div>
            ) : (
              <div className="h-[148px] w-[148px] animate-pulse rounded-lg bg-muted" />
            )}

            <div className="no-print mt-1">
              {t.isActive ? (
                <button
                  type="button"
                  aria-label="Ngừng dùng bàn"
                  onClick={() => deactivate(t.id)}
                  className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-muted hover:text-warning-foreground"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              ) : (
                <button
                  type="button"
                  aria-label="Bật lại bàn"
                  onClick={() => reactivate(t.id)}
                  className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-muted hover:text-success"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {tables.length === 0 && (
        <p className="no-print mt-6 text-center text-sm text-muted-foreground">
          Chưa có bàn nào — thêm bàn ở ô phía trên.
        </p>
      )}
    </main>
  );
}