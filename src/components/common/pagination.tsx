import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

interface PaginationProps {
  page: number;
  hasNextPage: boolean;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, hasNextPage, onPageChange }: PaginationProps) {
  return (
    <nav className="relative flex h-10 items-center justify-center [&>*]:h-full">
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        className="hover:bg-accent relative flex items-center rounded-l-md border px-2 py-2 text-sm disabled:pointer-events-none disabled:opacity-50"
      >
        <ChevronLeftIcon />
      </button>
      <span className="bg-primary border-primary text-primary-foreground relative z-10 flex items-center border px-4 py-2 text-sm">
        {page}
      </span>
      <button
        type="button"
        disabled={!hasNextPage}
        onClick={() => onPageChange(page + 1)}
        className="hover:bg-accent relative flex items-center rounded-r-md border px-2 py-2 text-sm disabled:pointer-events-none disabled:opacity-50"
      >
        <ChevronRightIcon />
      </button>
    </nav>
  );
}
