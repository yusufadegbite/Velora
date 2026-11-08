"use client";
import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, ImagePlus, Loader2, Plus, Trash2, Upload } from "lucide-react";
import { saveVehicleAction } from "@/actions/admin";
import { Input, Select, Textarea, FormMessage } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { VehicleImage } from "@/components/ui/VehicleImage";
import { LABELS } from "@/lib/utils";

export type VehicleFormValues = {
  brandId: string; model: string; trim: string; year: number; price: number | ""; previousPrice: number | ""; mileage: number;
  transmission: string; fuelType: string; bodyType: string; drivetrain: string; condition: string; status: string;
  engine: string; engineCapacity: number | ""; horsepower: number | ""; seats: number; exteriorColor: string; interiorColor: string;
  location: string; vin: string; description: string; featured: boolean; forSale: boolean; forRent: boolean;
  dailyRate: number | ""; weeklyRate: number | ""; monthlyRate: number | ""; securityDeposit: number | "";
  imageUrls: string[]; specs: { group: string; label: string; value: string }[];
};

export const emptyVehicle: VehicleFormValues = {
  brandId: "", model: "", trim: "", year: new Date().getFullYear(), price: "", previousPrice: "", mileage: 0, transmission: "AUTOMATIC", fuelType: "PETROL",
  bodyType: "SUV", drivetrain: "AWD", condition: "FOREIGN_USED", status: "AVAILABLE", engine: "", engineCapacity: "", horsepower: "", seats: 5,
  exteriorColor: "", interiorColor: "", location: "Lagos", vin: "", description: "", featured: false, forSale: true, forRent: false,
  dailyRate: "", weeklyRate: "", monthlyRate: "", securityDeposit: "", imageUrls: [], specs: [{ group: "Performance", label: "Torque", value: "" }, { group: "Performance", label: "0–100 km/h", value: "" }],
};

