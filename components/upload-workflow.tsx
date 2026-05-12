"use client";

import { startTransition, useMemo, useRef, useState } from "react";
import { FileText, Loader2, Sparkles, Upload, X } from "lucide-react";

type UploadResultItem = {
  id: string;
  studentName: string;
  sourceType: string;
  status: string;
  extractedTextLength: number;
};

type ProcessResultItem = {
  assignmentId: string;
  studentName: string;
  suggestedGrade: number;
  feedback: string;
  status: string;
};

export function UploadWorkflow() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [studentName, setStudentName] = useState("");
  const [className, setClassName] = useState("7º ano A");
  const [assignmentTitle, setAssignmentTitle] = useState("Lista de exercícios");
  const [gradeScale, setGradeScale] = useState<10 | 100>(10);
  const [textInput, setTextInput] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [uploadedItems, setUploadedItems] = useState<UploadResultItem[]>([]);
  const [processedItems, setProcessedItems] = useState<ProcessResultItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const canUpload = useMemo(() => files.length > 0 || textInput.trim().length > 0, [files, textInput]);

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleUpload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsUploading(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.set("title", assignmentTitle);
      formData.set("className", className);
      formData.set("studentName", studentName);
      formData.set("gradeScale", String(gradeScale));
      files.forEach((file) => formData.append("files", file));
      if (textInput.trim()) formData.set("textInput", textInput.trim());

      const response = await fetch("/api/assignments", { method: "POST", body: formData });
      const payload = (await response.json()) as { message?: string; items?: UploadResultItem[] };

      if (!response.ok) throw new Error(payload.message || "Não foi possível enviar as tarefas.");

      setUploadedItems(payload.items ?? []);
      setProcessedItems([]);
      setTextInput("");
      setFiles([]);
      setStudentName("");
      setMessage(payload.message || "Tarefas enviadas com sucesso.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Falha no envio das tarefas.");
    } finally {
      setIsUploading(false);
    }
  }

  function handleProcess() {
    startTransition(async () => {
      setIsProcessing(true);
      setMessage(null);

      try {
        const response = await fetch("/api/assignments/batch-process", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ assignmentIds: uploadedItems.map((item) => item.id) }),
        });

        const payload = (await response.json()) as {
          message?: string;
          items?: ProcessResultItem[];
        };

        if (!response.ok) throw new Error(payload.message || "Não foi possível processar as tarefas.");

        setProcessedItems(payload.items ?? []);
        setMessage(payload.message || "Correções geradas para revisão.");
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Falha ao processar lote.");
      } finally {
        setIsProcessing(false);
      }
    });
  }

  return (
    <div className="space-y-5">
      <section className="card-shadow rounded-xl border border-border bg-white/90 p-6 backdrop-blur sm:p-8">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.28em] text-primary">Envio em lote</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground">Enviar atividade</h1>
            <p className="mt-2 max-w-xl text-sm leading-7 text-muted">
              Faça upload de fotos, PDFs ou cole uma resposta em texto. Depois, processe tudo para
              gerar correções assistidas por IA.
            </p>
          </div>
          <div className="shrink-0 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800">
            Você revisa cada resultado antes da aprovação.
          </div>
        </div>

        <form onSubmit={handleUpload} className="mt-8 space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1.5">
              <span className="text-sm font-medium text-foreground">Título da atividade</span>
              <input
                value={assignmentTitle}
                onChange={(e) => setAssignmentTitle(e.target.value)}
                maxLength={200}
                className="w-full rounded-lg border border-border bg-white px-4 py-3 text-sm outline-none focus:border-primary"
              />
            </label>

            <label className="space-y-1.5">
              <span className="text-sm font-medium text-foreground">Turma</span>
              <input
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                maxLength={100}
                className="w-full rounded-lg border border-border bg-white px-4 py-3 text-sm outline-none focus:border-primary"
              />
            </label>

            <label className="space-y-1.5">
              <span className="text-sm font-medium text-foreground">Nome do aluno</span>
              <input
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="Opcional — usa o nome do arquivo se vazio"
                maxLength={100}
                className="w-full rounded-lg border border-border bg-white px-4 py-3 text-sm outline-none placeholder:text-muted focus:border-primary"
              />
            </label>

            <label className="space-y-1.5">
              <span className="text-sm font-medium text-foreground">Escala da nota</span>
              <select
                value={gradeScale}
                onChange={(e) => setGradeScale(Number(e.target.value) as 10 | 100)}
                className="w-full rounded-lg border border-border bg-white px-4 py-3 text-sm outline-none focus:border-primary"
              >
                <option value={10}>0 a 10</option>
                <option value={100}>0 a 100</option>
              </select>
            </label>
          </div>

          {/* File drop area */}
          <div>
            <span className="text-sm font-medium text-foreground">Arquivos da atividade</span>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="mt-2 flex w-full cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-border bg-surface py-8 text-center hover:border-primary hover:bg-amber-50/50"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Upload className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Clique para selecionar arquivos</p>
                <p className="mt-1 text-xs text-muted">PDF ou imagem (JPG, PNG, WEBP)</p>
              </div>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,image/*"
              className="hidden"
              onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
            />
            {files.length > 0 && (
              <ul className="mt-3 space-y-2">
                {files.map((file, i) => (
                  <li
                    key={i}
                    className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="h-4 w-4 shrink-0 text-muted" />
                      <span className="truncate text-sm text-foreground">{file.name}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(i)}
                      className="shrink-0 text-muted hover:text-danger"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-foreground">
              Ou cole a resposta em texto
            </span>
            <textarea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              rows={6}
              maxLength={50000}
              placeholder="Cole aqui a resposta do aluno quando não houver arquivo..."
              className="w-full rounded-lg border border-border bg-white px-4 py-4 text-sm outline-none placeholder:text-muted focus:border-primary"
            />
          </label>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="submit"
              disabled={!canUpload || isUploading}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary-strong disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {isUploading ? "Enviando..." : "Enviar atividade"}
            </button>
            <button
              type="button"
              onClick={handleProcess}
              disabled={uploadedItems.length === 0 || isProcessing}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-white px-6 py-3 text-sm font-semibold text-foreground hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {isProcessing ? "Processando com IA..." : "Corrigir com IA"}
            </button>
          </div>
        </form>

        {message ? (
          <p className="mt-5 rounded-lg border border-border bg-surface px-4 py-3 text-sm text-foreground">
            {message}
          </p>
        ) : null}
      </section>

      {/* Results */}
      <section className="grid gap-4 lg:grid-cols-2">
        <article className="card-shadow rounded-xl border border-border bg-white/90 p-6">
          <h2 className="text-lg font-bold text-foreground">Itens enviados</h2>
          <p className="mt-1 text-sm text-muted">Prontos para processar com IA.</p>
          <div className="mt-4 space-y-3">
            {uploadedItems.length === 0 ? (
              <p className="rounded-lg border border-border bg-surface p-4 text-sm text-muted">
                Nenhuma atividade enviada nesta sessão.
              </p>
            ) : (
              uploadedItems.map((item) => (
                <div key={item.id} className="rounded-lg border border-border bg-surface p-4">
                  <p className="font-medium text-foreground">{item.studentName}</p>
                  <p className="mt-1 text-sm text-muted">
                    {item.sourceType.toUpperCase()} · {item.extractedTextLength} caracteres extraídos
                  </p>
                </div>
              ))
            )}
          </div>
        </article>

        <article className="card-shadow rounded-xl border border-border bg-white/90 p-6">
          <h2 className="text-lg font-bold text-foreground">Resultado do lote</h2>
          <p className="mt-1 text-sm text-muted">Correções sugeridas pela IA para revisão.</p>
          <div className="mt-4 space-y-3">
            {processedItems.length === 0 ? (
              <p className="rounded-lg border border-border bg-surface p-4 text-sm text-muted">
                As correções aparecerão aqui após o processamento.
              </p>
            ) : (
              processedItems.map((item) => (
                <div key={item.assignmentId} className="rounded-lg border border-border bg-surface p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium text-foreground">{item.studentName}</p>
                    <span className="rounded-lg bg-amber-100 px-3 py-1 text-sm font-medium text-amber-800">
                      Nota sugerida: {item.suggestedGrade}
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-muted">{item.feedback}</p>
                </div>
              ))
            )}
          </div>
        </article>
      </section>
    </div>
  );
}
