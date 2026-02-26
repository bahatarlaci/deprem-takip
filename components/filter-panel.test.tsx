import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { createDefaultFilters } from "@/hooks/use-earthquakes";

import { FilterPanel } from "./filter-panel";

describe("FilterPanel", () => {
  it("alan değişikliğinde filtre state callback'ini çağırır", () => {
    const onFiltersChange = vi.fn();

    render(
      <FilterPanel
        filters={createDefaultFilters()}
        isLoading={false}
        radialOverridesBounding={false}
        onFiltersChange={onFiltersChange}
        onApply={vi.fn()}
        onReset={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByLabelText("Min Büyüklük"), {
      target: { value: "4.1" },
    });

    expect(onFiltersChange).toHaveBeenCalled();
    const changedFilters = onFiltersChange.mock.calls[0][0];
    expect(changedFilters.minmag).toBe("4.1");
  });

  it("uygula butonu submit akışını tetikler", () => {
    const onApply = vi.fn();

    render(
      <FilterPanel
        filters={createDefaultFilters()}
        isLoading={false}
        radialOverridesBounding={false}
        onFiltersChange={vi.fn()}
        onApply={onApply}
        onReset={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Uygula" }));

    expect(onApply).toHaveBeenCalledTimes(1);
  });
});
