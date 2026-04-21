"use client";

import { CloudUploadIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

import { ImageGenerationOptions } from "@/components/app/image-generation-options";
import { createDocument, uploadDocument } from "@/lib/api/docs";
import { useStableMemo } from "@/lib/hooks/stable-memo";
import { cn, pickFiles } from "@/lib/utils";

export default function () {
  const router = useRouter();

  const [files, setFiles] = useState<File[]>([]);
  const [tabIndex, setTabIndex] = useState(0);

  const fileUrls = useStableMemo(
    files,
    (file) => URL.createObjectURL(file),
    (url, _file) => URL.revokeObjectURL(url),
  );

  const unselectFile = () => {
    setFiles(files.toSpliced(tabIndex, 1));
    if (tabIndex >= files.length - 1) {
      setTabIndex(tabIndex - 1);
    } else {
    }
  };
  const selectFile = async () => {
    let picked = await pickFiles(".pdf");
    picked = picked.filter((f) => !files.includes(f));
    if (picked.length === 0) return;
    setFiles([...files, ...picked]);
    setTabIndex(files.length);
  };

  const [enableImages, setEnableImages] = useState(true);
  const [languageStyle, setLanguageStyle] = useState<"plain" | "easyread">("easyread");
  const [query, setQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const normalizedQuery = query.trim();
  const isSubmitDisabled = isSubmitting || (files.length === 0 && normalizedQuery.length === 0);

  const handleCreateDocument = async () => {
    if (files.length === 0 && normalizedQuery.length === 0) {
      toast.error("Please provide a query or upload at least one file.");
      return;
    }

    setIsSubmitting(true);
    try {
      const uploadedIds = files.length > 0 ? await Promise.all(files.map((file) => uploadDocument(file))) : undefined;
      await createDocument({
        files: uploadedIds,
        query: normalizedQuery,
        language_style: languageStyle,
        auto_generate_images: enableImages,
      });

      toast.success("Document queued for processing.");
      router.push("/docs");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unexpected error while creating document.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main
      className={cn(
        "flex",
        "max-md:min-h-[var(--page-height)] max-md:flex-col max-md:gap-4 max-md:p-4",
        "md:h-[var(--page-height)] md:items-stretch md:overflow-hidden",
      )}
    >
      {files.length > 0 ? (
        <div className="flex flex-1 flex-col gap-4 overflow-hidden p-8 max-md:contents">
          <iframe src={fileUrls[tabIndex]} className="min-h-0 flex-1 rounded-lg border max-md:min-h-96"></iframe>
          <div className="flex items-center gap-2">
            <Select value={String(tabIndex)} onValueChange={(v) => setTabIndex(Number(v))}>
              <SelectTrigger className="flex-1 truncate">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {files.map((file, index) => (
                  <SelectItem key={index} value={String(index)}>
                    {file.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={unselectFile}>
              <Trash2Icon />
            </Button>
            <Button size="icon" onClick={selectFile}>
              <PlusIcon />
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-4 p-8 max-md:min-h-106 max-md:rounded-lg max-md:border max-md:border-dashed max-md:px-4 md:flex-1">
          <CloudUploadIcon className="text-muted-foreground size-12" />
          <div className="text-muted-foreground text-xs">Supported formats: PDF, DOCX (Max 10MB)</div>
          <Button onClick={selectFile}>Browse Files</Button>
        </div>
      )}

      <div className="flex w-3/8 flex-col gap-8 overflow-x-hidden overflow-y-auto border-l p-8 max-md:contents">
        <div className="flex flex-1 flex-col gap-4 max-md:contents">
          <div className="flex flex-col gap-2">
            <label className="text-sm">Language Style</label>
            <Select value={languageStyle} onValueChange={(value) => setLanguageStyle(value as "plain" | "easyread")}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Please Select..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="plain">Plain English</SelectItem>
                <SelectItem value="easyread">Easy Read</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox checked={enableImages} onCheckedChange={(checked) => setEnableImages(!!checked)} />
            <label className="text-sm">Auto Generate Images</label>
          </div>
          <ImageGenerationOptions enabled={enableImages} />
        </div>
        {files.length > 1 && (
          <div className="text-muted-foreground flex flex-col items-center text-xs">
            <span>Note: You selected multiple files.</span>
            <span>The first file will be treated as the primary file,</span>
            <span> while the others provide additional context.</span>
          </div>
        )}
        <div className="flex flex-col gap-2">
          <label className="text-sm">Query</label>
          <Textarea
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Describe what you want to generate"
            className="min-h-36"
          />
        </div>
        <Button onClick={handleCreateDocument} disabled={isSubmitDisabled}>
          {isSubmitting ? "Processing..." : "Upload & Process"}
        </Button>
      </div>
    </main>
  );
}
