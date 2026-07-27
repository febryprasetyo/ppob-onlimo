/**
 * Inject style tag to set browser page orientation for printing.
 */
export const setPrintOrientation = (orientation: "landscape" | "portrait") => {
  if (typeof window === "undefined") return;
  const existing = document.getElementById("print-orientation");
  if (existing) existing.remove();

  const style = document.createElement("style");
  style.id = "print-orientation";
  style.innerHTML = `
    @media print {
      @page {
        size: A4 ${orientation} !important;
        margin: 10mm 10mm !important;
      }
    }
  `;
  document.head.appendChild(style);
};

/**
 * Configure dynamic document title during PDF save or print dialog,
 * and restore it after printing is complete.
 */
export const handlePrintWithTitle = (
  orientation: "landscape" | "portrait",
  printMode: "table" | "receipts",
  category: "PLN" | "Orbit",
  monthFilter: string,
  onPrintStart: () => void,
  onPrintEnd: () => void
) => {
  if (typeof window === "undefined") return;

  // Set page orientation style
  setPrintOrientation(orientation);
  onPrintStart();

  // Set dynamic document title for browser's default PDF naming
  const oldTitle = document.title;
  const filterMonthStr = monthFilter !== "all" ? monthFilter : "Semua-Bulan";
  const printTypeStr = printMode === "table" ? "Tabel-Laporan" : "Lampiran-Struk";
  document.title = `Laporan-${printTypeStr}-${category}-${filterMonthStr}`;

  // Restore state after print dialog is closed
  const handleAfterPrint = () => {
    document.title = oldTitle;
    onPrintEnd();
    window.removeEventListener("afterprint", handleAfterPrint);
  };
  window.addEventListener("afterprint", handleAfterPrint);

  // Trigger print dialog
  setTimeout(() => {
    window.print();
  }, 150);
};
