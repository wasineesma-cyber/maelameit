import { describe, expect, it } from "vitest";
import { parseLineMessage, formatCurrency } from "./lineParser";

describe("parseLineMessage", () => {
  it("parses single expense", () => {
    const result = parseLineMessage("ข้าว 80");
    expect(result.transactions).toBeDefined();
    expect(result.transactions).toHaveLength(1);
    expect(result.transactions![0].type).toBe("expense");
    expect(result.transactions![0].amount).toBe(80);
    expect(result.transactions![0].description).toContain("ข้าว");
  });

  it("parses multiple expenses in one line", () => {
    const result = parseLineMessage("ข้าว 80 grab 120");
    expect(result.transactions).toBeDefined();
    expect(result.transactions).toHaveLength(2);
    expect(result.transactions![0].amount).toBe(80);
    expect(result.transactions![1].amount).toBe(120);
  });

  it("parses income with keyword รับ", () => {
    const result = parseLineMessage("รับ 5000");
    expect(result.transactions).toBeDefined();
    expect(result.transactions![0].type).toBe("income");
    expect(result.transactions![0].amount).toBe(5000);
  });

  it("parses income with เงินเดือน keyword", () => {
    const result = parseLineMessage("เงินเดือน 25000");
    expect(result.transactions).toBeDefined();
    expect(result.transactions![0].type).toBe("income");
  });

  it("recognizes summary command", () => {
    const result = parseLineMessage("สรุป");
    expect(result.command).toBe("summary");
  });

  it("recognizes delete command", () => {
    const result = parseLineMessage("ลบ 5");
    expect(result.command).toBe("delete");
    expect(result.deleteId).toBe(5);
  });

  it("recognizes help command", () => {
    const result = parseLineMessage("ช่วยเหลือ");
    expect(result.command).toBe("help");
  });

  it("returns no transactions for unrecognized input", () => {
    const result = parseLineMessage("สวัสดี");
    expect(result.transactions).toBeUndefined();
    expect(result.command).toBeUndefined();
  });
});

describe("formatCurrency", () => {
  it("formats whole numbers", () => {
    expect(formatCurrency(1000)).toBe("1,000");
  });

  it("formats decimals - returns numeric value close to input", () => {
    const result = formatCurrency(99.5);
    expect(parseFloat(result.replace(/,/g, ""))).toBeCloseTo(99.5);
  });

  it("formats zero", () => {
    expect(formatCurrency(0)).toBe("0");
  });
});
