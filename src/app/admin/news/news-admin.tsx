// ============================================================
//  POS FRONTEND (Next.js 14)
//  src/app/admin/news/news-admin.tsx
//  >> FILE MOI
// ============================================================

'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Calendar,
  Eye,
  EyeOff,
  ImagePlus,
  Loader2,
  Newspaper,
  Pencil,
  Trash2,
  X,
} from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import { resolveImageUrl } from '@/lib/image';
import { cn } from '@/lib/utils';
import type { NewsItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Toast, type ToastState } from '@/components/ui/toast';

const inputClass =
  'w-full rounded-xl border bg-background px-3 py-2 outline-none transition focus:border-accent';

function formatDate(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('vi-VN');
}

export function NewsAdmin() {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [editing, setEditing] = useState<NewsItem | null>(null);

  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [isPublished, setIsPublished] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<ToastState>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const reload = async () => {
    try {
      setItems(await api.listNewsAdmin());
    } catch {
      setToast({ type: 'error', message: 'Không tải được tin tức' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reload();
  }, []);

  // Xem trước ảnh
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
    setTitle('');
    setSummary('');
    setContent('');
    setIsPublished(true);
    setFile(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  const startEdit = (n: NewsItem) => {
    setEditing(n);
    setTitle(n.title);
    setSummary(n.summary ?? '');
    setContent(n.content ?? '');
    setIsPublished(n.isPublished);
    setFile(null);
    if (fileRef.current) fileRef.current.value = '';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const submit = async () => {
    if (!title.trim()) {
      return setToast({ type: 'error', message: 'Nhập tiêu đề' });
    }

    setSubmitting(true);
    try {
      let imageUrl = editing?.imageUrl ?? null;
      if (file) imageUrl = await api.uploadNewsImage(file);

      const body = {
        title: title.trim(),
        summary: summary.trim() ? summary.trim() : null,
        content,
        imageUrl,
        isPublished,
      };

      if (editing) {
        await api.updateNews(editing.id, body);
        setToast({ type: 'success', message: 'Đã cập nhật tin' });
      } else {
        await api.createNews(body);
        setToast({ type: 'success', message: 'Đã đăng tin mới' });
      }
      resetForm();
      await reload();
    } catch (e) {
      setToast({
        type: 'error',
        message: e instanceof ApiError ? e.message : 'Lưu tin thất bại',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const togglePublish = async (n: NewsItem) => {
    try {
      await api.updateNews(n.id, { isPublished: !n.isPublished });
      setItems((prev) =>
        prev.map((x) =>
          x.id === n.id ? { ...x, isPublished: !x.isPublished } : x,
        ),
      );
    } catch {
      setToast({ type: 'error', message: 'Không đổi được trạng thái' });
    }
  };

  const remove = async (n: NewsItem) => {
    if (!window.confirm(`Xoá tin "${n.title}"?`)) return;
    try {
      await api.deleteNews(n.id);
      setItems((prev) => prev.filter((x) => x.id !== n.id));
      setToast({ type: 'success', message: 'Đã xoá tin' });
    } catch {
      setToast({ type: 'error', message: 'Không xoá được tin' });
    }
  };

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
        <h1 className="text-2xl font-bold">Quản lý tin tức</h1>
        <p className="text-sm text-muted-foreground">
          Đăng thông báo, tin khuyến mãi… sẽ hiển thị trên app khách.
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[380px_1fr]">
        {/* Form đăng/sửa tin */}
        <div className="h-fit space-y-4 rounded-2xl border bg-card p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">
              {editing ? 'Sửa tin' : 'Đăng tin mới'}
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
            <label className="mb-1 block text-sm font-medium">Tiêu đề</label>
            <input
              className={inputClass}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="VD: Ưu đãi cuối tuần"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Mô tả ngắn</label>
            <input
              className={inputClass}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="1 dòng tóm tắt (tùy chọn)"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Nội dung</label>
            <textarea
              className={cn(inputClass, 'min-h-[140px] resize-y')}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Nội dung chi tiết của tin…"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Ảnh bìa (tùy chọn)
            </label>
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

          <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
              className="h-4 w-4 rounded border-muted-foreground/40 accent-accent"
            />
            Hiển thị cho khách (đã đăng)
          </label>

          <Button
            variant="accent"
            size="lg"
            className="w-full"
            disabled={submitting}
            onClick={submit}
          >
            {submitting && <Loader2 className="h-5 w-5 animate-spin" />}
            {submitting ? 'Đang lưu…' : editing ? 'Cập nhật' : 'Đăng tin'}
          </Button>
        </div>

        {/* Danh sách tin */}
        <div className="space-y-3">
          <h2 className="text-lg font-bold">Danh sách tin ({items.length})</h2>

          {loading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Đang tải…
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">
              Chưa có tin nào. Đăng tin đầu tiên ở khung bên trái.
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((n) => {
                const img = resolveImageUrl(n.imageUrl);
                return (
                  <div
                    key={n.id}
                    className={cn(
                      'flex gap-3 rounded-xl border bg-card p-3',
                      !n.isPublished && 'opacity-60',
                    )}
                  >
                    {img ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={img}
                        alt={n.title}
                        className="h-16 w-16 shrink-0 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                        <Newspaper className="h-6 w-6" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-semibold">{n.title}</div>
                      {n.summary && (
                        <div className="truncate text-xs text-muted-foreground">
                          {n.summary}
                        </div>
                      )}
                      <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {formatDate(n.publishedAt)}
                        <span
                          className={cn(
                            'rounded-full px-2 py-0.5 text-[11px] font-medium',
                            n.isPublished
                              ? 'bg-success/15 text-success'
                              : 'bg-muted text-muted-foreground',
                          )}
                        >
                          {n.isPublished ? 'Đang hiển thị' : 'Đang ẩn'}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <button
                        type="button"
                        aria-label="Sửa tin"
                        onClick={() => startEdit(n)}
                        className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-muted hover:text-accent"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        aria-label={n.isPublished ? 'Ẩn tin' : 'Hiển thị'}
                        onClick={() => togglePublish(n)}
                        className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                      >
                        {n.isPublished ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                      <button
                        type="button"
                        aria-label="Xoá tin"
                        onClick={() => remove(n)}
                        className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-muted hover:text-warning-foreground"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}