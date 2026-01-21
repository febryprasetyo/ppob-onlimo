export const getPriceList = async () => {
  try {
    const res = await fetch(`/api/digiflazz/price-list`);
    const json = await res.json();
    return json;
  } catch (err) {
    console.error("Fetch price list error:", err);
    return { success: false, message: "Terjadi kesalahan koneksi ke server" };
  }
};

export const syncPriceList = async () => {
  try {
    const res = await fetch(`/api/digiflazz/price-list`, {
      method: "POST"
    });
    const json = await res.json();
    return json;
  } catch (err) {
    console.error("Sync price list error:", err);
    return { success: false, message: "Terjadi kesalahan koneksi ke server" };
  }
};