export function VehicleForm({ id, initial, brands, uploadsEnabled }: { id: string | null; initial: VehicleFormValues; brands: { id: string; name: string }[]; uploadsEnabled: boolean }) {
  const [v, setV] = useState(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string>();
  const [pending, start] = useTransition();
  const [uploading, setUploading] = useState(false);
  const [newUrl, setNewUrl] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const toast = useToast();
  const router = useRouter();
  const set = <K extends keyof VehicleFormValues>(k: K, val: VehicleFormValues[K]) => setV((s) => ({ ...s, [k]: val }));
  const num = (k: keyof VehicleFormValues) => (e: React.ChangeEvent<HTMLInputElement>) => set(k, (e.target.value === "" ? "" : Number(e.target.value)) as never);
  const txt = (k: keyof VehicleFormValues) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => set(k, e.target.value as never);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    start(async () => {
      const res = await saveVehicleAction(id, v);
      setErrors(res?.errors ?? {});
      setMessage(res?.ok ? undefined : res?.message);
      if (res?.ok) { toast(res.message ?? "Saved", "success"); router.push("/admin/vehicles"); router.refresh(); }
      else window.scrollTo({ top: 0, behavior: "smooth" });
    });
  };

  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    const fd = new FormData();
    Array.from(files).forEach((f) => fd.append("files", f));
    try {
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const json = (await res.json()) as { uploaded?: string[]; errors?: string[]; error?: string };
      if (json.uploaded?.length) set("imageUrls", [...v.imageUrls, ...json.uploaded]);
      [...(json.errors ?? []), ...(json.error ? [json.error] : [])].forEach((m) => toast(m, "error"));
    } catch { toast("Upload failed", "error"); }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  };
  const addUrl = () => {
    try { const u = new URL(newUrl); if (u.protocol !== "https:") throw new Error(); set("imageUrls", [...v.imageUrls, newUrl]); setNewUrl(""); }
    catch { toast("Enter a valid https:// image URL", "error"); }
  };
  const move = (i: number, d: number) => { const a = [...v.imageUrls]; [a[i], a[i + d]] = [a[i + d], a[i]]; set("imageUrls", a); };
  const opts = (o: Record<string, string>) => Object.entries(o).map(([k, l]) => <option key={k} value={k}>{l}</option>);
  const card = "border border-line bg-white p-6 space-y-5";
  const h = "text-sm font-semibold tracking-wide";

  return (
    <form onSubmit={submit} className="space-y-6" noValidate>
      <FormMessage state={message ? { message } : undefined} />
      <section className={card}>
        <h2 className={h}>Identity</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Select label="Brand" name="brandId" value={v.brandId} onChange={txt("brandId")} error={errors.brandId}><option value="">Choose…</option>{brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</Select>
          <Input label="Model" name="model" value={v.model} onChange={txt("model")} error={errors.model} />
          <Input label="Trim" name="trim" value={v.trim} onChange={txt("trim")} optional />
          <Input label="Year" name="year" type="number" value={v.year} onChange={num("year")} error={errors.year} />
          <Select label="Condition" name="condition" value={v.condition} onChange={txt("condition")}>{opts(LABELS.condition)}</Select>
          <Select label="Status" name="status" value={v.status} onChange={txt("status")}>{opts(LABELS.vehicleStatus)}</Select>
          <Input label="Location" name="location" value={v.location} onChange={txt("location")} error={errors.location} />
          <Input label="VIN" name="vin" value={v.vin} onChange={txt("vin")} error={errors.vin} optional />
        </div>
      </section>

      <section className={card}>
        <h2 className={h}>Pricing & listing</h2>
        <div className="flex flex-wrap gap-6 text-sm">
          {(["forSale", "forRent", "featured"] as const).map((k) => (
            <label key={k} className="flex items-center gap-2"><input type="checkbox" checked={v[k]} onChange={(e) => set(k, e.target.checked)} className="size-4 accent-[#10151C]" />{k === "forSale" ? "List for sale" : k === "forRent" ? "Available for rent" : "Featured on homepage"}</label>
          ))}
        </div>
        {errors.forSale && <p className="text-xs text-danger">{errors.forSale}</p>}
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Selling price (₦)" name="price" type="number" min={0} value={v.price} onChange={num("price")} error={errors.price} />
          <Input label="Previous price (₦)" name="previousPrice" type="number" min={0} value={v.previousPrice} onChange={num("previousPrice")} optional hint="Shows a ‘Save ₦…’ offer when higher than the price." />
        </div>
        {v.forRent && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Input label="Daily rate (₦)" name="dailyRate" type="number" value={v.dailyRate} onChange={num("dailyRate")} error={errors.dailyRate} />
            <Input label="Weekly rate (₦)" name="weeklyRate" type="number" value={v.weeklyRate} onChange={num("weeklyRate")} optional />
            <Input label="Monthly rate (₦)" name="monthlyRate" type="number" value={v.monthlyRate} onChange={num("monthlyRate")} optional />
            <Input label="Security deposit (₦)" name="securityDeposit" type="number" value={v.securityDeposit} onChange={num("securityDeposit")} optional />
          </div>
        )}
      </section>

      <section className={card}>
        <h2 className={h}>Specification</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Input label="Mileage (km)" name="mileage" type="number" min={0} value={v.mileage} onChange={num("mileage")} error={errors.mileage} />
          <Select label="Transmission" name="transmission" value={v.transmission} onChange={txt("transmission")}>{opts(LABELS.transmission)}</Select>
          <Select label="Fuel type" name="fuelType" value={v.fuelType} onChange={txt("fuelType")}>{opts(LABELS.fuelType)}</Select>
          <Select label="Body type" name="bodyType" value={v.bodyType} onChange={txt("bodyType")}>{opts(LABELS.bodyType)}</Select>
          <Select label="Drivetrain" name="drivetrain" value={v.drivetrain} onChange={txt("drivetrain")}>{opts(LABELS.drivetrain)}</Select>
          <Input label="Engine" name="engine" value={v.engine} onChange={txt("engine")} error={errors.engine} placeholder="4.0L Twin-Turbo V8" />
          <Input label="Engine capacity (L)" name="engineCapacity" type="number" step={0.1} value={v.engineCapacity} onChange={num("engineCapacity")} optional hint="Leave blank for electric." />
          <Input label="Horsepower" name="horsepower" type="number" value={v.horsepower} onChange={num("horsepower")} error={errors.horsepower} />
          <Input label="Seats" name="seats" type="number" value={v.seats} onChange={num("seats")} />
          <Input label="Exterior colour" name="exteriorColor" value={v.exteriorColor} onChange={txt("exteriorColor")} error={errors.exteriorColor} />
          <Input label="Interior" name="interiorColor" value={v.interiorColor} onChange={txt("interiorColor")} error={errors.interiorColor} />
        </div>
        <Textarea label="Description" name="description" rows={6} value={v.description} onChange={txt("description")} error={errors.description} />
        <div>
          <p className="mb-2 text-[0.78rem] font-semibold">Additional specifications</p>
          <div className="space-y-2">
            {v.specs.map((s, i) => (
              <div key={i} className="grid grid-cols-[1fr_1fr_1.4fr_auto] gap-2">
                {(["group", "label", "value"] as const).map((k) => (
                  <input key={k} aria-label={`Spec ${i + 1} ${k}`} placeholder={k === "group" ? "Group (e.g. Performance)" : k === "label" ? "Label" : "Value"} value={s[k]} className="field py-2 text-sm"
                    onChange={(e) => set("specs", v.specs.map((x, j) => (j === i ? { ...x, [k]: e.target.value } : x)))} />
                ))}
                <button type="button" aria-label="Remove specification" onClick={() => set("specs", v.specs.filter((_, j) => j !== i))} className="px-2 text-slate hover:text-danger"><Trash2 className="size-4" /></button>
              </div>
            ))}
          </div>
          <button type="button" onClick={() => set("specs", [...v.specs, { group: "Highlights", label: `Feature ${v.specs.length + 1}`, value: "" }])} className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold"><Plus className="size-3.5" />Add specification</button>
          {Object.keys(errors).some((k) => k.startsWith("specs")) && <p className="mt-2 text-xs text-danger">Every specification row needs a group, label and value (remove empty rows).</p>}
        </div>
      </section>

      <section className={card}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className={h}>Images <span className="font-normal text-slate">({v.imageUrls.length}/20 · first image is the cover)</span></h2>
          <div className="flex gap-2">
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple className="hidden" onChange={(e) => upload(e.target.files)} />
            <Button type="button" variant="outline" size="sm" disabled={!uploadsEnabled || uploading} onClick={() => fileRef.current?.click()} title={uploadsEnabled ? undefined : "Configure Cloudinary to enable uploads"}>
              {uploading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />} Upload images
            </Button>
          </div>
        </div>
        {!uploadsEnabled && <p className="text-xs text-slate">Direct uploads are disabled until CLOUDINARY_* variables are configured. You can paste HTTPS image URLs below.</p>}
        <div className="flex gap-2">
          <input value={newUrl} onChange={(e) => setNewUrl(e.target.value)} placeholder="https://… image URL" className="field py-2 text-sm" aria-label="Image URL" onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addUrl())} />
          <Button type="button" variant="dark" size="sm" onClick={addUrl}><ImagePlus className="size-4" />Add</Button>
        </div>
        {errors.imageUrls && <p className="text-xs text-danger">{errors.imageUrls}</p>}
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
          {v.imageUrls.map((u, i) => (
            <li key={`${u}-${i}`} className="group relative aspect-[4/3] overflow-hidden bg-midnight">
              <VehicleImage src={u} alt={`Image ${i + 1}`} fill sizes="200px" />
              {i === 0 && <span className="absolute top-2 left-2 bg-gold px-1.5 py-0.5 text-[0.6rem] font-bold text-midnight">COVER</span>}
              <div className="absolute inset-x-0 bottom-0 flex justify-end gap-1 bg-midnight/80 p-1.5 opacity-0 transition group-hover:opacity-100 focus-within:opacity-100">
                <button type="button" aria-label="Move earlier" disabled={i === 0} onClick={() => move(i, -1)} className="p-1 text-white disabled:opacity-30"><ArrowUp className="size-3.5" /></button>
                <button type="button" aria-label="Move later" disabled={i === v.imageUrls.length - 1} onClick={() => move(i, 1)} className="p-1 text-white disabled:opacity-30"><ArrowDown className="size-3.5" /></button>
                <button type="button" aria-label="Remove image" onClick={() => set("imageUrls", v.imageUrls.filter((_, j) => j !== i))} className="p-1 text-white hover:text-[#ef8f7d]"><Trash2 className="size-3.5" /></button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <div className="sticky bottom-0 z-10 -mx-1 flex justify-end gap-3 border-t border-line bg-ivory/95 px-1 py-4 backdrop-blur">
        <Button type="button" variant="ghost" onClick={() => router.back()}>Cancel</Button>
        <Button type="submit" disabled={pending}>{pending && <Loader2 className="size-4 animate-spin" />}{id ? "Save changes" : "Create vehicle"}</Button>
      </div>
    </form>
  );
}
