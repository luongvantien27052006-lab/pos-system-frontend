// ==================================================================
//  POS FRONTEND  (Next.js)
//  Dat tai:  src/app/admin/toppings/toppings-admin.tsx
//  >> FILE MOI (tao moi)
// ==================================================================

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Loader2,
  Pencil,
  Plus,
  RotateCcw,
  Save,
  Trash2,
  X,
} from 'lucide-react';
import { api } from '@/lib/api';
import { formatVnd } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { AdminOption, MenuCategory } from '@/types';
import { Button } from '@/components/ui/button';
import { Toast, type ToastState } from '@/components/ui/toast';

const inputClass =
  'w-full rounded-xl border bg-background px-3 py-2 outline-none transition focus:border-accent';

export function ToppingsAdmin() {
  const [options, setOptions] = useState<AdminOption[]>([]);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<ToastState>(null);

  // Form thêm/sửa topping
  const [editing, setEditing] = useState<AdminOption | null>(null);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [groupName, setGroupName] = useState('');
  const [saving, setSaving] = useState(false);

  // Gán topping cho món
  const [productId, setProductId] = useState('');
  const [assigned, setAssigned] = useState<Set<number>>(new Set());
  const [loadingAssigned, setLoadingAssigned] = useState(false);
  const [savingAssign, setSavingAssign] = useState(false);

  const loadOptions = async () => setOptions(await api.listOptions());

  useEffect(() => {
    (async () => {
      try {
        const menu = await api.getMenu();
        setCategories(menu.categories);
        await loadOptions();
      } catch {
        setToast({ type: 'error', message: 'Không tải được dữ liệu' });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Danh sách món phẳng (kèm tên danh mục)
  const products = categories.flatMap((c) =>
    c.products.map((p) => ({ id: p.id, name: p.name, categoryName: c.name })),
  );

  // Nhóm topping theo groupName
  const groups = new Map<string, AdminOption[]>();
  for (const o of options) {
    const key = o.groupName ?? 'Khác';
    groups.set(key, [...(groups.get(key) ?? []), o]);
  }
  const activeOptions = options.filter((o) => o.isActive);

  const resetForm = () => {
    setEditing(null);
    setName('');
    setPrice('');
    setGroupName('');
  };

  const startEdit = (o: AdminOption) => {
    setEditing(o);
    setName(o.name);
    setPrice(String(o.price));
    setGroupName(o.groupName ?? '');
  };

  const submit = async () => {
    if (!name.trim()) {
      setToast({ type: 'error', message: 'Nhập tên topping' });
      return;
    }
    const priceNum = Number(price);
    if (!Number.isFinite(priceNum) || priceNum < 0) {
      setToast({ type: 'error', message: 'Giá không hợp lệ' });
      return;
    }
    setSaving(true);
    try {
      const body = {
        name: name.trim(),
        price: priceNum,
        groupName: groupName.trim() || undefined,
      };
      if (editing) await api.updateOption(editing.id, body);
      else await api.createOption(body);
      await loadOptions();
      resetForm();
      setToast({
        type: 'success',
        message: editing ? 'Đã cập nhật topping' : 'Đã thêm topping',
      });
    } catch (e) {
      setToast({
        type: 'error',
        message: e instanceof Error ? e.message : 'Lưu thất bại',
      });
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (o: AdminOption) => {
    try {
      if (o.isActive) await api.deleteOption(o.id);
      else await api.restoreOption(o.id);
      await loadOptions();
    } catch {
      setToast({ type: 'error', message: 'Thao tác thất bại' });
    }
  };

  // Tải topping đã gán khi đổi món
  useEffect(() => {
    if (!productId) {
      setAssigned(new Set());
      return;
    }
    let active = true;
    setLoadingAssigned(true);
    api
      .getProductOptions(Number(productId))
      .then((ids) => {
        if (active) setAssigned(new Set(ids));
      })
      .catch(() => {
        if (active)
          setToast({ type: 'error', message: 'Không tải được topping của món' });
      })
      .finally(() => {
        if (active) setLoadingAssigned(false);
      });
    return () => {
      active = false;
    };
  }, [productId]);

  const toggleAssign = (id: number) => {
    setAssigned((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const saveAssign = async () => {
    if (!productId) return;
    setSavingAssign(true);
    try {
      await api.setProductOptions(Number(productId), [...assigned]);
      setToast({ type: 'success', message: 'Đã lưu topping cho món' });
    } catch (e) {
      setToast({
        type: 'error',
        message: e instanceof Error ? e.message : 'Lưu thất bại',
      });
    } finally {
      setSavingAssign(false);
    }
  };

  return (
    <main className="mx-auto max-w-3xl px-5 py-8">
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Về trang chủ
      </Link>

      <h1 className="mb-1 text-2xl font-bold">Quản lý Topping</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Tạo topping/tùy chọn và gán cho từng món. Topping sẽ hiện ở menu khi
        khách đặt.
      </p>

      {loading ? (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Đang tải…
        </div>
      ) : (
        <div className="space-y-6">
          {/* ── Form thêm/sửa ── */}
          <section className="rounded-2xl border-2 border-border bg-card p-4">
            <h2 className="mb-3 font-bold">
              {editing ? `Sửa: ${editing.name}` : 'Thêm topping mới'}
            </h2>
            <div className="grid gap-3 sm:grid-cols-3">
              <label className="text-xs font-medium text-muted-foreground sm:col-span-1">
                Tên
                <input
                  className={cn(inputClass, 'mt-1')}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Trân châu đen"
                />
              </label>
              <label className="text-xs font-medium text-muted-foreground">
                Giá (đ)
                <input
                  className={cn(inputClass, 'mt-1')}
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  inputMode="numeric"
                  placeholder="7000"
                />
              </label>
              <label className="text-xs font-medium text-muted-foreground">
                Nhóm
                <input
                  className={cn(inputClass, 'mt-1')}
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="Topping"
                  list="topping-groups"
                />
                <datalist id="topping-groups">
                  <option value="Topping" />
                  <option value="Đường" />
                  <option value="Đá" />
                  <option value="Size" />
                  <option value="Khác" />
                </datalist>
              </label>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <Button size="sm" variant="primary" disabled={saving} onClick={submit}>
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : editing ? (
                  <Save className="h-4 w-4" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                {editing ? 'Lưu' : 'Thêm'}
              </Button>
              {editing && (
                <Button size="sm" variant="ghost" onClick={resetForm}>
                  <X className="h-4 w-4" /> Hủy
                </Button>
              )}
            </div>
          </section>

          {/* ── Danh sách topping ── */}
          <section className="rounded-2xl border-2 border-border bg-card p-4">
            <h2 className="mb-3 font-bold">Danh sách topping</h2>
            {options.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Chưa có topping nào. Thêm ở trên.
              </p>
            ) : (
              <div className="space-y-4">
                {[...groups.entries()].map(([group, items]) => (
                  <div key={group}>
                    <p className="mb-1 text-xs font-bold uppercase tracking-wider text-accent">
                      {group}
                    </p>
                    <div className="divide-y divide-border">
                      {items.map((o) => (
                        <div
                          key={o.id}
                          className={cn(
                            'flex items-center justify-between py-2',
                            !o.isActive && 'opacity-50',
                          )}
                        >
                          <div>
                            <span className="font-medium">{o.name}</span>
                            <span className="ml-2 text-sm text-muted-foreground">
                              {formatVnd(o.price)}
                            </span>
                            {!o.isActive && (
                              <span className="ml-2 rounded bg-muted px-1.5 py-0.5 text-xs">
                                đã ẩn
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => startEdit(o)}
                              className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                              title="Sửa"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => toggleActive(o)}
                              className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                              title={o.isActive ? 'Ẩn' : 'Hiện lại'}
                            >
                              {o.isActive ? (
                                <Trash2 className="h-4 w-4" />
                              ) : (
                                <RotateCcw className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* ── Gán topping cho món ── */}
          <section className="rounded-2xl border-2 border-border bg-card p-4">
            <h2 className="mb-3 font-bold">Gán topping cho món</h2>
            <select
              className={cn(inputClass, 'mb-3')}
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
            >
              <option value="">— Chọn món —</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.categoryName} · {p.name}
                </option>
              ))}
            </select>

            {productId && (
              <>
                {loadingAssigned ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" /> Đang tải…
                  </div>
                ) : activeOptions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Chưa có topping đang hoạt động để gán.
                  </p>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {activeOptions.map((o) => {
                        const on = assigned.has(o.id);
                        return (
                          <button
                            key={o.id}
                            onClick={() => toggleAssign(o.id)}
                            className={cn(
                              'rounded-xl border-2 px-3 py-2 text-left text-sm transition',
                              on
                                ? 'border-accent bg-accent/10'
                                : 'border-border text-muted-foreground',
                            )}
                          >
                            <span className="block font-medium text-foreground">
                              {o.name}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {formatVnd(o.price)}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                    <div className="mt-3">
                      <Button
                        size="sm"
                        variant="primary"
                        disabled={savingAssign}
                        onClick={saveAssign}
                      >
                        {savingAssign ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4" />
                        )}
                        Lưu topping cho món
                      </Button>
                    </div>
                  </>
                )}
              </>
            )}
          </section>
        </div>
      )}

      <Toast toast={toast} onClose={() => setToast(null)} />
    </main>
  );
}