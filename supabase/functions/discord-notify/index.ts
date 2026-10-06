import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "npm:@supabase/server@^1";

type EventName = "sale_created" | "sale_updated" | "sale_voided" | "payout_created";

const money = (value: unknown) => new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  maximumFractionDigits: 2,
}).format(Number(value) || 0);

const esc = (value: unknown) => String(value ?? "").replace(/[<>]/g, "");

export default {
  fetch: withSupabase({ auth: "user" }, async (req, ctx) => {
    try {
      const body = await req.json();
      const event = String(body.event || "") as EventName;
      const recordId = String(body.sale_id || body.payout_id || "");
      if (!["sale_created", "sale_updated", "sale_voided", "payout_created"].includes(event)) {
        return Response.json({ error: "Evento no permitido" }, { status: 400 });
      }
      if (!recordId) return Response.json({ error: "Falta el identificador del registro" }, { status: 400 });
      const webhookSecret = event === "payout_created"
        ? "DISCORD_WEBHOOK_PAGO_URL"
        : event === "sale_voided"
        ? "DISCORD_WEBHOOK_ANULADA_URL"
        : event === "sale_updated"
        ? "DISCORD_WEBHOOK_ORDEN_URL"
        : "DISCORD_WEBHOOK_VENTA_URL";
      // DISCORD_WEBHOOK_URL se conserva como respaldo para que la configuración
      // actual siga funcionando mientras se crean los canales separados.
      const webhook = Deno.env.get(webhookSecret) || Deno.env.get("DISCORD_WEBHOOK_URL") || "";
      if (!webhook || !/^https:\/\/(discord\.com|discordapp\.com)\/api\/webhooks\//.test(webhook)) {
        return Response.json({ error: `Configura ${webhookSecret} o DISCORD_WEBHOOK_URL en los secretos de la función` }, { status: 503 });
      }

      const { data: { user }, error: userError } = await ctx.supabase.auth.getUser();
      if (userError || !user) return Response.json({ error: "Sesión inválida" }, { status: 401 });
      const { data: actor, error: actorError } = await ctx.supabaseAdmin
        .from("profiles")
        .select("user_id,store_id,name,role,active,can_edit_orders,can_manage_payouts")
        .eq("user_id", user.id)
        .single();
      if (actorError || !actor?.active) return Response.json({ error: "Perfil inactivo o no encontrado" }, { status: 403 });

      let title = "";
      let description = "";
      let color = 0xd9273f;
      let fields: Array<{ name: string; value: string; inline?: boolean }> = [];
      let eventKey = `${event}:${recordId}`;
      const iconSecret = event === "sale_created"
        ? "DISCORD_ICON_VENTA_URL"
        : event === "sale_updated"
        ? "DISCORD_ICON_ORDEN_URL"
        : event === "sale_voided"
        ? "DISCORD_ICON_ANULADA_URL"
        : "DISCORD_ICON_PAGO_URL";
      const defaultIcons = {
        sale_created: "https://elcodexvevo.github.io/Calculadora-burguer/assets/discord/venta.png",
        sale_updated: "https://elcodexvevo.github.io/Calculadora-burguer/assets/discord/orden.png",
        sale_voided: "https://elcodexvevo.github.io/Calculadora-burguer/assets/discord/anulada.png",
        payout_created: "https://elcodexvevo.github.io/Calculadora-burguer/assets/discord/pago.png",
      } as const;
      const iconUrl = Deno.env.get(iconSecret) || defaultIcons[event];

      if (event === "payout_created") {
        if (actor.role !== "admin" && actor.can_manage_payouts !== true) return Response.json({ error: "No autorizado" }, { status: 403 });
        const { data: payout, error } = await ctx.supabaseAdmin
          .from("employee_payouts")
          .select("id,store_id,employee_name,sales_count,generated_total,amount,business_net,created_by_name,created_at")
          .eq("id", recordId).eq("store_id", actor.store_id).single();
        if (error || !payout) return Response.json({ error: "Corte no encontrado" }, { status: 404 });
        title = `Pago de empleado · ${payout.id.slice(0, 8).toUpperCase()}`;
        description = "Corte de comisiones confirmado desde BurgerShot POS.";
        color = 0x39d98a;
        fields = [
          { name: "EMPLEADO", value: `**${esc(payout.employee_name)}**`, inline: false },
          { name: "Ventas incluidas", value: String(payout.sales_count), inline: true },
          { name: "Pago realizado", value: `**${money(payout.amount)} MXN**`, inline: true },
          { name: "Generado", value: `${money(payout.generated_total)} MXN`, inline: true },
          { name: "Neto negocio", value: `${money(payout.business_net)} MXN`, inline: true },
          { name: "Registró", value: esc(payout.created_by_name || actor.name), inline: false },
        ];
      } else {
        const { data: sale, error } = await ctx.supabaseAdmin
          .from("sales")
          .select("id,store_id,sale_number,created_by,employee_name,client,total,employee_earnings,business_net,commission_percent,items,discount_name,payment,status,created_at")
          .eq("id", recordId).eq("store_id", actor.store_id).single();
        if (error || !sale) return Response.json({ error: "Venta no encontrada" }, { status: 404 });
        if (sale.created_by !== user.id && actor.role !== "admin") return Response.json({ error: "No autorizado" }, { status: 403 });
        if (event === "sale_updated" && actor.role !== "admin" && actor.can_edit_orders !== true) return Response.json({ error: "No autorizado" }, { status: 403 });
        if (event === "sale_voided" && actor.role !== "admin") return Response.json({ error: "Solo un administrador puede anular" }, { status: 403 });
        const folio = `BS-${String(sale.sale_number || 0).padStart(5, "0")}`;
        title = `${event === "sale_voided" ? "Venta anulada" : event === "sale_updated" ? "Orden actualizada" : "Nueva venta"} · ${folio}`;
        description = event === "sale_voided" ? "Una venta fue anulada desde el panel administrativo." : event === "sale_updated" ? "Una orden activa fue editada desde el panel." : "Venta registrada desde el Punto de Venta.";
        color = event === "sale_voided" ? 0x9f2235 : event === "sale_updated" ? 0x4c8dff : 0xd9273f;
        const productLines = (sale.items || []).slice(0, 5).map((item: { name?: string; qty?: number }) => `${Number(item.qty || 0)}× ${esc(item.name || "Producto")}`);
        if ((sale.items || []).length > 5) productLines.push(`+${(sale.items || []).length - 5} más`);
        fields = [
          { name: "CLIENTE / ID", value: `**${esc(sale.client || "Cliente general")}**`, inline: false },
          { name: "Empleado", value: esc(sale.employee_name), inline: true },
          { name: "Método de pago", value: esc(sale.payment || "—"), inline: true },
          { name: "TOTAL COBRADO", value: `**${money(sale.total)} MXN**`, inline: false },
          { name: "Productos", value: productLines.join("\n") || "—", inline: false },
          { name: "Comisión", value: `${money(sale.employee_earnings)} MXN · ${Number(sale.commission_percent || 0)}%`, inline: true },
          { name: "Neto negocio", value: `${money(sale.business_net)} MXN`, inline: true },
          { name: "Convenio", value: esc(sale.discount_name || "Sin convenio"), inline: true },
          { name: "Estado", value: sale.status === "active" ? "Activa" : "Anulada", inline: false },
        ];
        if (event !== "sale_created") eventKey += `:${String(body.event_id || Date.now())}`;
      }

      const { data: previous } = await ctx.supabaseAdmin
        .from("discord_deliveries").select("id,status").eq("store_id", actor.store_id).eq("event_key", eventKey).maybeSingle();
      if (previous) return Response.json({ ok: true, duplicate: true, status: previous.status });
      const { data: delivery, error: deliveryError } = await ctx.supabaseAdmin
        .from("discord_deliveries")
        .insert({ store_id: actor.store_id, event_key: eventKey, event_type: event, record_id: recordId, status: "pending" })
        .select("id").single();
      if (deliveryError || !delivery) return Response.json({ ok: true, duplicate: deliveryError?.code === "23505" });

      const response = await fetch(webhook, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          username: "BurgerShot · POS",
          avatar_url: iconUrl,
          allowed_mentions: { parse: [] },
          embeds: [{ author: { name: "BurgerShot · Notificaciones", icon_url: iconUrl }, title, description, color, fields, thumbnail: { url: iconUrl }, footer: { text: "BurgerShot POS · Supabase" }, timestamp: new Date().toISOString() }],
        }),
      });
      const responseText = await response.text();
      await ctx.supabaseAdmin.from("discord_deliveries").update({ status: response.ok ? "sent" : "failed", response_code: response.status, error_message: response.ok ? null : responseText.slice(0, 500), sent_at: response.ok ? new Date().toISOString() : null }).eq("id", delivery.id);
      if (!response.ok) {
        console.error("[discord-notify] Discord rechazó la notificación", {
          event,
          status: response.status,
          response: responseText.slice(0, 500),
        });
        return Response.json({ error: "Discord rechazó la notificación", status: response.status }, { status: 502 });
      }
      return Response.json({ ok: true, event, delivery_id: delivery.id });
    } catch (error) {
      console.error("[discord-notify] Error no controlado", error);
      return Response.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
    }
  }),
};
