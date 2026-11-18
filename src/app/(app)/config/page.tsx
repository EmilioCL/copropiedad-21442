import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireVista } from "@/lib/guard";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { Button, Card, Field, FormError, Input } from "@/components/ui";

async function guardar(formData: FormData) {
  "use server";
  const perfil = await requireVista("config");
  const tolerancia = Number(formData.get("tolerancia") ?? 0);
  const dia = Number(formData.get("dia") ?? 20);
  const aportePct = Number(formData.get("aporte") ?? 5);
  const valorUtm = Number(formData.get("valor_utm") ?? 0);

  const supabase = await createClient();
  const { error } = await supabase.rpc("actualizar_parametros", {
    c: perfil.condominioId,
    p_tolerancia: tolerancia,
    p_dia: dia,
    p_aporte_reserva: aportePct / 100,
    p_valor_utm: valorUtm,
  });

  if (error) redirect("/config?error=" + encodeURIComponent(error.message));
  revalidatePath("/config");
  revalidatePath("/gc");
  revalidatePath("/mul");
  redirect("/config?ok=1");
}

export default async function Page({ searchParams }: { searchParams: Promise<{ error?: string; ok?: string }> }) {
  const perfil = await requireVista("config");
  const { error, ok } = await searchParams;
  const supabase = await createClient();

  const { data: condo } = await supabase
    .from("condominios")
    .select("tolerancia_cuotas, dia_vencimiento, aporte_reserva, valor_utm")
    .eq("id", perfil.condominioId)
    .single();

  return (
    <>
      <PageHeader
        title="Parámetros del condominio"
        subtitle="Reglas generales que rigen los cálculos automáticos del sistema."
        nota="el aporte al Fondo de Reserva no puede ser menor al 5% legal (Ley 21.442, art. 13)."
        rol={perfil.rol}
        nombre={perfil.nombre}
      />

      {error && <div className="mb-5"><FormError>{error}</FormError></div>}
      {ok && <div className="mb-5 text-[12.5px] font-medium text-success">Parámetros actualizados.</div>}

      <Card className="max-w-[460px]">
        <form action={guardar} className="flex flex-col gap-4">
          <Field label="Cargos en mora tolerados para seguir hábil">
            <Input name="tolerancia" type="number" min={0} defaultValue={condo?.tolerancia_cuotas ?? 0} required />
          </Field>
          <Field label="Día del mes en que vencen los gastos comunes">
            <Input name="dia" type="number" min={1} max={28} defaultValue={condo?.dia_vencimiento ?? 20} required />
          </Field>
          <Field label="Aporte al Fondo de Reserva (%, mínimo legal 5%)">
            <Input name="aporte" type="number" min={5} step={0.1} defaultValue={((condo?.aporte_reserva ?? 0.05) * 100).toFixed(1)} required />
          </Field>
          <Field label="Valor de la UTM (para calcular multas)">
            <Input name="valor_utm" type="number" min={1} defaultValue={condo?.valor_utm ?? 68000} required />
          </Field>
          <Button type="submit">Guardar parámetros</Button>
        </form>
      </Card>
    </>
  );
}
