import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import TrashBinPanel from "./TrashBinPanel";
import { getTrashItems, moveToTrash } from "@/lib/trashBin";

describe("لوحة سلة المحذوفات", () => {
  afterEach(() => {
    cleanup();
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("تعرض العنصر وتستعيده بعد الضغط على استعادة", async () => {
    const item = moveToTrash({ entityType: "staff", entityLabel: "الحارس محمد", payload: { id: "staff-1", name: "محمد" } });
    const onChange = vi.fn();
    const onRestore = vi.fn().mockResolvedValue(true);

    render(<TrashBinPanel items={[item]} onChange={onChange} onRestore={onRestore} />);
    expect(screen.getByText("الحارس محمد")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "استعادة" }));

    await waitFor(() => expect(onRestore).toHaveBeenCalledWith(expect.objectContaining({ id: item.id })));
    await waitFor(() => expect(onChange).toHaveBeenCalled());
    expect(getTrashItems()).toEqual([]);
  });

  it("تطلب تأكيداً قبل الحذف النهائي ثم تحذف السجل", () => {
    const item = moveToTrash({ entityType: "entry", entityLabel: "مصروف: أعلاف", payload: { id: "entry-1" } });
    vi.spyOn(window, "confirm").mockReturnValue(true);
    const onChange = vi.fn();

    render(<TrashBinPanel items={[item]} onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: "حذف نهائي" }));

    expect(window.confirm).toHaveBeenCalledWith(expect.stringContaining("لا يمكن التراجع"));
    expect(getTrashItems()).toEqual([]);
    expect(onChange).toHaveBeenCalled();
  });
});

export {};
