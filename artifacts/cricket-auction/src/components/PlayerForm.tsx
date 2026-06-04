import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Player, useData } from "@/context/DataContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Camera, X, Upload, Loader2 } from "lucide-react";

const playerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  age: z.coerce.number().min(16, "Min age 16").max(60, "Max age 60"),
  village: z.string().min(2, "Village/City is required"),
  playerType: z.enum(["Batsman", "Bowler", "All-Rounder", "Wicket-Keeper"]),
  additionalTag: z.enum(["Normal Player", "Captain", "Vice Captain"]),
  points: z.coerce.number().min(1, "Min 1 point").max(50000, "Max 50000"),
  teamId: z.string().nullable(),
});

type PlayerFormValues = z.infer<typeof playerSchema>;

interface PlayerFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  playerToEdit?: Player | null;
}

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase();
}

export function PlayerForm({ open, onOpenChange, playerToEdit }: PlayerFormProps) {
  const { addPlayer, editPlayer, teams } = useData();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photoUrl, setPhotoUrl] = useState<string>("");
  const [uploading, setUploading] = useState(false);

  const form = useForm<PlayerFormValues>({
    resolver: zodResolver(playerSchema),
    defaultValues: {
      name: "",
      age: 22,
      village: "",
      playerType: "Batsman",
      additionalTag: "Normal Player",
      points: 10,
      teamId: null,
    },
  });

  const watchedName = form.watch("name");

  useEffect(() => {
    if (playerToEdit && open) {
      form.reset({
        name: playerToEdit.name,
        age: playerToEdit.age,
        village: playerToEdit.village,
        playerType: playerToEdit.playerType,
        additionalTag: playerToEdit.additionalTag,
        points: playerToEdit.points ?? 10,
        teamId: playerToEdit.teamId,
      });
      setPhotoUrl(playerToEdit.photo || "");
    } else if (!open) {
      form.reset({ name: "", age: 22, village: "", playerType: "Batsman", additionalTag: "Normal Player", points: 10, teamId: null });
      setPhotoUrl("");
    }
  }, [playerToEdit, open, form]);

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Photo must be under 5MB"); return; }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload?folder=players", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Upload failed");
      const { url } = await res.json();
      setPhotoUrl(url);
    } catch {
      toast.error("Failed to upload photo");
    } finally {
      setUploading(false);
    }
  };

  const removePhoto = () => {
    setPhotoUrl("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const onSubmit = async (data: PlayerFormValues) => {
    const status = data.teamId ? "sold" : "available";
    try {
      if (playerToEdit) {
        await editPlayer(playerToEdit.id, { ...data, status, photo: photoUrl });
        toast.success("Player updated");
      } else {
        await addPlayer({ ...data, status, photo: photoUrl });
        toast.success("Player added");
      }
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e.message || "Failed to save player");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-[500px] bg-slate-900 border-white/10 text-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl sm:text-2xl tracking-wide uppercase text-primary">
            {playerToEdit ? "Edit Player" : "Add New Player"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-2">
            {/* Photo Upload */}
            <div className="flex items-center gap-4">
              <div className="relative flex-shrink-0">
                {photoUrl ? (
                  <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-primary/60">
                    <img src={photoUrl} alt="Preview" className="w-full h-full object-cover" />
                    <button type="button" onClick={removePhoto} className="absolute top-0 right-0 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                      <X className="w-3 h-3 text-white" />
                    </button>
                  </div>
                ) : (
                  <div className="w-20 h-20 rounded-full flex items-center justify-center font-heading text-2xl text-white/60 border-2 border-dashed border-white/20 bg-black/30">
                    {watchedName ? getInitials(watchedName) : <Camera className="w-7 h-7 text-white/30" />}
                  </div>
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm text-white/70 mb-2 font-medium">Player Photo</p>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="flex items-center gap-2 text-xs bg-white/10 hover:bg-white/15 border border-white/20 text-white px-3 py-2 rounded-lg transition-colors w-full justify-center disabled:opacity-50"
                >
                  {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                  {uploading ? "Uploading…" : photoUrl ? "Change Photo" : "Upload Photo"}
                </button>
                <p className="text-[10px] text-white/40 mt-1.5 text-center">JPG/PNG, max 5MB</p>
                <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handlePhotoChange} className="hidden" />
              </div>
            </div>

            {/* Name */}
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white/80 text-sm">Full Name</FormLabel>
                <FormControl><Input placeholder="e.g. Virat Kohli" className="bg-black/40 border-white/10 h-9 text-sm" {...field} /></FormControl>
                <FormMessage className="text-red-400 text-xs" />
              </FormItem>
            )} />

            <div className="grid grid-cols-2 gap-3">
              <FormField control={form.control} name="age" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white/80 text-sm">Age</FormLabel>
                  <FormControl><Input type="number" className="bg-black/40 border-white/10 h-9 text-sm" {...field} /></FormControl>
                  <FormMessage className="text-red-400 text-xs" />
                </FormItem>
              )} />
              <FormField control={form.control} name="village" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white/80 text-sm">Village/City</FormLabel>
                  <FormControl><Input placeholder="e.g. Delhi" className="bg-black/40 border-white/10 h-9 text-sm" {...field} /></FormControl>
                  <FormMessage className="text-red-400 text-xs" />
                </FormItem>
              )} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FormField control={form.control} name="playerType" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white/80 text-sm">Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger className="bg-black/40 border-white/10 h-9 text-sm"><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="Batsman">Batsman</SelectItem>
                      <SelectItem value="Bowler">Bowler</SelectItem>
                      <SelectItem value="All-Rounder">All-Rounder</SelectItem>
                      <SelectItem value="Wicket-Keeper">Wicket-Keeper</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage className="text-red-400 text-xs" />
                </FormItem>
              )} />
              <FormField control={form.control} name="additionalTag" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white/80 text-sm">Role Tag</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger className="bg-black/40 border-white/10 h-9 text-sm"><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="Normal Player">Normal</SelectItem>
                      <SelectItem value="Captain">Captain</SelectItem>
                      <SelectItem value="Vice Captain">Vice Captain</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage className="text-red-400 text-xs" />
                </FormItem>
              )} />
            </div>

            {/* Points */}
            <FormField control={form.control} name="points" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white/80 text-sm flex items-center gap-1.5">
                  Player Points
                  <span className="text-[10px] text-white/40 font-normal">(auction value)</span>
                </FormLabel>
                <FormControl>
                  <Input type="number" min={1} max={50000} className="bg-black/40 border-white/10 h-9 text-sm" {...field} />
                </FormControl>
                <FormMessage className="text-red-400 text-xs" />
              </FormItem>
            )} />

            <FormField control={form.control} name="teamId" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white/80 text-sm">Assign to Team (Optional)</FormLabel>
                <Select onValueChange={(val) => field.onChange(val === "none" ? null : val)} value={field.value || "none"}>
                  <FormControl><SelectTrigger className="bg-black/40 border-white/10 h-9 text-sm"><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent>
                    <SelectItem value="none">Available (No Team)</SelectItem>
                    {teams.map((team) => (
                      <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage className="text-red-400 text-xs" />
              </FormItem>
            )} />

            <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
              <Button type="button" variant="outline" size="sm" className="border-white/20 text-white" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" size="sm" disabled={uploading} className="bg-primary text-primary-foreground hover:bg-primary/90">{playerToEdit ? "Save Changes" : "Add Player"}</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
