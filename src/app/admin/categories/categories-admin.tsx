'use client';

import { useEffect, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Check,
  Eye,
  EyeOff,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import { api, ApiError, type AdminCategory } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Toast, type ToastState } from '@/components/ui/toast';

const inputClass =
  'w-full rounded-xl border bg-background px-3 py-2 outline-none transition focus:border-accent';

export function CategoriesAdmin() {
  const [cats, setCats] = useState<AdminCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [adding, setAdding] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [busy, setBusy] = useState<number | null>(null);
  const [toast, setToast] = useState<ToastState>(null);

  const load = async () => {
    setLoading(true);
    try {
      setCats(await api.listCategories());
    } catch {
      setToast({ type: 'error', message: 'Không tải được danh mục' });
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    void load();
  }, []);

  const add = async () => {
    const nm = newName.trim();
    if (!nm) return setToast({ type: 'error', message: 'Nhập tên danh mục' });
    setAdding(true);
    try {
      await api.createCategory({ name: nm });
      setNewName('');
      await load();
      setToast({ type: 'success', message: 'Đã thêm danh mục' });
    } catch (e) {
      setToast({
        type: 'error',
        message: e instanceof ApiError ? e.message : 'Thêm thất bại',
      });
    } finally {
      setAdding(false);
    }
  };

  const saveEdit = async (id: number) => {
    const nm = editName.trim();
    if (!nm) return setToast({ type: 'error', message: 'Tên không được trống' });
    setBusy(id);
    try {
      await api.updateCategory(id, { name: nm });
      setEditId(null);
      await load();
      setToast({ type: 'success', message: 'Đã đổi tên' });
    } catch (e) {
      setToast({
        type: 'error',
        message: e instanceof ApiError ? e.message : 'Lưu thất bại',
      });
    } finally {
      setBusy(null);
    }
  };

  const toggle = async (c: AdminCategory) => {
    setBusy(c.id);
    try {
      await api.updateCategory(c.id, { isActive: !c.isActive });
      await load();
    } catch (e) {
      setToast({
        type: 'error',
        message: e instanceof ApiError ? e.message : 'Thất bại',
      });
    } finally {
      setBusy(null);
    }
  };

  const move = async (c: AdminCategory, dir: -1 | 1) => {
    const idx = cats.findIndex((x) => x.id === c.id);
    const swapIdx = idx + dir;
    if (swapIdx < 0 || swapIdx >= cats.length) return;
    const other = cats[swapIdx];
    // Nếu trùng display_order thì gán tạm để đổi được chỗ.
    const a = c.displayOrder;
    const b = other.displayOrder === a ? a + dir : other.displayOrder;
    setBusy(c.id);
    try {
      await api.updateCategory(c.id, { displayOrder: b });
      await api.updateCategory(other.id, { displayOrder: a });
      await load();
    } catch {
      setToast({ type: 'error', message: 'Đổi thứ tự thất bại' });
    } finally {
      setBusy(null);
    }
  };

  const remove = async (c: AdminCategory) => {
    if (!confirm(`Xoá danh mục "${c.name}"?`)) return;
    setBusy(c.id);
    try {
      await api.deleteCategory(c.id);
      await load();
      setToast({ type: 'success', message: 'Đã xoá danh mục' });
    } catch (e) {
      setToast({
        type: 'error',
        message: e instanceof ApiError ? e.message : 'Không thể xoá',
      });
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="max-w-2xl space-y-5">
      <Toast toast={toast} onClose={() => setToast(null)} />

      {/* Thêm danh mục */}
      <div className="flex gap-2 rounded-2xl border bg-card p-4">
        <input
          className={inputClass}
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Tên danh mục mới (VD: Smoothie kem thái)"
          onKeyDown={(e) => {
            if (e.key === 'Enter') void add();
          }}
        />
        <Button variant="accent" onClick={() => void add()} disabled={adding}>
          {adding ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
          Thêm
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Đang tải…
        </div>
      ) : cats.length === 0 ? (
        <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
          Chưa có danh mục nào.
        </p>
      ) : (
        <div className="space-y-2">
          {cats.map((c, i) => (
            <div
              key={c.id}
              className={cn(
                'flex items-center gap-2 rounded-xl border bg-card p-3',
                !c.isActive && 'opacity-60',
              )}
            >
              <div className="flex flex-col text-muted-foreground">
                <button
                  type="button"
                  aria-label="Lên"
                  disabled={i === 0 || busy === c.id}
                  onClick={() => void move(c, -1)}
                  className="transition hover:text-accent disabled:opacity-30"
                >
                  <ArrowUp className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  aria-label="Xuống"
                  disabled={i === cats.length - 1 || busy === c.id}
                  onClick={() => void move(c, 1)}
                  className="transition hover:text-accent disabled:opacity-30"
                >
                  <ArrowDown className="h-4 w-4" />
                </button>
              </div>

              <div className="min-w-0 flex-1">
                {editId === c.id ? (
                  <input
                    className={inputClass}
                    value={editName}
                    autoFocus
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') void saveEdit(c.id);
                      if (e.key === 'Escape') setEditId(null);
                    }}
                  />
                ) : (
                  <>
                    <div className="truncate font-semibold">
                      {c.name}
                      {!c.isActive && (
                        <span className="ml-2 text-xs font-normal text-muted-foreground">
                          (đang ẩn)
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {c.productCount} món đang bán
                    </div>
                  </>
                )}
              </div>

              {editId === c.id ? (
                <>
                  <button
                    type="button"
                    aria-label="Lưu"
                    onClick={() => void saveEdit(c.id)}
                    disabled={busy === c.id}
                    className="rounded-lg p-1.5 text-success transition hover:bg-muted"
                  >
                    {busy === c.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4" />
                    )}
                  </button>
                  <button
                    type="button"
                    aria-label="Huỷ"
                    onClick={() => setEditId(null)}
                    className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-muted"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    aria-label="Đổi tên"
                    onClick={() => {
                      setEditId(c.id);
                      setEditName(c.name);
                    }}
                    className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-muted hover:text-accent"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    aria-label={c.isActive ? 'Ẩn' : 'Hiện'}
                    onClick={() => void toggle(c)}
                    disabled={busy === c.id}
                    className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-muted"
                  >
                    {c.isActive ? (
                      <Eye className="h-4 w-4" />
                    ) : (
                      <EyeOff className="h-4 w-4" />
                    )}
                  </button>
                  <button
                    type="button"
                    aria-label="Xoá"
                    onClick={() => void remove(c)}
                    disabled={busy === c.id}
                    className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-muted hover:text-warning-foreground"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Dùng ▲▼ để đổi thứ tự hiện trên menu POS. Danh mục mới sẽ xuất hiện ngay
        trong ô “Danh mục” khi thêm/sửa món. Không xoá được danh mục còn món đang
        bán — hãy chuyển hoặc ngừng bán các món đó trước.
      </p>
    </div>
  );
}
