/**
 * Unit tests for UploadDropzone component
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { UploadDropzone } from "@/components/documents/upload-dropzone";

describe("UploadDropzone", () => {
  it("renders drop zone when no file selected", () => {
    render(<UploadDropzone selectedFile={null} onFileSelect={vi.fn()} onClear={vi.fn()} />);

    expect(screen.getByText(/Drop your PDF here/i)).toBeInTheDocument();
    expect(screen.getByText(/PDF files only/i)).toBeInTheDocument();
  });

  it("shows selected file info when file is selected", () => {
    const file = new File(["test content"], "document.pdf", {
      type: "application/pdf",
    });
    Object.defineProperty(file, "size", { value: 1024 * 5 }); // 5KB

    render(<UploadDropzone selectedFile={file} onFileSelect={vi.fn()} onClear={vi.fn()} />);

    expect(screen.getByText("document.pdf")).toBeInTheDocument();
    expect(screen.getByText("5.0 KB")).toBeInTheDocument();
  });

  it("calls onClear when clear button clicked", () => {
    const onClear = vi.fn();
    const file = new File(["test"], "test.pdf", { type: "application/pdf" });

    render(<UploadDropzone selectedFile={file} onFileSelect={vi.fn()} onClear={onClear} />);

    const clearButton = screen.getByRole("button");
    fireEvent.click(clearButton);

    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it("shows error for file too large", () => {
    const onFileSelect = vi.fn();
    const { container } = render(
      <UploadDropzone
        selectedFile={null}
        onFileSelect={onFileSelect}
        onClear={vi.fn()}
        maxSize={1024} // 1KB limit
      />
    );

    const file = new File(["x".repeat(2048)], "large.pdf", {
      type: "application/pdf",
    });
    Object.defineProperty(file, "size", { value: 2048 });

    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    Object.defineProperty(input, "files", { value: [file] });
    fireEvent.change(input);

    expect(screen.getByText(/File too large/i)).toBeInTheDocument();
    expect(onFileSelect).not.toHaveBeenCalled();
  });

  it("shows error for invalid file type", () => {
    const onFileSelect = vi.fn();
    const { container } = render(
      <UploadDropzone
        selectedFile={null}
        onFileSelect={onFileSelect}
        onClear={vi.fn()}
        accept=".pdf"
      />
    );

    const file = new File(["test"], "document.txt", { type: "text/plain" });
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    Object.defineProperty(input, "files", { value: [file] });
    fireEvent.change(input);

    expect(screen.getByText(/Invalid file type/i)).toBeInTheDocument();
    expect(onFileSelect).not.toHaveBeenCalled();
  });

  it("calls onFileSelect for valid file", () => {
    const onFileSelect = vi.fn();
    const { container } = render(
      <UploadDropzone selectedFile={null} onFileSelect={onFileSelect} onClear={vi.fn()} />
    );

    const file = new File(["test"], "document.pdf", { type: "application/pdf" });
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    Object.defineProperty(input, "files", { value: [file] });
    fireEvent.change(input);

    expect(onFileSelect).toHaveBeenCalledWith(file);
  });

  it("is disabled when disabled prop is true", () => {
    const { container } = render(
      <UploadDropzone selectedFile={null} onFileSelect={vi.fn()} onClear={vi.fn()} disabled />
    );

    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    expect(input).toBeDisabled();
    expect(container.firstChild).toHaveClass("opacity-50");
  });
});
