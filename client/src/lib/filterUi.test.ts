import { describe, expect, it } from "vitest";
import { buildWhatsAppUrl, normalizeEgyptianWhatsAppPhone } from "./filterUi";

describe("WhatsApp phone normalization", () => {
  it("converts an Egyptian local mobile number to country-code format", () => {
    expect(normalizeEgyptianWhatsAppPhone("010 087 97774")).toBe("201008797774");
  });

  it("does not duplicate the country code when +20 or 20 is provided", () => {
    expect(normalizeEgyptianWhatsAppPhone("+20 100 879 7774")).toBe("201008797774");
    expect(normalizeEgyptianWhatsAppPhone("201008797774")).toBe("201008797774");
  });

  it("builds a clean wa.me link", () => {
    expect(buildWhatsAppUrl("010-087-97774", "مرحبًا")).toBe(
      "https://wa.me/201008797774?text=%D9%85%D8%B1%D8%AD%D8%A8%D9%8B%D8%A7",
    );
  });
});
