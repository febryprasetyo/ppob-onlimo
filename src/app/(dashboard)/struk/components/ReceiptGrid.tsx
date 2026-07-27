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
  asset_id: number;
}

interface ReceiptGridProps {
  filteredData: TrxData[];
  activeTab: "pln" | "orbit";
  reportMonthLabel: string;
  formatRupiah: (amount: number) => string;
  computeReceiptDetails: (trx: TrxData) => {
    idLabel: string;
    idValue: string;
    customerName: string;
    segmentPower: string;
    rpToken: number;
    kwh: string;
    tokenCode: string;
    adminFee: number;
    totalBayar: number;
  };
  voucherNameMap: (sku: string) => string;
}

export function ReceiptGrid({
  filteredData,
  activeTab,
  reportMonthLabel,
  formatRupiah,
  computeReceiptDetails,
  voucherNameMap,
}: ReceiptGridProps) {
  // Sort the receipt grid data by nama_stasiun ascending and filter out placeholders
  const sortedData = [...filteredData]
    .filter((trx) => !trx.ref_id.startsWith("placeholder-"))
    .sort((a, b) => a.nama_stasiun.localeCompare(b.nama_stasiun));

  const chunkSize = activeTab === "orbit" ? 12 : 6;
  const gridClass =
    activeTab === "orbit"
      ? "receipt-grid receipt-grid-4row"
      : "receipt-grid receipt-grid-2row";

  const pages: TrxData[][] = [];
  for (let i = 0; i < sortedData.length; i += chunkSize) {
    pages.push(sortedData.slice(i, i + chunkSize));
  }

  return (
    <>
      {pages.map((pageItems, pageIdx) => (
        <div key={pageIdx} className="report-page report-receipts-page">
          {/* Header repeated on every page */}
          <div className="receipt-page-header">
            <div style={{ fontWeight: 800, fontSize: "14px", letterSpacing: "0.05em" }}>
              STRUK PEMBELIAN {activeTab === "pln" ? "LISTRIK PRABAYAR" : "PULSA / PAKET DATA"}
            </div>
            <div style={{ fontSize: "11px", marginTop: "2px", fontWeight: 600 }}>
              Periode: {reportMonthLabel} &bull; Page {pageIdx + 1} of {pages.length}
            </div>
          </div>

          <div className={gridClass}>
            {pageItems.map((trx) => {
              const rd = computeReceiptDetails(trx);
              const voucherName = voucherNameMap(trx.sku);
              return (
                <div key={trx.ref_id} className="receipt-grid-item">
                  <div className="receipt-card">
                    <div style={{ textAlign: "center", marginBottom: "8px" }}>
                      <div style={{ fontWeight: 700, fontSize: "11px" }}>
                        ** Ebiznet Multipayment **
                      </div>
                      <div style={{ fontSize: "10px", marginTop: "2px" }}>
                        {new Date(trx.created_at)
                          .toLocaleString("id-ID", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                          })
                          .replace(/\./g, ":")
                          .replace(", ", " ")}
                      </div>
                      <div style={{ fontSize: "10px", marginTop: "4px", fontWeight: 600 }}>
                        {activeTab === "pln"
                          ? "STRUK PEMBELIAN LISTRIK PRABAYAR"
                          : "STRUK PEMBELIAN PULSA / PAKET DATA"}
                      </div>
                    </div>

                    <div className="receipt-info">
                      {activeTab === "pln" && (
                        <div className="receipt-row">
                          <span className="receipt-label">NO METER</span>
                          <span>:</span>
                          <span className="receipt-value">{trx.meter_number || "-"}</span>
                        </div>
                      )}
                      <div className="receipt-row">
                        <span className="receipt-label">{rd.idLabel}</span>
                        <span>:</span>
                        <span className="receipt-value">{rd.idValue}</span>
                      </div>
                      {activeTab === "pln" && (
                        <>
                          <div className="receipt-row">
                            <span className="receipt-label">NAMA</span>
                            <span>:</span>
                            <span className="receipt-value">{rd.customerName}</span>
                          </div>
                          <div className="receipt-row">
                            <span className="receipt-label">TARIF/DAYA</span>
                            <span>:</span>
                            <span className="receipt-value">{rd.segmentPower}</span>
                          </div>
                        </>
                      )}
                      {activeTab === "orbit" && (
                        <div className="receipt-row">
                          <span className="receipt-label">VOUCHER</span>
                          <span>:</span>
                          <span className="receipt-value">{voucherName}</span>
                        </div>
                      )}
                      <div className="receipt-row">
                        <span className="receipt-label">NO REF</span>
                        <span>:</span>
                        <span
                          className="receipt-value"
                          style={{ fontSize: "8px", wordBreak: "break-all" }}
                        >
                          {trx.ref_id}
                        </span>
                      </div>
                      {activeTab === "orbit" && (
                        <div className="receipt-row">
                          <span className="receipt-label">STATUS</span>
                          <span>:</span>
                          <span className="receipt-value">
                            {trx.status === "SUCCESS" ? "BERHASIL" : trx.status}
                          </span>
                        </div>
                      )}
                    </div>

                    {activeTab === "pln" && (
                      <div className="receipt-info" style={{ marginTop: "6px" }}>
                        <div className="receipt-row">
                          <span className="receipt-label">METERAI</span>
                          <span>:</span>
                          <span>Rp</span>
                          <span className="receipt-amount">0</span>
                        </div>
                        <div className="receipt-row">
                          <span className="receipt-label">PPN</span>
                          <span>:</span>
                          <span>Rp</span>
                          <span className="receipt-amount">0</span>
                        </div>
                        <div className="receipt-row">
                          <span className="receipt-label">PBJT-TL</span>
                          <span>:</span>
                          <span>Rp</span>
                          <span className="receipt-amount">0</span>
                        </div>
                        <div className="receipt-row">
                          <span className="receipt-label">ANGSURAN</span>
                          <span>:</span>
                          <span>Rp</span>
                          <span className="receipt-amount">0</span>
                        </div>
                        <div className="receipt-row">
                          <span className="receipt-label">RP TOKEN</span>
                          <span>:</span>
                          <span>Rp</span>
                          <span className="receipt-amount">{formatRupiah(rd.rpToken)}</span>
                        </div>
                        <div className="receipt-row">
                          <span className="receipt-label">JUMLAH KWH</span>
                          <span>:</span>
                          <span>{rd.kwh !== "-" ? `${rd.kwh} kWh` : "-"}</span>
                        </div>
                        <div style={{ marginTop: "6px" }}>
                          <div style={{ fontSize: "9px" }}>STROOM/TOKEN :</div>
                          <div
                            style={{
                              fontWeight: 700,
                              fontSize: "10px",
                              textAlign: "center",
                              marginTop: "4px",
                              letterSpacing: "0.15em",
                              wordBreak: "break-all",
                            }}
                          >
                            {rd.tokenCode.replace(/(.{4})/g, "$1 ").trim()}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Spacer pushes footer to bottom so all cards in a row are equal height */}
                    <div style={{ flex: 1 }} />

                    <div className="receipt-info" style={{ marginTop: "6px" }}>
                      <div className="receipt-row">
                        <span className="receipt-label">ADMIN BANK</span>
                        <span>:</span>
                        <span>Rp</span>
                        <span className="receipt-amount">{formatRupiah(rd.adminFee)}</span>
                      </div>
                      <div className="receipt-row" style={{ fontWeight: 700 }}>
                        <span className="receipt-label">TOTAL BAYAR</span>
                        <span>:</span>
                        <span>Rp</span>
                        <span className="receipt-amount">{formatRupiah(rd.totalBayar)}</span>
                      </div>
                    </div>

                    <div
                      style={{
                        textAlign: "center",
                        marginTop: "10px",
                        fontSize: "9px",
                        lineHeight: "1.4",
                      }}
                    >
                      <div>TERIMA KASIH</div>
                      {activeTab === "pln" && (
                        <>
                          <div>Informasi Hubungi Call Center</div>
                          <div>123 Atau hubungi PLN Terdekat</div>
                          <div>Download PLN Mobile</div>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="receipt-station-label">{trx.nama_stasiun}</div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </>
  );
}
