"use client";

import {
  CheckIcon,
  CircleXIcon,
  CloudCheckIcon,
  EditIcon,
  LoaderCircleIcon,
  PlusIcon,
  RefreshCwIcon,
  ShareIcon,
  XIcon,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import React from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

import { ImageGenerationOptions } from "@/components/app/image-generation-options";
import { Doc, fetchDoc, updateDocTitle } from "@/lib/api/docs";
import { fetchImages } from "@/lib/api/images";
import { Section, fetchSections } from "@/lib/api/sections";
import { useFetchedState } from "@/lib/hooks/fetch";
import { cn, pickFile } from "@/lib/utils";

// implementation of this page is dirty.
// this page is only for ui demonstration purpose, may be refactored later.

function LibraryImagePickerDialog({ section, forceRerender }: { section: Section; forceRerender: () => void }) {
  const [images] = useFetchedState([], fetchImages, []);

  return (
    <Dialog>
      <Button asChild>
        <DialogTrigger>Browse Your Library</DialogTrigger>
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Library Browser</DialogTitle>
          <DialogDescription>Click on an image to use it in your document.</DialogDescription>
        </DialogHeader>
        <div className="@container -mx-4 -my-1 max-h-[62.5vh] overflow-y-auto px-4 py-1">
          <div className="grid grid-cols-3 gap-2 @md:grid-cols-4 @xl:grid-cols-5">
            {images.map((image, index) => (
              <div
                key={index}
                className={cn(
                  "ring-ring/50 aspect-[4/3] cursor-pointer overflow-hidden rounded transition-all",
                  image.url === section.image ? "ring-[3px]" : "hover:ring-[3px]",
                )}
                onClick={() => {
                  section.image = image.url;
                  forceRerender();
                }}
              >
                <img src={image.url} className="size-full object-cover"></img>
              </div>
            ))}
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button>
              <CheckIcon />
              Done
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SectionsEditor(
  doc_id: string,
  isProcessing: boolean,
  selectedSection: Section | null,
  setSelectedSection: React.Dispatch<React.SetStateAction<Section | null>>,
  sections: Section[],
  setSections: React.Dispatch<React.SetStateAction<Section[]>>,
) {
  return (
    <>
      {sections.map((section, index) => (
        <div key={index} className="flex gap-4">
          <div className="group relative aspect-[4/3] w-1/3 overflow-hidden rounded">
            <img src={section.image} className="size-full object-cover" />
            <button
              disabled={isProcessing}
              className="absolute inset-0 grid place-items-center bg-black/75 text-white transition-opacity not-group-hover:opacity-0"
              onClick={() => setSelectedSection(section)}
            >
              <span className="text-sm">Click to edit</span>
            </button>
          </div>
          <Textarea
            className="flex-1 resize-none"
            value={section.text}
            disabled={isProcessing}
            onChange={(e) => {
              const nextText = e.target.value;
              // Keep section content in local state; publish step can later persist it.
              setSections((prev) => {
                const copy = [...prev];
                const i = copy.findIndex((s) => s.id === section.id);
                if (i >= 0) copy[i].text = nextText;
                return copy;
              });
            }}
          />
        </div>
      ))}
      <Button
        disabled={isProcessing}
        onClick={() => {
          // Append locally first. Backend persistence should happen at the Publish step.
          const tempId =
            typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `temp-${Date.now()}`;
          setSections((prev) => [
            ...prev,
            {
              doc_id,
              id: tempId,
              order: prev.length,
              text: "",
              image: "https://placehold.co/600x400?text=Image",
              candidates: [],
            },
          ]);
        }}
      >
        <PlusIcon />
        <span>Add New Section</span>
      </Button>
    </>
  );
}

function ImageEditor({
  section,
  setSection,
  forceRerender,
}: {
  section: Section | null;
  setSection: React.Dispatch<React.SetStateAction<Section | null>>;
  forceRerender: () => void;
}) {
  if (!section) {
    return (
      <div className="grid size-full place-items-center max-md:p-4 md:p-8">
        <span className="text-muted-foreground text-sm">Please select an image to edit</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 max-md:p-4 md:p-8">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground text-xs uppercase">Selected Image</span>
          <button className="absolute top-4 right-4 md:hidden" onClick={() => setSection(null)}>
            <XIcon className="size-4" />
          </button>
        </div>
        <img src={section.image} className="aspect-[4/3] w-full rounded-lg object-cover" />
        <LibraryImagePickerDialog section={section} forceRerender={forceRerender} />
        <Button
          variant="outline"
          onClick={async () => {
            const file = await pickFile("image/*");
            if (!file) return;
            // mock change section image
            section.image = URL.createObjectURL(file);
            forceRerender();
          }}
        >
          Upload Your Own Image
        </Button>
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-muted-foreground text-xs uppercase">Generated Candidates</span>
        <div className="grid grid-cols-2 gap-2">
          {section.candidates.map((image) => (
            <div
              key={image}
              className="hover:ring-ring/50 aspect-[4/3] cursor-pointer overflow-hidden rounded-lg transition-all hover:ring-[3px]"
            >
              <img src={image} className="size-full object-cover" />
            </div>
          ))}
        </div>
        <ImageGenerationOptions />
        <Button className="my-1">
          <RefreshCwIcon />
          Regenerate Candidates
        </Button>
      </div>
    </div>
  );
}

function DocMetadataEdit({
  doc,
  isProcessing,
  setDoc,
}: {
  doc?: Doc;
  isProcessing: boolean;
  setDoc: React.Dispatch<React.SetStateAction<Doc | undefined>>;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [inputText, setInputText] = useState("");

  if (!doc) return <div></div>;

  if (!isEditing)
    return (
      <div className="flex items-center gap-4 overflow-hidden">
        <span className="truncate text-sm">{doc.title}</span>
        <button
          disabled={isProcessing}
          title="Edit Document Name"
          className="text-muted-foreground hover:text-primary"
          onClick={() => {
            setIsEditing(true);
            setInputText(doc.title);
          }}
        >
          <EditIcon className="size-4" />
        </button>
      </div>
    );

  return (
    <div className="flex items-center gap-2 max-md:absolute max-md:inset-0 max-md:z-11 max-md:bg-[inherit] max-md:p-[inherit]">
      <Input disabled={isProcessing} value={inputText} onChange={({ target: { value } }) => setInputText(value)} />
      <Button
        disabled={isProcessing}
        size="sm"
        onClick={async () => {
          try {
            await updateDocTitle(doc.id, inputText);
            setDoc(() => ({ ...doc, title: inputText }));
            setIsEditing(false);
          } catch {
            setIsEditing(false);
          }
        }}
      >
        Save
      </Button>
      <Button disabled={isProcessing} size="sm" variant="outline" onClick={() => setIsEditing(false)}>
        Cancel
      </Button>
    </div>
  );
}

export default function ({ params }: { params: Promise<{ id: string }> }) {
  const { id: doc_id } = React.use(params);
  const [doc, setDoc] = useFetchedState(undefined, fetchDoc, [doc_id]);
  const [sections, setSections] = useFetchedState([], fetchSections, [doc_id]);

  const [selectedSection, setSelectedSection] = useState<Section | null>(null);
  const [state, setState] = useState(0);

  const [_unused, _setUnused] = useState(0);
  const forceRerender = () => _setUnused((v) => v + 1);
  const isProcessing = doc?.status === "pending";

  useEffect(() => {
    const timer = setInterval(() => {
      fetchDoc(doc_id)
        .then((latest) => setDoc(latest))
        .catch(() => {});
    }, 3000);

    return () => clearInterval(timer);
  }, [doc_id, setDoc]);

  return (
    <main className="flex h-[var(--page-height)] flex-col">
      <div className="flex flex-1 overflow-hidden max-md:contents">
        <div className="flex-1 overflow-y-auto">
          <article className="flex flex-col gap-4 max-md:p-4 md:p-8">
            {isProcessing && (
              <div className="bg-muted text-muted-foreground rounded border px-4 py-2 text-sm">
                This document is still processing. Editing actions are temporarily disabled.
              </div>
            )}
            {SectionsEditor(doc_id, isProcessing, selectedSection, setSelectedSection, sections, setSections)}
          </article>
        </div>
        <div
          className={cn(
            "bg-background overflow-y-auto",
            "max-md:fixed max-md:top-[var(--header-height)] max-md:right-0 max-md:bottom-16 max-md:z-10",
            "md:w-3/8 md:border-l",
            "max-md:transition-[right]",
            !selectedSection ? "max-md:right-[-100vw]" : "",
          )}
        >
          <div className="w-screen md:contents">
            <ImageEditor section={selectedSection} setSection={setSelectedSection} forceRerender={forceRerender} />
          </div>
        </div>
      </div>
      <div className="bg-background sticky bottom-0 z-10 flex h-16 items-center border-t max-md:gap-4 max-md:px-4 md:gap-8 md:px-8">
        <DocMetadataEdit doc={doc} isProcessing={isProcessing} setDoc={setDoc} />
        <Tooltip>
          <TooltipTrigger className="ml-auto flex items-center gap-2 text-xs [&_svg]:size-4">
            {state % 3 === 0 ? (
              <div className="contents text-green-500">
                <CloudCheckIcon />
                <span className="max-md:hidden">Changes Saved</span>
              </div>
            ) : state % 3 === 1 ? (
              <div className="contents text-yellow-500">
                <LoaderCircleIcon className="animate-spin" />
                <span className="max-md:hidden">Saving Your Changes</span>
              </div>
            ) : (
              <div className="contents text-red-500">
                <CircleXIcon />
                <span className="max-md:hidden">Error</span>
              </div>
            )}
          </TooltipTrigger>
          <TooltipContent>
            {state % 3 === 0
              ? "Your changes has be automatically saved"
              : state % 3 === 1
                ? "Your changes is being saved"
                : "Error when saving your changes"}
          </TooltipContent>
        </Tooltip>
        <Button asChild disabled={isProcessing}>
          <Link
            href={isProcessing ? "#" : `/docs/${doc_id}/publish`}
            onClick={(e) => {
              if (isProcessing) e.preventDefault();
            }}
          >
            <ShareIcon />
            Publish
          </Link>
        </Button>
      </div>
    </main>
  );
}
