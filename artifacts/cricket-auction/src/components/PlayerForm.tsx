import { useEffect } from "react";
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

const playerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  age: z.coerce.number().min(16, "Age must be at least 16").max(60, "Age must be less than 60"),
  village: z.string().min(2, "Village/City is required"),
  playerType: z.enum(["Batsman", "Bowler", "All-Rounder", "Wicket-Keeper"]),
  additionalTag: z.enum(["Normal Player", "Captain", "Vice Captain"]),
  teamId: z.string().nullable(),
});

type PlayerFormValues = z.infer<typeof playerSchema>;

interface PlayerFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  playerToEdit?: Player | null;
}

export function PlayerForm({ open, onOpenChange, playerToEdit }: PlayerFormProps) {
  const { addPlayer, editPlayer, teams } = useData();

  const form = useForm<PlayerFormValues>({
    resolver: zodResolver(playerSchema),
    defaultValues: {
      name: "",
      age: 20,
      village: "",
      playerType: "Batsman",
      additionalTag: "Normal Player",
      teamId: null,
    },
  });

  useEffect(() => {
    if (playerToEdit && open) {
      form.reset({
        name: playerToEdit.name,
        age: playerToEdit.age,
        village: playerToEdit.village,
        playerType: playerToEdit.playerType,
        additionalTag: playerToEdit.additionalTag,
        teamId: playerToEdit.teamId,
      });
    } else if (!open) {
      form.reset({
        name: "",
        age: 20,
        village: "",
        playerType: "Batsman",
        additionalTag: "Normal Player",
        teamId: null,
      });
    }
  }, [playerToEdit, open, form]);

  const onSubmit = (data: PlayerFormValues) => {
    const status = data.teamId ? "sold" : "available";
    
    if (playerToEdit) {
      editPlayer(playerToEdit.id, { ...data, status });
      toast.success("Player updated successfully");
    } else {
      addPlayer({ ...data, status, photo: "" });
      toast.success("Player added successfully");
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-slate-900 border-white/10 text-white">
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl tracking-wide uppercase text-primary">
            {playerToEdit ? "Edit Player" : "Add New Player"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white/80">Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Virat Kohli" className="bg-black/40 border-white/10" {...field} />
                  </FormControl>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="age"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white/80">Age</FormLabel>
                    <FormControl>
                      <Input type="number" className="bg-black/40 border-white/10" {...field} />
                    </FormControl>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="village"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white/80">Village/City</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Delhi" className="bg-black/40 border-white/10" {...field} />
                    </FormControl>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="playerType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white/80">Player Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-black/40 border-white/10">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Batsman">Batsman</SelectItem>
                        <SelectItem value="Bowler">Bowler</SelectItem>
                        <SelectItem value="All-Rounder">All-Rounder</SelectItem>
                        <SelectItem value="Wicket-Keeper">Wicket-Keeper</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="additionalTag"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white/80">Tag</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-black/40 border-white/10">
                          <SelectValue placeholder="Select tag" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Normal Player">Normal Player</SelectItem>
                        <SelectItem value="Captain">Captain</SelectItem>
                        <SelectItem value="Vice Captain">Vice Captain</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="teamId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white/80">Assign to Team (Optional)</FormLabel>
                  <Select onValueChange={(val) => field.onChange(val === "none" ? null : val)} value={field.value || "none"}>
                    <FormControl>
                      <SelectTrigger className="bg-black/40 border-white/10">
                        <SelectValue placeholder="Select team" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">-- Available (No Team) --</SelectItem>
                      {teams.map((team) => (
                        <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4 border-t border-white/10 mt-6">
              <Button type="button" variant="outline" className="border-white/20 text-white" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90">
                {playerToEdit ? "Save Changes" : "Add Player"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
