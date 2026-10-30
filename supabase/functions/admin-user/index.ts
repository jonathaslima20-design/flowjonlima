import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.58.0";

// Ações de conta do Admin → Usuários (só admin). Toda ação vai para admin_audit_log.
//   { action: "impersonate", profile_id, reason }   → { token_hash } (o painel troca a sessão com verifyOtp)
//   { action: "recovery_link", profile_id }          → { link } (redefinição de senha para enviar ao usuário)
//   { action: "send_recovery", profile_id }          → envia o e-mail de redefinição
//   { action: "revoke_sessions", profile_id }        → desconecta de todos os aparelhos
//   { action: "update_email", profile_id, email }
//   { action: "confirm_email", profile_id }
//   { action: "delete_user", profile_id, confirm }   (confirm = @username; bloqueado se houver pagamento aprovado)
// Admins não podem ser acessados nem excluídos por aqui.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method not allowed" }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const admin = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
  const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
  });
  const { data: { user: caller } } = await userClient.auth.getUser();
  if (!caller) return json({ error: "unauthorized" }, 401);

  const { data: me } = await admin.from("profiles").select("role").eq("id", caller.id).maybeSingle();
  if (me?.role !== "admin") return json({ error: "forbidden" }, 403);

  const body = await req.json().catch(() => ({}));
  const action = String(body?.action ?? "");
  const profileId = String(body?.profile_id ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(profileId)) return json({ error: "Usuário inválido." }, 400);

  const { data: target } = await admin
    .from("profiles")
    .select("id, username, role, owner_id")
    .eq("id", profileId)
    .maybeSingle();
  if (!target || target.owner_id) return json({ error: "Conta não encontrada." }, 404);

  const { data: authData } = await admin.auth.admin.getUserById(profileId);
  const authUser = authData?.user;
  if (!authUser) return json({ error: "Conta de acesso não encontrada." }, 404);

  const siteUrl = (Deno.env.get("SITE_URL") ?? "https://bioflowzy.com").replace(/\/$/, "");
  const log = (name: string, details: Record<string, unknown> = {}) =>
    admin.from("admin_audit_log").insert({
      admin_id: caller.id,
      action: name,
      target_type: "profile",
      target_id: profileId,
      details,
    });
  const protectedTarget = target.role === "admin" || target.id === caller.id;

  switch (action) {
    case "impersonate": {
      if (protectedTarget) return json({ error: "Não é possível entrar na conta de um admin." }, 403);
      const reason = String(body?.reason ?? "").trim().slice(0, 300);
      if (reason.length < 3) return json({ error: "Informe o motivo do acesso." }, 400);
      if (!authUser.email) return json({ error: "A conta não tem e-mail." }, 400);
      const { data, error } = await admin.auth.admin.generateLink({ type: "magiclink", email: authUser.email });
      const tokenHash = data?.properties?.hashed_token;
      if (error || !tokenHash) return json({ error: error?.message ?? "Não foi possível gerar o acesso." }, 500);
      await log("impersonate_start", { reason });
      return json({ ok: true, token_hash: tokenHash, username: target.username });
    }

    case "recovery_link":
    case "send_recovery": {
      if (!authUser.email) return json({ error: "A conta não tem e-mail." }, 400);
      const redirectTo = `${siteUrl}/redefinir-senha`;
      if (action === "send_recovery") {
        const { error } = await admin.auth.resetPasswordForEmail(authUser.email, { redirectTo });
        if (error) return json({ error: error.message }, 500);
        await log("password_recovery_sent");
        return json({ ok: true });
      }
      if (target.role === "admin") return json({ error: "Não é possível gerar link para um admin." }, 403);
      const { data, error } = await admin.auth.admin.generateLink({ type: "recovery", email: authUser.email, options: { redirectTo } });
      const link = data?.properties?.action_link;
      if (error || !link) return json({ error: error?.message ?? "Não foi possível gerar o link." }, 500);
      await log("password_recovery_link");
      return json({ ok: true, link });
    }

    case "revoke_sessions": {
      const { data, error } = await admin.rpc("admin_revoke_sessions", { p_user_id: profileId });
      if (error) return json({ error: error.message }, 500);
      await log("revoke_sessions", { sessions: data ?? 0 });
      return json({ ok: true, sessions: data ?? 0 });
    }

    case "update_email": {
      const email = String(body?.email ?? "").trim().toLowerCase();
      if (!EMAIL_RE.test(email) || email.length > 200) return json({ error: "E-mail inválido." }, 400);
      if (email === authUser.email) return json({ ok: true });
      const { error } = await admin.auth.admin.updateUserById(profileId, { email, email_confirm: true });
      if (error) {
        const taken = /already|registered|exists/i.test(error.message);
        return json({ error: taken ? "Esse e-mail já está em uso por outra conta." : error.message }, 400);
      }
      await log("update_email", { before: authUser.email, after: email });
      return json({ ok: true });
    }

    case "confirm_email": {
      const { error } = await admin.auth.admin.updateUserById(profileId, { email_confirm: true });
      if (error) return json({ error: error.message }, 500);
      await log("confirm_email");
      return json({ ok: true });
    }

    case "delete_user": {
      if (protectedTarget) return json({ error: "Não é possível excluir um admin." }, 403);
      if (String(body?.confirm ?? "").replace(/^@/, "").toLowerCase() !== target.username.toLowerCase()) {
        return json({ error: "Digite o @username para confirmar." }, 400);
      }
      // Excluir a conta apagaria o histórico de pagamentos (obrigação fiscal): nesses casos, suspenda
      const { count } = await admin
        .from("payments")
        .select("id", { count: "exact", head: true })
        .eq("profile_id", profileId)
        .eq("status", "approved");
      if ((count ?? 0) > 0) {
        return json({ error: "A conta tem pagamentos aprovados e não pode ser excluída. Suspenda a conta." }, 409);
      }
      await log("delete_user", { username: target.username, email: authUser.email });
      const { error } = await admin.auth.admin.deleteUser(profileId);
      if (error) return json({ error: error.message }, 500);
      return json({ ok: true });
    }
  }

  return json({ error: "Ação inválida." }, 400);
});
