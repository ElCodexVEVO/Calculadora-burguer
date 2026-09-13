import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "npm:@supabase/server@^1";

export default {
  fetch: withSupabase({ auth: "user" }, async (req, ctx) => {
    try {
      const body = await req.json();
      const action = body.action || "create";

      const {
        data: { user },
        error: userError,
      } = await ctx.supabase.auth.getUser();

      if (userError || !user) {
        return Response.json({ error: "Sesión inválida" }, { status: 401 });
      }

      const { data: adminProfile, error: profileError } =
        await ctx.supabaseAdmin
          .from("profiles")
          .select("user_id, store_id, name, role, active, can_manage_employees")
          .eq("user_id", user.id)
          .single();

      if (
        profileError ||
        !adminProfile ||
        !adminProfile.active ||
        adminProfile.role !== "admin" && adminProfile.can_manage_employees !== true
      ) {
        return Response.json(
          { error: "Solo un administrador puede administrar empleados" },
          { status: 403 },
        );
      }

      if (action === "create") {
        const name = String(body.name || "").trim();
        const username = String(body.username || "")
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9._-]/g, "")
          .slice(0, 28);

        const password = String(body.password || "");
        const role = body.role === "admin" ? "admin" : "cashier";
        const commission = Math.max(
          0,
          Math.min(100, Number(body.commission_percent || 0)),
        );

        if (!name || username.length < 3 || password.length < 6) {
          return Response.json(
            {
              error:
                "Nombre, usuario (mín. 3) y contraseña (mín. 6) son obligatorios",
            },
            { status: 400 },
          );
        }

        const { data: existing } = await ctx.supabaseAdmin
          .from("profiles")
          .select("user_id")
          .ilike("username", username)
          .maybeSingle();

        if (existing) {
          return Response.json(
            { error: "Ese usuario ya existe" },
            { status: 409 },
          );
        }

        const loginEmail =
          `${username}.${crypto.randomUUID().slice(0, 10)}@burgershot.app`;

        const { data: created, error: createError } =
          await ctx.supabaseAdmin.auth.admin.createUser({
            email: loginEmail,
            password,
            email_confirm: true,
            user_metadata: {
              name,
              username,
              store_id: adminProfile.store_id,
            },
          });

        if (createError || !created.user) {
          return Response.json(
            { error: createError?.message || "No se pudo crear el usuario" },
            { status: 400 },
          );
        }

        const { error: insertError } = await ctx.supabaseAdmin
          .from("profiles")
          .insert({
            user_id: created.user.id,
            store_id: adminProfile.store_id,
            name,
            username,
            login_email: loginEmail,
            role,
            active: true,
            commission_percent: commission,
            can_edit_orders: false,
            can_manage_catalog: false,
            can_manage_employees: false,
            can_view_reports: false,
            can_manage_payouts: false,
            can_view_audit: false,
          });

        if (insertError) {
          await ctx.supabaseAdmin.auth.admin.deleteUser(created.user.id);

          return Response.json(
            { error: insertError.message },
            { status: 400 },
          );
        }

        return Response.json({
          ok: true,
          user_id: created.user.id,
          username,
          name,
          role,
          commission_percent: commission,
        });
      }

      if (action === "reset_password") {
        const employeeId = String(body.user_id || "");
        const password = String(body.password || "");

        if (!employeeId || password.length < 6) {
          return Response.json(
            { error: "La contraseña debe tener mínimo 6 caracteres" },
            { status: 400 },
          );
        }

        const { data: target } = await ctx.supabaseAdmin
          .from("profiles")
          .select("user_id, store_id")
          .eq("user_id", employeeId)
          .eq("store_id", adminProfile.store_id)
          .maybeSingle();

        if (!target) {
          return Response.json(
            { error: "Empleado no encontrado" },
            { status: 404 },
          );
        }

        const { error: passwordError } =
          await ctx.supabaseAdmin.auth.admin.updateUserById(
            employeeId,
            { password },
          );

        if (passwordError) {
          return Response.json(
            { error: passwordError.message },
            { status: 400 },
          );
        }

        return Response.json({ ok: true });
      }

      if (action === "set_active") {
        const employeeId = String(body.user_id || "");
        const active = body.active === true;
        if (!employeeId || employeeId === user.id) {
          return Response.json(
            { error: "No puedes cambiar el estado de tu propia cuenta" },
            { status: 400 },
          );
        }
        const { data: target } = await ctx.supabaseAdmin
          .from("profiles")
          .select("user_id, store_id, role, name")
          .eq("user_id", employeeId)
          .eq("store_id", adminProfile.store_id)
          .maybeSingle();
        if (!target) return Response.json({ error: "Empleado no encontrado" }, { status: 404 });
        if (!active && target.role === "admin") {
          const { count } = await ctx.supabaseAdmin
            .from("profiles")
            .select("user_id", { count: "exact", head: true })
            .eq("store_id", adminProfile.store_id)
            .eq("role", "admin")
            .eq("active", true);
          if ((count || 0) <= 1) return Response.json({ error: "La sucursal debe conservar al menos un administrador activo" }, { status: 409 });
        }
        const { error: updateError } = await ctx.supabaseAdmin
          .from("profiles")
          .update({ active })
          .eq("user_id", employeeId)
          .eq("store_id", adminProfile.store_id);
        if (updateError) return Response.json({ error: updateError.message }, { status: 400 });
        return Response.json({ ok: true, user_id: employeeId, active });
      }

      if (action === "delete") {
        const employeeId = String(body.user_id || "");

        if (!employeeId || employeeId === user.id) {
          return Response.json(
            { error: "No puedes borrar tu propia cuenta desde este panel" },
            { status: 400 },
          );
        }

        const { data: target, error: targetError } = await ctx.supabaseAdmin
          .from("profiles")
          .select("user_id, store_id, name, role")
          .eq("user_id", employeeId)
          .eq("store_id", adminProfile.store_id)
          .maybeSingle();

        if (targetError || !target) {
          return Response.json(
            { error: "Perfil no encontrado en esta sucursal" },
            { status: 404 },
          );
        }

        const { data: salesRows, error: salesError } = await ctx.supabaseAdmin
          .from("sales")
          .select("id")
          .eq("store_id", adminProfile.store_id)
          .eq("created_by", employeeId)
          .limit(1);
        const { data: payoutRows, error: payoutError } = await ctx.supabaseAdmin
          .from("employee_payouts")
          .select("id")
          .eq("store_id", adminProfile.store_id)
          .eq("employee_id", employeeId)
          .limit(1);
        const { data: voidedRows, error: voidedError } = await ctx.supabaseAdmin
          .from("sales")
          .select("id")
          .eq("store_id", adminProfile.store_id)
          .eq("voided_by", employeeId)
          .limit(1);
        const { data: payoutCreatedRows, error: payoutCreatedError } = await ctx.supabaseAdmin
          .from("employee_payouts")
          .select("id")
          .eq("store_id", adminProfile.store_id)
          .eq("created_by", employeeId)
          .limit(1);
        const { data: ownerRows, error: ownerError } = await ctx.supabaseAdmin
          .from("stores")
          .select("id")
          .eq("id", adminProfile.store_id)
          .eq("owner_id", employeeId)
          .limit(1);

        if (salesError || payoutError || voidedError || payoutCreatedError || ownerError) {
          return Response.json(
            { error: "No se pudo comprobar el historial del usuario" },
            { status: 400 },
          );
        }

        if (
          (salesRows?.length || 0) > 0 ||
          (payoutRows?.length || 0) > 0 ||
          (voidedRows?.length || 0) > 0 ||
          (payoutCreatedRows?.length || 0) > 0 ||
          (ownerRows?.length || 0) > 0
        ) {
          return Response.json(
            {
              error:
                "Este perfil tiene historial, es responsable de la sucursal o aparece en cortes. Déjalo inactivo para conservar el historial.",
            },
            { status: 409 },
          );
        }

        const { data: activeAdmins, error: adminsError } = await ctx.supabaseAdmin
          .from("profiles")
          .select("user_id")
          .eq("store_id", adminProfile.store_id)
          .eq("role", "admin")
          .eq("active", true);

        if (adminsError) {
          return Response.json(
            { error: "No se pudo validar la administración de la sucursal" },
            { status: 400 },
          );
        }

        if (target.role === "admin" && (activeAdmins?.length || 0) <= 1) {
          return Response.json(
            { error: "La sucursal debe conservar al menos un administrador activo" },
            { status: 409 },
          );
        }

        const { error: deleteError } = await ctx.supabaseAdmin.auth.admin.deleteUser(employeeId);
        if (deleteError) {
          return Response.json(
            { error: deleteError.message },
            { status: 400 },
          );
        }

        return Response.json({ ok: true, user_id: employeeId, name: target.name });
      }

      return Response.json(
        { error: "Acción desconocida" },
        { status: 400 },
      );
    } catch (error) {
      return Response.json(
        {
          error:
            error instanceof Error ? error.message : String(error),
        },
        { status: 500 },
      );
    }
  }),
};
