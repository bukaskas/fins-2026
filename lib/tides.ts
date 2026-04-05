export type TideEntry = {
  time: string;
  height: string;
  type: "high" | "low";
  coefficient: number;
};

export async function getTodayTides(): Promise<TideEntry[]> {
  try {
    const res = await fetch("https://wisuki.com/tide/41/zaafarana", {
      next: { revalidate: 21600 }, // cache 6 hours
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
      },
    });

    if (!res.ok) return [];

    const html = await res.text();

    // Format today as DD/MM/YYYY to match the page's date format
    const now = new Date();
    const dd = String(now.getUTCDate()).padStart(2, "0");
    const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
    const yyyy = now.getUTCFullYear();
    const todayStr = `${dd}/${mm}/${yyyy}`;

    // Today's row has <strong> around the date link; other rows don't
    // Extract the full <tr> that contains today's date inside <strong>
    const rowRegex = /<tr>\s*<td[^>]*>\s*<strong>[\s\S]*?<\/strong>[\s\S]*?<\/tr>/g;
    const rows = html.match(rowRegex) ?? [];

    const todayRow = rows.find((row) => row.includes(todayStr));
    if (!todayRow) return [];

    // Extract all <td> elements, then keep only tide cells (they contain ▲/▼ triangles)
    const allTds = todayRow.match(/<td[^>]*>([\s\S]*?)<\/td>/g) ?? [];
    const tideCells = allTds
      .filter((td) => td.includes("&#x25B2;") || td.includes("&#x25BC"))
      .slice(0, 4);

    return tideCells.map((cell): TideEntry => {
      const isHigh = cell.includes("&#x25B2;");
      const timeMatch = cell.match(/<strong>(\d{2}:\d{2})<\/strong>/);
      const heightMatch = cell.match(/<span>([\d.]+m)<\/span>/);
      const coeffMatch = cell.match(/<span style="color:[^"]*">(\d+)<\/span>/);

      return {
        type: isHigh ? "high" : "low",
        time: timeMatch?.[1] ?? "—",
        height: heightMatch?.[1] ?? "—",
        coefficient: coeffMatch ? parseInt(coeffMatch[1], 10) : 0,
      };
    });
  } catch {
    return [];
  }
}
