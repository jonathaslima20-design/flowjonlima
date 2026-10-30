// Preço de um pagamento, sempre calculado no banco (nunca vem do navegador):
// - plano para a própria conta: checkout_price (desconto do parceiro no 1º pagamento, por cupom ou atribuição)
// - licenças no atacado (parceiro ativo): license_price
// Devolve também os campos gravados em `payments`.

const PAID_PLANS = ["pro", "business"];
const PERIOD_LABELS: Record<string, string> = { quarterly: "Trimestral", annual: "Anual" };

export type Priced = {
  amount: number;
  description: string;
  itemId: string;
  quantity: number;
  row: Record<string, unknown>;
};

// deno-lint-ignore no-explicit-any
export async function priceFor(admin: any, userId: string, body: any): Promise<{ priced?: Priced; error?: string }> {
  const plan = String(body?.plan ?? "");
  const period = String(body?.period ?? "");
  if (!PAID_PLANS.includes(plan)) return { error: "Plano inválido." };
  if (!PERIOD_LABELS[period]) return { error: "Período inválido." };

  const { data: planRow } = await admin.from("plans").select("name").eq("slug", plan).maybeSingle();
  const name = planRow?.name ?? plan;

  if (body?.kind === "license") {
    const qty = Math.floor(Number(body?.qty) || 0);
    const { data, error } = await admin.rpc("license_price", { p_profile_id: userId, p_plan: plan, p_period: period, p_qty: qty });
    if (error || !data) return { error: "Não foi possível calcular o preço." };
    if (data.error) return { error: data.error };
    return {
      priced: {
        amount: data.amount_cents,
        description: `BioFlowzy ${name} ${PERIOD_LABELS[period]} · ${qty} licenças`,
        itemId: `license_${plan}_${period}`,
        quantity: qty,
        row: {
          plan_slug: plan, period, amount_cents: data.amount_cents, kind: "license", quantity: qty,
          list_cents: data.list_cents, discount_cents: data.discount_cents, partner_id: data.partner_id,
        },
      },
    };
  }

  const coupon = typeof body?.coupon === "string" ? body.coupon.slice(0, 40) : null;
  const { data, error } = await admin.rpc("checkout_price", { p_profile_id: userId, p_plan: plan, p_period: period, p_coupon: coupon });
  if (error || !data) return { error: "Não foi possível calcular o preço." };
  if (data.error) return { error: data.error };
  // Cupom digitado e inválido: avisa em vez de cobrar sem o desconto esperado
  if (coupon && data.coupon_error) return { error: data.coupon_error };
  return {
    priced: {
      amount: data.amount_cents,
      description: `BioFlowzy ${name} ${PERIOD_LABELS[period]}`,
      itemId: `${plan}_${period}`,
      quantity: 1,
      row: {
        plan_slug: plan, period, amount_cents: data.amount_cents, list_cents: data.list_cents,
        discount_cents: data.discount_cents, coupon_code: data.coupon_code, partner_id: data.partner_id,
      },
    },
  };
}
