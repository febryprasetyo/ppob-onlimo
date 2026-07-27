import React from "react";

interface TrxData {
  ref_id: string;
  nama_stasiun: string;
  meter_number?: string;
  phone_number?: string;
  sku: string;
  price: number;
  status: string;
  token_sn?: string;
  created_at: string;
  provinsi?: string;
  kabupaten?: string;
  detail_lokasi?: string;
  keterangan?: string;
  asset_id: number;
}

interface ReportSummaryTableProps {
  filteredData: TrxData[];
  activeTab: "pln" | "orbit";
  reportMonthLabel: string;
  formatRupiah: (amount: number) => string;
  computeReceiptDetails: (trx: TrxData) => {
    totalBayar: number;
  };
}

export function ReportSummaryTable({
  filteredData,
  activeTab,
  reportMonthLabel,
  formatRupiah,
  computeReceiptDetails,
}: ReportSummaryTableProps) {
  return (
    <div className="report-page report-summary-page">
      <div style={{ textAlign: "center", marginBottom: "24px" }}>
        <h2 style={{ fontSize: "18px", fontWeight: 800, margin: 0, letterSpacing: "0.05em" }}>
          LAPORAN TRANSAKSI {activeTab === "pln" ? "LISTRIK PRABAYAR" : "PAKET DATA ORBIT"}
        </h2>
        <p style={{ fontSize: "13px", color: "#64748b", marginTop: "4px", fontWeight: 600 }}>
          Periode: {reportMonthLabel}
        </p>
      </div>

      <table className="report-summary-table">
        <thead>
          <tr>
            <th>No</th>
            <th>ID Stasiun</th>
            <th>Provinsi</th>
            <th>Kabupaten</th>
            <th>Lokasi Detail</th>
            <th>{activeTab === "pln" ? "ID Pelanggan" : "No HP Orbit"}</th>
            <th>Nominal (Rp)</th>
            <th>Keterangan</th>
          </tr>
        </thead>
        <tbody>
          {filteredData.map((trx, idx) => (
            <tr key={trx.ref_id}>
              <td style={{ textAlign: "center" }}>{idx + 1}</td>
              <td>{trx.nama_stasiun}</td>
              <td>{trx.provinsi || "-"}</td>
              <td>{trx.kabupaten || "-"}</td>
              <td>{trx.detail_lokasi || "-"}</td>
              <td>{trx.meter_number || trx.phone_number || "-"}</td>
              <td style={{ textAlign: "right" }}>
                {trx.price > 0 ? formatRupiah(computeReceiptDetails(trx).totalBayar) : "-"}
              </td>
              <td>{trx.keterangan || "-"}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={6} style={{ textAlign: "right", fontWeight: 800 }}>
              TOTAL
            </td>
            <td style={{ textAlign: "right", fontWeight: 800 }}>
              Rp{" "}
              {formatRupiah(
                filteredData.reduce(
                  (sum, t) => sum + (t.price > 0 ? computeReceiptDetails(t).totalBayar : 0),
                  0
                )
              )}
            </td>
            <td></td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
