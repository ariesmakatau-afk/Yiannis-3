"use client";

import { useEffect, useMemo, useState } from "react";
import {
  describeMeats,
  extraById,
  formatMoney,
  meats,
  SAUCE_PRICE,
  sauceCost,
  sauces,
  type ExtraId,
  type MeatId,
  type Product,
} from "@/lib/menu";
export type ConfiguredLine = {
  /** Stable key describing this exact configuration, so identical builds stack. */
  key: string;
  productId: string;
  name: string;
  detail: string;
  unitPrice: number;
  quantity: number;
};

type Props = {
  product: Product;
  onClose: () => void;
  onAdd: (line: ConfiguredLine) => void;
};

export default function ProductCustomiser({ product, onClose, onAdd }: Props) {
  const [sizeId, setSizeId] = useState(product.sizes[0].id);
  const [selectedMeats, setSelectedMeats] = useState<MeatId[]>([]);
  const [selectedExtras, setSelectedExtras] = useState<ExtraId[]>([]);
  const [variantChoice, setVariantChoice] = useState(
    product.variant ? product.variant.options[0] : ""
  );
  const [selectedSauces, setSelectedSauces] = useState<string[]>([]);
  const [quantity, setQuantity] = useState(1);

  // Close on Escape.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const size = product.sizes.find((s) => s.id === sizeId) ?? product.sizes[0];
  const availableExtras = product.allowedExtras.map((id) => extraById.get(id)!).filter(Boolean);

  const unitPrice = useMemo(() => {
    let total = size.price;
    // Lamb premium is per-size, not flat across the menu.
    if (selectedMeats.includes("lamb")) total += size.lambSurcharge ?? 0;
    for (const id of selectedExtras) {
      total += extraById.get(id)?.price ?? 0;
    }
    if (product.freeSauces !== undefined) {
      total += sauceCost(selectedSauces.length, product.freeSauces);
    }
    return total;
  }, [
    size.price,
    size.lambSurcharge,
    selectedMeats,
    selectedExtras,
    selectedSauces,
    product.freeSauces,
  ]);

  const meatMissing = product.meatChoice && selectedMeats.length === 0;

  function toggleMeat(id: MeatId) {
    setSelectedMeats((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  }

  function toggleSauce(name: string) {
    setSelectedSauces((prev) =>
      prev.includes(name) ? prev.filter((s) => s !== name) : [...prev, name]
    );
  }

  function toggleExtra(id: ExtraId) {
    setSelectedExtras((prev) =>
      prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id]
    );
  }

  function handleAdd() {
    if (meatMissing) return;

    const parts: string[] = [];
    if (product.sizes.length > 1) parts.push(size.name);
    if (variantChoice) parts.push(variantChoice);
    if (selectedMeats.length) parts.push(describeMeats(selectedMeats));
    if (selectedSauces.length) parts.push(`Sauce: ${selectedSauces.join(", ")}`);
    if (selectedExtras.length) {
      parts.push(
        `+ ${selectedExtras.map((id) => extraById.get(id)?.name ?? id).join(", ")}`
      );
    }

    onAdd({
      key: [
        product.id,
        sizeId,
        variantChoice,
        [...selectedMeats].sort().join("-"),
        [...selectedSauces].sort().join("-"),
        [...selectedExtras].sort().join("-"),
      ]
        .filter(Boolean)
        .join("|"),
      productId: product.id,
      name: product.name,
      detail: parts.join(" · "),
      unitPrice,
      quantity,
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-cobalt-dark/50 p-0 backdrop-blur-sm sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={`Customise ${product.name}`}
      onClick={onClose}
    >
      <div
        className="customiser-sheet max-h-[92vh] w-full max-w-lg overflow-y-auto bg-white shadow-2xl sm:rounded-sm"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-cobalt/10 bg-white px-5 py-4 sm:px-6">
          <div>
            <p className="font-display text-xl font-semibold text-cobalt-dark">{product.name}</p>
            {product.description && (
              <p className="mt-0.5 text-sm text-ink/60">{product.description}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-mr-1 -mt-1 shrink-0 rounded-full p-2 text-ink/40 transition-colors hover:bg-ink/5 hover:text-ink"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
              <path
                d="M4 4l10 10M14 4L4 14"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        <div className="space-y-7 px-5 py-6 sm:px-6">
          {/* Size */}
          {product.sizes.length > 1 && (
            <fieldset>
              <legend className="text-xs font-semibold uppercase tracking-wide text-ink/50">
                Size
              </legend>
              <div className="mt-3 flex flex-wrap gap-2">
                {product.sizes.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    aria-pressed={s.id === sizeId}
                    onClick={() => setSizeId(s.id)}
                    className={`chip-option ${s.id === sizeId ? "chip-option--on" : ""}`}
                  >
                    {s.name}
                    <span className="ml-1.5 opacity-60">{formatMoney(s.price)}</span>
                  </button>
                ))}
              </div>
            </fieldset>
          )}

          {/* Variant (drinks) */}
          {product.variant && (
            <fieldset>
              <legend className="text-xs font-semibold uppercase tracking-wide text-ink/50">
                {product.variant.label}
              </legend>
              <div className="mt-3 flex flex-wrap gap-2">
                {product.variant.options.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    aria-pressed={opt === variantChoice}
                    onClick={() => setVariantChoice(opt)}
                    className={`chip-option ${opt === variantChoice ? "chip-option--on" : ""}`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </fieldset>
          )}

          {/* Meat */}
          {product.meatChoice && (
            <fieldset>
              <legend className="text-xs font-semibold uppercase tracking-wide text-ink/50">
                Meat
              </legend>
              <p className="mt-1 text-sm text-ink/55">
                Pick one — or tap two or three for a mix.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {meats.map((meat) => {
                  const premium = meat.id === "lamb" ? size.lambSurcharge ?? 0 : 0;
                  return (
                    <button
                      key={meat.id}
                      type="button"
                      aria-pressed={selectedMeats.includes(meat.id)}
                      onClick={() => toggleMeat(meat.id)}
                      className={`chip-option ${
                        selectedMeats.includes(meat.id) ? "chip-option--on" : ""
                      }`}
                    >
                      {meat.name}
                      {premium > 0 && (
                        <span className="ml-1.5 opacity-60">+{formatMoney(premium)}</span>
                      )}
                    </button>
                  );
                })}
              </div>
              {selectedMeats.length > 1 && (
                <p className="mt-2.5 text-sm font-medium text-cobalt">
                  {describeMeats(selectedMeats)}
                </p>
              )}
            </fieldset>
          )}

          {/* Sauces — free up to the item's allowance, then 50c each */}
          {product.freeSauces !== undefined && (
            <fieldset>
              <legend className="text-xs font-semibold uppercase tracking-wide text-ink/50">
                Sauces
              </legend>
              <p className="mt-1 text-sm text-ink/55">
                {product.freeSauces} included. Extras are{" "}
                {formatMoney(SAUCE_PRICE)} each.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {sauces.map((sauce) => {
                  const on = selectedSauces.includes(sauce);
                  // Is this pick already past the free allowance?
                  const chargedFrom = product.freeSauces ?? 0;
                  const payable = on && selectedSauces.indexOf(sauce) >= chargedFrom;
                  return (
                    <button
                      key={sauce}
                      type="button"
                      aria-pressed={on}
                      onClick={() => toggleSauce(sauce)}
                      className={`chip-option ${on ? "chip-option--on" : ""}`}
                    >
                      {sauce}
                      {payable && (
                        <span className="ml-1.5 opacity-70">+{formatMoney(SAUCE_PRICE)}</span>
                      )}
                    </button>
                  );
                })}
              </div>
              {selectedSauces.length > product.freeSauces && (
                <p className="mt-2.5 text-sm font-medium text-cobalt">
                  {selectedSauces.length} sauces —{" "}
                  {selectedSauces.length - product.freeSauces} over the included{" "}
                  {product.freeSauces}, so{" "}
                  {formatMoney(sauceCost(selectedSauces.length, product.freeSauces))} extra.
                </p>
              )}
            </fieldset>
          )}

          {/* Extras */}
          {availableExtras.length > 0 && (
            <fieldset>
              <legend className="text-xs font-semibold uppercase tracking-wide text-ink/50">
                Add extras
              </legend>
              <div className="mt-3 space-y-1">
                {availableExtras.map((extra) => {
                  const on = selectedExtras.includes(extra.id);
                  return (
                    <button
                      key={extra.id}
                      type="button"
                      aria-pressed={on}
                      onClick={() => toggleExtra(extra.id)}
                      className="flex w-full items-center justify-between gap-3 rounded-sm border border-transparent px-3 py-2.5 text-left transition-colors hover:bg-cobalt/[0.04]"
                    >
                      <span className="flex items-center gap-3">
                        <span
                          aria-hidden="true"
                          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-sm border transition-colors ${
                            on ? "border-cobalt bg-cobalt text-white" : "border-ink/25"
                          }`}
                        >
                          {on && (
                            <svg width="12" height="12" viewBox="0 0 12 12">
                              <path
                                d="M2.5 6.5l2.5 2.5 4.5-5.5"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          )}
                        </span>
                        <span className="text-sm font-medium">{extra.name}</span>
                      </span>
                      <span className="shrink-0 text-sm text-ink/50">
                        +{formatMoney(extra.price)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </fieldset>
          )}

          {product.note && <p className="text-sm text-ink/50">{product.note}</p>}

          {/* Quantity */}
          <fieldset>
            <legend className="text-xs font-semibold uppercase tracking-wide text-ink/50">
              How many?
            </legend>
            <div className="mt-3 flex items-center gap-4">
              <button
                type="button"
                aria-label="Decrease quantity"
                disabled={quantity <= 1}
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="qty-btn disabled:opacity-30"
              >
                −
              </button>
              <span
                aria-live="polite"
                className="w-10 text-center font-display text-2xl font-semibold text-cobalt-dark"
              >
                {quantity}
              </span>
              <button
                type="button"
                aria-label="Increase quantity"
                onClick={() => setQuantity((q) => Math.min(20, q + 1))}
                className="qty-btn"
              >
                +
              </button>
            </div>
          </fieldset>
        </div>

        {/* Footer / add */}
        <div className="sticky bottom-0 border-t border-cobalt/10 bg-white px-5 py-4 sm:px-6">
          {meatMissing && (
            <p className="mb-3 text-sm font-medium text-amber-700">
              Pick at least one meat to continue.
            </p>
          )}
          <button
            type="button"
            onClick={handleAdd}
            disabled={meatMissing}
            className="btn-coal w-full disabled:cursor-not-allowed disabled:opacity-40"
          >
            Add to order · {formatMoney(unitPrice * quantity)}
          </button>
        </div>
      </div>
    </div>
  );
}
