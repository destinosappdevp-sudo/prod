"use client";

import { useCallback, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { FileText, Image as ImageIcon, Trash2, Upload, ExternalLink, Loader2 } from "lucide-react";

export interface UserDocumentItem {
  id: string;
  url: string;
  fileName: string;
  fileSize: number | null;
  mimeType: string | null;
  uploadedAt: string;
}

interface DocumentsSectionProps {
  initialDocs: UserDocumentItem[];
  /** Si es true no muestra botones de subida/borrado (vista admin/readonly) */
  readOnly?: boolean;
}

function formatBytes(bytes: number | null): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isImage(mimeType: string | null): boolean {
  return !!mimeType && mimeType.startsWith("image/");
}

export default function DocumentsSection({ initialDocs, readOnly = false }: DocumentsSectionProps) {
  const [docs, setDocs] = useState<UserDocumentItem[]>(initialDocs);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploadError(null);
    setUploading(true);

    try {
      for (const file of Array.from(files)) {
        const form = new FormData();
        form.append("file", file);

        const res = await fetch("/api/user/documents", {
          method: "POST",
          body: form,
        });

        const data = await res.json();

        if (!res.ok) {
          setUploadError(data.error || "Error al subir el archivo");
          break;
        }

        setDocs((prev) => [data, ...prev]);
      }
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }, []);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/user/documents/${id}`, { method: "DELETE" });
      if (res.ok) {
        setDocs((prev) => prev.filter((d) => d.id !== id));
      }
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold">Documentos</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {readOnly
              ? "Documentos subidos por el usuario"
              : "Sube documentos de identidad u otros archivos requeridos"}
          </p>
        </div>
        {!readOnly && (
          <div>
            <label
              htmlFor="doc-upload"
              className={`inline-flex items-center gap-2 px-3 py-2 text-sm border border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${
                uploading ? "opacity-50 pointer-events-none" : ""
              }`}
            >
              {uploading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              {uploading ? "Subiendo..." : "Subir documento"}
            </label>
            <input
              ref={inputRef}
              id="doc-upload"
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              multiple
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
          </div>
        )}
      </div>

      {uploadError && (
        <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-700">{uploadError}</p>
        </div>
      )}

      {docs.length === 0 ? (
        <div className="text-center py-8 border border-dashed border-gray-200 rounded-lg">
          <FileText className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-400">No hay documentos subidos</p>
          {!readOnly && (
            <p className="text-xs text-gray-400 mt-1">JPG, PNG, WEBP o PDF — máx. 10 MB por archivo</p>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {docs.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 group"
            >
              {/* Ícono o miniatura */}
              <div className="flex-shrink-0 w-10 h-10 rounded overflow-hidden border bg-gray-100 flex items-center justify-center">
                {isImage(doc.mimeType) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={doc.url}
                    alt={doc.fileName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <FileText className="w-5 h-5 text-gray-400" />
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{doc.fileName}</p>
                <p className="text-xs text-gray-400">
                  {formatBytes(doc.fileSize)}
                  {doc.fileSize ? " · " : ""}
                  {new Date(doc.uploadedAt).toLocaleDateString("es", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </div>

              {/* Acciones */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <a
                  href={doc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded hover:bg-gray-200 text-gray-500 hover:text-blue-600 transition-colors"
                  title="Ver documento"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
                {!readOnly && (
                  <button
                    type="button"
                    onClick={() => handleDelete(doc.id)}
                    disabled={deletingId === doc.id}
                    className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                    title="Eliminar documento"
                  >
                    {deletingId === doc.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
