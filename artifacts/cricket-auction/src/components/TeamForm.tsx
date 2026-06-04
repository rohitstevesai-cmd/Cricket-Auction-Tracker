import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Team, useData } from "@/context/DataContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Shield, Upload, X } from "lucide-react";

const teamSchema = z.object({
  name: z.string().min(2, "Team name is required"),
  location: z.string().min(2, "Location is required"),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/i, "Must be a valid hex color"),
  description: z.string(),
  totalPoints: z.coerce.number().min(1, "Min 1 point").max(99999),
});

type TeamFormValues = z.infer<typeof teamSchema>;

interface TeamFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teamToEdit?: Team | null;
}

export function TeamForm({ open, onOpenChange, teamToEdit }: TeamFormProps) {
  const { addTeam, editTeam } = useData();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [logoPreview, setLogoPreview] = useState<string>("");

  const form = useForm<TeamFormValues>({
    resolver: zodResolver(teamSchema),
    defaultValues: { name: "", location: "", color: "#1a73e8", description: "", totalPoints: 200 },
  });

  useEffect(() => {
    if (teamToEdit && open) {
      form.reset({
        name: teamToEdit.name,
        location: teamToEdit.location,
        color: teamToEdit.color,
        description: teamToEdit.description,
        totalPoints: teamToEdit.totalPoints ?? 200,
      });
      setLogoPreview(teamToEdit.logo || "");
    } else if (!open) {
      form.reset({ name: "", location: "", color: "#1a73e8", description: "", totalPoints: 200 });
      setLogoPreview("");
    }
  }, [teamToEdit, open, form]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error("Logo must be under 2MB"); return; }
    const reader = new FileReader();
    reader.onload = (ev) => setLogoPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const removeLogo = () => {
    setLogoPreview("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const onSubmit = async (data: TeamFormValues) => {
    try {
      if (teamToEdit) {
        await editTeam(teamToEdit.id, { ...data, logo: logoPreview });
        toast.success("Team updated successfully");
      } else {
        await addTeam({ ...data, logo: logoPreview, usedPoints: 0 });
        toast.success("Team added successfully");
      }
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e.message || "Failed to save team");
    }
  };

  const watchedColor = form.watch("color");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-slate-900 border-white/10 text-white">
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl tracking-wide uppercase text-primary">
            {teamToEdit ? "Edit Team" : "Add New Team"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">

            {/* Logo Upload */}
            <div className="flex items-center gap-4">
              <div className="relative flex-shrink-0">
                {logoPreview ? (
                  <div className="relative w-20 h-20 rounded-xl overflow-hidden border-2 border-primary/60 bg-black/40">
                    <img src={logoPreview} alt="Logo preview" className="w-full h-full object-contain p-1" />
                    <button
                      type="button"
                      onClick={removeLogo}
                      className="absolute top-0.5 right-0.5 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center"
                    >
                      <X className="w-3 h-3 text-white" />
                    </button>
                  </div>
                ) : (
                  <div
                    className="w-20 h-20 rounded-xl flex items-center justify-center border-2 border-dashed border-white/20 bg-black/30"
                    style={{ borderColor: watchedColor + "66" }}
                  >
                    <Shield className="w-8 h-8 text-white/20" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm text-white/70 mb-2 font-medium">Team Logo / Badge</p>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 text-xs bg-white/10 hover:bg-white/15 border border-white/20 text-white px-3 py-2 rounded-lg transition-colors w-full justify-center"
                >
                  <Upload className="w-3.5 h-3.5" />
                  {logoPreview ? "Change Logo" : "Upload Logo"}
                </button>
                <p className="text-[10px] text-white/40 mt-1.5 text-center">PNG/JPG/WebP, max 2MB</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleLogoChange}
                  className="hidden"
                />
              </div>
            </div>

            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white/80">Team Name</FormLabel>
                <FormControl><Input placeholder="e.g. Royal Challengers" className="bg-black/40 border-white/10" {...field} /></FormControl>
                <FormMessage className="text-red-400" />
              </FormItem>
            )} />

            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="location" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white/80">Location</FormLabel>
                  <FormControl><Input placeholder="e.g. Bangalore" className="bg-black/40 border-white/10" {...field} /></FormControl>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )} />
              <FormField control={form.control} name="color" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white/80">Theme Color</FormLabel>
                  <div className="flex gap-2">
                    <FormControl><Input type="color" className="bg-black/40 border-white/10 p-1 w-12 cursor-pointer" {...field} /></FormControl>
                    <Input type="text" className="bg-black/40 border-white/10 flex-1 font-mono text-sm uppercase" {...field} />
                  </div>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )} />
            </div>

            <FormField control={form.control} name="totalPoints" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white/80 flex items-center gap-1.5">
                  Total Points Budget
                  <span className="text-[10px] text-white/40 font-normal">(for buying players)</span>
                </FormLabel>
                <FormControl><Input type="number" min={1} className="bg-black/40 border-white/10" {...field} /></FormControl>
                <FormMessage className="text-red-400" />
              </FormItem>
            )} />

            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white/80">Description</FormLabel>
                <FormControl><Textarea placeholder="Brief team bio or catchphrase..." className="bg-black/40 border-white/10 resize-none" {...field} /></FormControl>
                <FormMessage className="text-red-400" />
              </FormItem>
            )} />

            <div className="flex justify-end gap-3 pt-4 border-t border-white/10 mt-6">
              <Button type="button" variant="outline" className="border-white/20 text-white" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90">{teamToEdit ? "Save Changes" : "Add Team"}</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
