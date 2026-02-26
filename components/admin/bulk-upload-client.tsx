"use client";

import { useState, useRef, useCallback } from "react";
import {
  Upload,
  FileJson,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  Eye,
  Download,
} from "lucide-react";
import { toast } from "sonner";

import { bulkUploadProductsAction } from "@/actions/bulk-upload-actions";
import { Button } from "@/components/ui/button";

type UploadResult = {
  ok: boolean;
  message?: string;
  error?: string;
  imported: number;
  skipped: number;
  errors: string[];
};

type PreviewItem = {
  name: string;
  category: string;
  mrp: string;
  offer_price: string;
  net_qty: string;
  imageCount: number;
};

const SAMPLE_JSON = `[
  {
    "name": "Dettol Original Hand Sanitizer",
    "net_qty": "200 ml",
    "offer_price": "₹95",
    "discount": "5% Off",
    "mrp": "₹100",
    "category": "Personal Care",
    "image_urls": "['https://example.com/image1.jpg', 'https://example.com/image2.jpg']",
    "product_highlights": "{'Product Type': 'Hand Sanitizer', 'Weight': '200 ml'}",
    "description": "Dettol Original Hand Sanitizer keeps germs away."
  }
]`;

function countImages(raw: string): number {
  if (!raw || raw === "[]") return 0;
  try {
    const jsonified = raw.replace(/'/g, '"');
    const arr = JSON.parse(jsonified);
    return Array.isArray(arr) ? arr.length : 0;
  } catch {
    return raw.split(",").filter((s) => s.includes("http")).length;
  }
}

export function BulkUploadClient() {
  const [jsonText, setJsonText] = useState("");
  const [preview, setPreview] = useState<PreviewItem[] | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parsePreview = useCallback((text: string) => {
    try {
      const parsed = JSON.parse(text);
      const items = Array.isArray(parsed) ? parsed : [parsed];
      const previewed: PreviewItem[] = items
        .slice(0, 20)
        .map((item: Record<string, unknown>) => ({
          name: String(item.name || "Unnamed"),
          category: String(item.category || "General"),
          mrp: String(item.mrp || item.price || "—"),
          offer_price: String(item.offer_price || item.discount_price || "—"),
          net_qty: String(item.net_qty || "—"),
          imageCount: countImages(String(item.image_urls || "[]")),
        }));
      setPreview(previewed);
      return true;
    } catch {
      setPreview(null);
      return false;
    }
  }, []);

  const handleTextChange = (text: string) => {
    setJsonText(text);
    setResult(null);
    if (text.trim()) {
      parsePreview(text);
    } else {
      setPreview(null);
    }
  };

  const handleFileDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file && file.name.endsWith(".json")) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          const text = ev.target?.result as string;
          setJsonText(text);
          parsePreview(text);
          setResult(null);
        };
        reader.readAsText(file);
      } else {
        toast.error("Please drop a .json file.");
      }
    },
    [parsePreview],
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const text = ev.target?.result as string;
        setJsonText(text);
        parsePreview(text);
        setResult(null);
      };
      reader.readAsText(file);
    }
  };

  const handleUpload = async () => {
    if (!jsonText.trim()) {
      toast.error("Paste or upload JSON data first.");
      return;
    }

    setIsUploading(true);
    setResult(null);

    try {
      const res = await bulkUploadProductsAction(jsonText);
      setResult(res);
      if (res.ok) {
        toast.success(res.message || "Upload complete!");
      } else {
        toast.error(res.error || "Upload failed.");
      }
    } catch {
      toast.error("Something went wrong during upload.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-heading text-xl font-black text-text-main sm:text-2xl">
          Bulk Upload Products
        </h1>
        <p className="text-xs text-text-subtle sm:text-sm">
          Import products from a JSON file. Fields are automatically mapped to
          your database schema.
        </p>
      </div>

      {/* Field Mapping Info */}
      <div className="rounded-2xl border border-admin-border bg-admin-card p-4">
        <h3 className="mb-3 text-sm font-bold text-text-main">
          Auto Field Mapping
        </h3>
        <div className="grid gap-2 text-xs text-text-subtle sm:grid-cols-2 lg:grid-cols-3">
          <div className="flex items-center gap-2">
            <span className="inline-block w-28 rounded bg-white/10 px-2 py-0.5 font-mono text-[10px]">
              mrp
            </span>
            <span>→</span>
            <span className="font-medium text-text-main">Price (MRP)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-28 rounded bg-white/10 px-2 py-0.5 font-mono text-[10px]">
              offer_price
            </span>
            <span>→</span>
            <span className="font-medium text-text-main">Discount Price</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-28 rounded bg-white/10 px-2 py-0.5 font-mono text-[10px]">
              image_urls
            </span>
            <span>→</span>
            <span className="font-medium text-text-main">Multiple Images</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-28 rounded bg-white/10 px-2 py-0.5 font-mono text-[10px]">
              net_qty
            </span>
            <span>→</span>
            <span className="font-medium text-text-main">Net Quantity</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-28 rounded bg-white/10 px-2 py-0.5 font-mono text-[10px]">
              product_highlights
            </span>
            <span>→</span>
            <span className="font-medium text-text-main">
              Highlights (JSON)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-28 rounded bg-white/10 px-2 py-0.5 font-mono text-[10px]">
              category
            </span>
            <span>→</span>
            <span className="font-medium text-text-main">Auto-created</span>
          </div>
        </div>
      </div>

      {/* Drop zone & Text area */}
      <div
        className={`relative rounded-2xl border-2 border-dashed transition-colors ${
          dragOver
            ? "border-brand-red bg-brand-red/5"
            : "border-admin-border bg-admin-card"
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleFileDrop}
      >
        {!jsonText ? (
          <div className="flex flex-col items-center justify-center gap-4 p-10">
            <div className="rounded-2xl bg-white/5 p-4">
              <Upload className="h-10 w-10 text-text-subtle" />
            </div>
            <div className="text-center">
              <p className="font-bold text-text-main">
                Drop your JSON file here or paste below
              </p>
              <p className="mt-1 text-xs text-text-subtle">
                Supports .json files with product arrays
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
              >
                <FileJson size={14} />
                Choose File
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setJsonText(SAMPLE_JSON);
                  parsePreview(SAMPLE_JSON);
                }}
              >
                <Download size={14} />
                Load Sample
              </Button>
            </div>
          </div>
        ) : (
          <div className="p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-bold text-text-subtle">
                JSON Data
              </span>
              <button
                type="button"
                onClick={() => {
                  setJsonText("");
                  setPreview(null);
                  setResult(null);
                }}
                className="rounded-lg p-1.5 text-text-subtle hover:bg-white/10 hover:text-text-main"
              >
                <X size={14} />
              </button>
            </div>
            <textarea
              value={jsonText}
              onChange={(e) => handleTextChange(e.target.value)}
              className="h-48 w-full resize-y rounded-xl border border-admin-border bg-white/5 p-3 font-mono text-xs text-text-main outline-none focus:border-brand-red/50"
              spellCheck={false}
            />
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          className="hidden"
          onChange={handleFileSelect}
        />
      </div>

      {/* Preview */}
      {preview && preview.length > 0 && (
        <div className="rounded-2xl border border-admin-border bg-admin-card p-4">
          <div className="mb-3 flex items-center gap-2">
            <Eye size={14} className="text-brand-red" />
            <h3 className="text-sm font-bold text-text-main">
              Preview ({preview.length} {preview.length === 20 ? "of many" : ""}{" "}
              items)
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-admin-border text-left text-text-subtle">
                  <th className="pb-2 pr-3 font-bold">#</th>
                  <th className="pb-2 pr-3 font-bold">Name</th>
                  <th className="pb-2 pr-3 font-bold">Category</th>
                  <th className="pb-2 pr-3 font-bold">MRP</th>
                  <th className="pb-2 pr-3 font-bold">Offer</th>
                  <th className="pb-2 pr-3 font-bold">Net Qty</th>
                  <th className="pb-2 font-bold">Images</th>
                </tr>
              </thead>
              <tbody>
                {preview.map((item, i) => (
                  <tr
                    key={i}
                    className="border-b border-admin-border/50 text-text-main"
                  >
                    <td className="py-2 pr-3 text-text-subtle">{i + 1}</td>
                    <td className="max-w-[200px] truncate py-2 pr-3 font-medium">
                      {item.name}
                    </td>
                    <td className="py-2 pr-3">{item.category}</td>
                    <td className="py-2 pr-3">{item.mrp}</td>
                    <td className="py-2 pr-3">{item.offer_price}</td>
                    <td className="py-2 pr-3">{item.net_qty}</td>
                    <td className="py-2">{item.imageCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Upload Button */}
      <div className="flex items-center gap-4">
        <Button
          onClick={handleUpload}
          disabled={isUploading || !jsonText.trim()}
          className="gap-2"
        >
          {isUploading ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload size={14} />
              Import Products
            </>
          )}
        </Button>

        {preview && (
          <span className="text-xs text-text-subtle">
            {preview.length} product{preview.length !== 1 ? "s" : ""} ready to
            import
          </span>
        )}
      </div>

      {/* Result */}
      {result && (
        <div
          className={`rounded-2xl border p-4 ${
            result.ok
              ? "border-emerald-500/30 bg-emerald-500/5"
              : "border-rose-500/30 bg-rose-500/5"
          }`}
        >
          <div className="flex items-start gap-3">
            {result.ok ? (
              <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-500" />
            ) : (
              <AlertCircle className="mt-0.5 h-5 w-5 text-rose-400" />
            )}
            <div className="flex-1 space-y-2">
              <p className="text-sm font-bold text-text-main">
                {result.ok ? result.message : result.error}
              </p>
              <div className="flex gap-4 text-xs text-text-subtle">
                <span>Imported: {result.imported}</span>
                <span>Skipped: {result.skipped}</span>
              </div>
              {result.errors.length > 0 && (
                <div className="mt-2 max-h-32 overflow-y-auto rounded-lg bg-white/5 p-2">
                  {result.errors.map((err, i) => (
                    <p key={i} className="text-xs text-rose-400">
                      {err}
                    </p>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
