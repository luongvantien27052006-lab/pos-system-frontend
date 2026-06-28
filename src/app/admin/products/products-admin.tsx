'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Coffee, ImagePlus, Loader2, Pencil, RotateCcw, Trash2, X } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import { resolveImageUrl } from '@/lib/image';
import { formatVnd } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { AdminProduct, MenuCategory } from '@/types';
import { Button } from '@/components/ui/button';
import { Toast, type ToastState } from '@/components/ui/toast';

const inputClass =
  'w-full rounded-xl border bg-background px-3 py-2 outline-none transition focus:border-accent';

export function ProductsAdmin() {
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [editing, setEditing] = useState<AdminProduct | null>(null);

  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Tải danh mục + danh sách món
  useEffect(() => {
    (async () => {
      try {
        const [menu, list] = await Promise.all([
          api.getMenu(),
          api.listProducts(),
        ]);
        setCategories(menu.categories);
        setProducts(list);
        if (menu.categories[0]) setCategoryId(String(menu.categories[0].id));
      } catch {
        setToast({ type: 'error', message: 'Không tải được dữ liệu' });
      }
    })();
  }, []);

  // Xem trước ảnh: tạo & thu hồi object URL theo file
  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const resetForm = () => {
    setEditing(null);
    setName('');
    setPrice('');
    setFile(null);
    setCategoryId(categories[0] ? String(categories[0].id) : '');
    if (fileRef.current) fileRef.current.value = '';
  };

  const startEdit = (p: AdminProduct) => {
    setEditing(p);
    setName(p.name);
    setPrice(String(p.price));
    setCategoryId(String(p.categoryId));
    setFile(null);
    if (fileRef.current) fileRef.current.value = '';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const submit = async () => {
    if (!name.trim()) return setToast({ type: 'error', message: 'Nhập tên món' });
    if (!price || Number(price) <= 0)
      return setToast({ type: 'error', message: 'Nhập giá hợp lệ' });
    if (!categoryId)
      return setToast({ type: 'error', message: 'Chọn danh mục' });
    // Ảnh: bắt buộc khi tạo mới, tùy chọn khi sửa
    if (!editing && !file)
      return setToast({ type: 'error', message: 'Chọn ảnh món ăn' });

    const form = new FormData();
    form.append('name', name.trim());
    form.append('price', String(Number(price)));
    form.append('category_id', categoryId);
    if (file) form.append('image', file);

    setSubmitting(true);
    try {
      if (editing) {
        await api.updateProduct(editing.id, form);
        setToast({ type: 'success', message: 'Đã cập nhật món' });
      } else {
        await api.createProduct(form);
        setToast({ type: 'success', message: 'Đã thêm món mới' });
      }
      resetForm();
      setProducts(await api.listProducts());
    } catch (e) {
      setToast({
        type: 'error',
        message: e instanceof ApiError ? e.message : 'Lưu món thất bại',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const restore = async (id: number) => {
    try {
      await api.restoreProduct(id);
      setProducts((prev) =>
        prev.map((x) => (x.id === id ? { ...x, isActive: true } : x)),
      );
      setToast({ type: 'success', message: 'Đã mở bán lại' });
    } catch {
      setToast({ type: 'error', message: 'Không thể mở bán' });
    }
  };

  const remove = async (id: number) => {
    try {
      await api.deleteProduct(id);
      setProducts((prev) =>
        prev.map((x) => (x.id === id ? { ...x, isActive: false } : x)),
      );
      setToast({ type: 'success', message: 'Đã ngừng bán' });
    } catch {
      setToast({ type: 'error', message: 'Không thể ngừng bán' });
    }
  };

  // Ảnh xem trước: ưu tiên file mới chọn, nếu đang sửa thì hiện ảnh hiện tại
  const previewSrc =
    preview ?? (editing ? resolveImageUrl(editing.imageUrl) : null);

  return (
    <main className="mx-auto min-h-dvh max-w-5xl px-5 py-8">
      <Toast toast={toast} onClose={() => setToast(null)} />

      <header className="mb-6">
        <Link
          href="/"
          className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Trang chủ
        </Link>
        <h1 className="text-2xl font-bold">Quản lý món</h1>
      </header>

      <div className="grid gap-8 lg:grid-cols-[380px_1fr]">
        {/* Form thêm món */}
        <div className="h-fit space-y-4 rounded-2xl border bg-card p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">
              {editing ? 'Sửa món' : 'Thêm món mới'}
            </h2>
            {editing && (
              <button
                type="button"
                onClick={resetForm}
                className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground"
              >
                <X className="h-4 w-4" /> Hủy
              </button>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Tên món</label>
            <input
              className={inputClass}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="VD: Cà phê sữa đá"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Giá (VND)</label>
            <input
              type="number"
              min={0}
              className={cn(inputClass, 'tabular')}
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="29000"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Danh mục</label>
            <select
              className={inputClass}
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Ảnh món ăn</label>
            <div className="flex items-center gap-4">
              <label className="flex h-24 w-24 cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-dashed bg-muted/40 transition hover:border-accent">
                {previewSrc ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={previewSrc}
                    alt="Xem trước"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <ImagePlus className="h-7 w-7 text-muted-foreground" />
                )}
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                />
              </label>
              <p className="text-xs text-muted-foreground">
                JPG, PNG, WEBP
                <br />
                Tối đa 5MB
                {editing && (
                  <>
                    <br />
                    Để trống nếu giữ ảnh cũ
                  </>
                )}
              </p>
            </div>
          </div>

          <Button
            variant="accent"
            size="lg"
            className="w-full"
            disabled={submitting}
            onClick={submit}
          >
            {submitting && <Loader2 className="h-5 w-5 animate-spin" />}
            {submitting
              ? 'Đang lưu…'
              : editing
                ? 'Cập nhật'
                : 'Lưu món'}
          </Button>
        </div>

        {/* Danh sách món */}
        <div className="space-y-3">
          <h2 className="text-lg font-bold">Danh sách món ({products.length})</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {products.map((p) => {
              const img = resolveImageUrl(p.imageUrl);
              return (
                <div
                  key={p.id}
                  className={cn(
                    'flex gap-3 rounded-xl border bg-card p-3',
                    !p.isActive && 'opacity-50',
                  )}
                >
                  {img ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={img}
                      alt={p.name}
                      className="h-16 w-16 shrink-0 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                      <Coffee className="h-6 w-6" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-semibold">{p.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {p.categoryName}
                    </div>
                    <div className="text-sm font-semibold tabular text-accent">
                      {formatVnd(p.price)}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <button
                      type="button"
                      aria-label="Sửa món"
                      onClick={() => startEdit(p)}
                      className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-muted hover:text-accent"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    {p.isActive ? (
                      <button
                        type="button"
                        aria-label="Ngừng bán"
                        onClick={() => remove(p.id)}
                        className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-muted hover:text-warning-foreground"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        aria-label="Mở bán lại"
                        onClick={() => restore(p.id)}
                        className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-muted hover:text-success"
                      >
                        <RotateCcw className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </main>
  );
}