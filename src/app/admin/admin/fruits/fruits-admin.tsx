// ==================================================================
//  POS FRONTEND (Next.js)
//  src/app/admin/fruits/fruits-admin.tsx
//  Quan ly mon "Trái cây chấm muối" — THEM/SUA/XOA.
//  Goi qua backend POS (/api/fruits) -> backend POS proxy sang App
//  (x-internal-secret), GIONG HET news/voucher. Dung chung phien
//  dang nhap POS, KHONG can passcode rieng.
//  Moi mon co 3 size S(400g)/M(600g)/L(800g); gia size THAY gia.
//  Gia goc = gia size S.
// ==================================================================

'use client';

import { useEffect, useState, useCallback } from 'react';
import { Loader2, Plus, Pencil, Trash2, Save, X, RefreshCw } from 'lucide-react';
import { api, ApiError, type FruitProduct, type FruitOption } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Toast, type ToastState } from '@/components/ui/toast';

const FRUIT_CATEGORY = 'Trái cây chấm muối';
const SIZE_GROUP = 'Kích cỡ';

const inputCls =
  'w-full rounded-xl border bg-background px-3 py-2 outline-none transition focus:border-accent';

function money(n: number) {
  return (n || 0).toLocaleString('vi-VN') + 'đ';
}

function sizePrice(p: FruitProduct, id: string): number {
  const o = (p.options ?? []).find((x) => x.id === id && x.groupName === SIZE_GROUP);
  return o ? o.price : 0;
}

function buildSizeOptions(s: number, m: number, l: number): FruitOption[] {
  return [
    { id: 'size_s', name: 'S · 400g', price: s, groupName: SIZE_GROUP },
    { id: 'size_m', name: 'M · 600g', price: m, groupName: SIZE_GROUP },
    { id: 'size_l', name: 'L · 800g', price: l, groupName: SIZE_GROUP },
  ];
}

export function FruitsAdmin() {
  const [products, setProducts] = useState<FruitProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<ToastState>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [priceS, setPriceS] = useState('');
  const [priceM, setPriceM] = useState('');
  const [priceL, setPriceL] = useState('');
  const [saving, setSaving] = useState(false);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      setProducts(await api.listFruits());
    } catch (e) {
      setToast({
        type: 'error',
        message: e instanceof ApiError ? e.message : 'Không tải được danh sách',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setPriceS('');
    setPriceM('');
    setPriceL('');
  };

  const startEdit = (p: FruitProduct) => {
    setEditingId(p.id);
    setName(p.name);
    setPriceS(String(sizePrice(p, 'size_s') || p.price || ''));
    setPriceM(String(sizePrice(p, 'size_m') || ''));
    setPriceL(String(sizePrice(p, 'size_l') || ''));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const submit = async () => {
    if (!name.trim()) {
      setToast({ type: 'error', message: 'Nhập tên món' });
      return;
    }
    const s = Number(priceS),
      m = Number(priceM),
      l = Number(priceL);
    if (![s, m, l].every((x) => Number.isFinite(x) && x >= 1000)) {
      setToast({
        type: 'error',
        message: 'Cả 3 giá S/M/L phải ≥ 1.000đ (nhập theo đồng, vd 180000)',
      });
      return;
    }
    setSaving(true);
    try {
      const options = buildSizeOptions(s, m, l);
      if (editingId) {
        await api.updateFruit(editingId, { name: name.trim(), price: s, options });
        setToast({ type: 'success', message: 'Đã cập nhật món' });
      } else {
        await api.createFruit({
          name: name.trim(),
          category: FRUIT_CATEGORY,
          price: s,
          displayOrder: 100,
          isAvailable: true,
          options,
        });
        setToast({ type: 'success', message: 'Đã thêm món' });
      }
      resetForm();
      await loadProducts();
    } catch (e) {
      setToast({
        type: 'error',
        message: e instanceof ApiError ? e.message : 'Lưu thất bại',
      });
    } finally {
      setSaving(false);
    }
  };

  const remove = async (p: FruitProduct) => {
    if (!window.confirm(`Xoá món "${p.name}"? Thao tác này không hoàn tác.`)) return;
    try {
      await api.deleteFruit(p.id);
      setToast({ type: 'success', message: 'Đã xoá món' });
      if (editingId === p.id) resetForm();
      await loadProducts();
    } catch (e) {
      setToast({
        type: 'error',
        message: e instanceof ApiError ? e.message : 'Xoá thất bại',
      });
    }
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Danh mục “{FRUIT_CATEGORY}” · {products.length} món · đồng bộ trực tiếp với app
        </p>
        <Button size="sm" variant="secondary" onClick={loadProducts}>
          <RefreshCw className="h-4 w-4" /> Tải lại
        </Button>
      </div>

      <section className="mb-6 rounded-2xl border bg-card p-4">
        <h2 className="mb-3 font-bold">{editingId ? `Sửa: ${name}` : 'Thêm món mới'}</h2>
        <label className="block text-xs font-medium text-muted-foreground">
          Tên món
          <input
            className={`${inputCls} mt-1`}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Măng cụt"
          />
        </label>
        <div className="mt-3 grid grid-cols-3 gap-3">
          {[
            ['S · 400g', priceS, setPriceS] as const,
            ['M · 600g', priceM, setPriceM] as const,
            ['L · 800g', priceL, setPriceL] as const,
          ].map(([label, val, setter]) => (
            <label key={label} className="block text-xs font-medium text-muted-foreground">
              Giá {label}
              <input
                className={`${inputCls} mt-1`}
                value={val}
                onChange={(e) => setter(e.target.value)}
                inputMode="numeric"
                placeholder="180000"
              />
              {val && Number(val) > 0 && (
                <span className="mt-1 block text-[11px] text-accent">{money(Number(val))}</span>
              )}
            </label>
          ))}
        </div>
        <p className="mt-2 text-[11px] text-muted-foreground">
          Nhập giá theo <b>đồng</b> (ví dụ 180.000đ → gõ <b>180000</b>). Giá hiển thị mặc định trên app là giá size S.
        </p>
        <div className="mt-3 flex items-center gap-2">
          <Button size="sm" variant="primary" disabled={saving} onClick={submit}>
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : editingId ? (
              <Save className="h-4 w-4" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            {editingId ? 'Lưu' : 'Thêm món'}
          </Button>
          {editingId && (
            <Button size="sm" variant="ghost" onClick={resetForm}>
              <X className="h-4 w-4" /> Huỷ
            </Button>
          )}
        </div>
      </section>

      <section className="rounded-2xl border bg-card p-4">
        <h2 className="mb-3 font-bold">Danh sách món ({products.length})</h2>
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Đang tải…
          </div>
        ) : products.length === 0 ? (
          <p className="text-sm text-muted-foreground">Chưa có món nào. Thêm ở trên.</p>
        ) : (
          <div className="divide-y divide-border">
            {products.map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-medium">{p.name}</span>
                    {p.is_available === false && (
                      <span className="rounded bg-muted px-1.5 py-0.5 text-[10px]">đã ẩn</span>
                    )}
                  </div>
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    S {money(sizePrice(p, 'size_s'))} · M {money(sizePrice(p, 'size_m'))} · L{' '}
                    {money(sizePrice(p, 'size_l'))}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    onClick={() => startEdit(p)}
                    className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                    title="Sửa"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => remove(p)}
                    className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-red-600"
                    title="Xoá"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}