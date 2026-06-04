import { useEffect } from "react";
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

const teamSchema = z.object({
  name: z.string().min(2, "Team name is required"),
  location: z.string().min(2, "Location is required"),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/i, "Must be a valid hex color"),
  description: z.string(),
  logo: z.string(),
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

  const form = useForm<TeamFormValues>({
    resolver: zodResolver(teamSchema),
    defaultValues: { name: "", location: "", color: "#1a73e8", description: "", logo: "", totalPoints: 200 },
  });

  useEffect(() => {
    if (teamToEdit && open) {
      form.reset({
        name: teamToEdit.name,
        location: teamToEdit.location,
        color: teamToEdit.color,
        description: teamToEdit.description,
        logo: teamToEdit.logo,
        totalPoints: teamToEdit.totalPoints ?? 200,
      });
    } else if (!open) {
      form.reset({ name: "", location: "", color: "#1a73e8", description: "", logo: "", totalPoints: 200 });
    }
  }, [teamToEdit, open, form]);

  const onSubmit = async (data: TeamFormValues) => {
    try {
      if (teamToEdit) {
        await editTeam(teamToEdit.id, data);
        toast.success("Team updated successfully");
      } else {
        await addTeam({ ...data, usedPoints: 0 });
        toast.success("Team added successfully");
      }
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e.message || "Failed to save team");
    }
  };

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

            {/* Total Points Budget */}
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
