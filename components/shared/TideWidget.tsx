import { getTodayTides } from "@/lib/tides";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import Link from "next/link";

export async function TideWidget() {
  const tides = await getTodayTides();
  const today = format(new Date(), "MMM d, yyyy");

  return (
    <div className="px-4 py-4 max-w-sm">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center justify-between">
            <span>Tides · {today}</span>
            <Link
              href="https://wisuki.com/tide/41/zaafarana"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-normal text-muted-foreground hover:underline"
            >
              wisuki.com
            </Link>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {tides.length === 0 ? (
            <p className="text-xs text-muted-foreground">Tide data unavailable</p>
          ) : (
            <table className="w-full text-sm">
              <tbody>
                {tides.map((t, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="py-1.5 pr-3 w-6">
                      {t.type === "high" ? (
                        <span className="text-blue-500 font-bold">▲</span>
                      ) : (
                        <span className="text-amber-500 font-bold">▼</span>
                      )}
                    </td>
                    <td className="py-1.5 pr-3 font-mono font-semibold">
                      {t.time}
                    </td>
                    <td className="py-1.5 pr-3 text-muted-foreground">
                      {t.height}
                    </td>
                    <td className="py-1.5 text-right text-xs text-muted-foreground">
                      coeff {t.coefficient}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
