import { BarChart, HorizontalBar } from "@shared/components/Charts";
import { formatCompactCurrency } from "@shared/utils/currency";

interface SalesByWeekday {
  weekday: string;
  revenue: number;
}

interface SalesByHour {
  hour: string;
  revenue: number;
}

interface SalesByCategory {
  category: string;
  revenue: number;
  sharePct: number;
}

interface ChartsSectionProps {
  salesByWeekday: SalesByWeekday[];
  salesByHour: SalesByHour[];
  salesByCategory: SalesByCategory[];
  currency: string;
}

export default function ChartsSection({
  salesByWeekday,
  salesByHour,
  salesByCategory,
  currency,
}: ChartsSectionProps) {
  return (
    <section className="lg:col-span-12">
      <h2 className="mb-3 section-kicker">Visualizaciones</h2>
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Weekday */}
        <div className="app-panel rounded-[28px] p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-widest text-default-500">
              Ventas por Día
            </h3>
          </div>
          <BarChart
            data={salesByWeekday.map((d) => ({
              label: d.weekday.slice(0, 3),
              value: d.revenue,
            }))}
            height={120}
            color="#8b5cf6"
            formatValue={(v) => formatCompactCurrency(v, currency)}
          />
        </div>

        {/* Hour */}
        <div className="app-panel rounded-[28px] p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-widest text-default-500">
              Ventas por Hora
            </h3>
          </div>
          <BarChart
            data={salesByHour.map((d) => ({
              label: `${d.hour}h`,
              value: d.revenue,
            }))}
            height={120}
            color="#f59e0b"
            formatValue={(v) => formatCompactCurrency(v, currency)}
          />
        </div>

        {/* Category */}
        <div className="app-panel rounded-[28px] p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-widest text-default-500">
              Categorías
            </h3>
          </div>
          <div className="space-y-2">
            {salesByCategory.slice(0, 5).map((cat) => (
              <HorizontalBar
                key={cat.category}
                label={cat.category}
                value={cat.revenue}
                max={salesByCategory[0]?.revenue || 1}
                color="#10b981"
                formatValue={(v) => formatCompactCurrency(v, currency)}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
