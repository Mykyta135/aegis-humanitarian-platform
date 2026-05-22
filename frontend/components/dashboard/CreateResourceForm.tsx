"use client";

import { useCreateResource } from "@/hooks/use-create-resource";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const resourceTypes = ["vehicle", "generator", "drone", "medical_kit"] as const;
const conditions = [
  "excellent",
  "good",
  "needs_maintenance",
  "inoperable",
] as const;

const formSchema = z.object({
  name: z
    .string()
    .min(3, { message: "Name must be at least 3 characters long." }),
  type: z.enum(resourceTypes),
  condition: z.enum(conditions),
  lat: z
    .string()
    .refine((val) => val.trim() !== "" && !isNaN(parseFloat(val)), {
      message: "Latitude is required.",
    })
    .refine((val) => parseFloat(val) >= -90 && parseFloat(val) <= 90, {
      message: "Must be between -90 and 90.",
    }),
  lng: z
    .string()
    .refine((val) => val.trim() !== "" && !isNaN(parseFloat(val)), {
      message: "Longitude is required.",
    })
    .refine((val) => parseFloat(val) >= -180 && parseFloat(val) <= 180, {
      message: "Must be between -180 and 180.",
    }),
});

// Infer the TypeScript type from the schema
type FormValues = z.infer<typeof formSchema>;

export function CreateResourceForm() {
  const { mutate: createResource, isPending } = useCreateResource();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      type: undefined,
      condition: "good",
      lat: "", // Default to empty strings
      lng: "",
    },
  });

  const onSubmit = (values: FormValues) => {
    // Convert validated strings to numbers before sending to the API
    const numericLat = parseFloat(values.lat);
    const numericLng = parseFloat(values.lng);

    // This is a safety check, though Zod's refine should prevent this
    if (isNaN(numericLat) || isNaN(numericLng)) {
      toast.error("Latitude and Longitude must be valid numbers.");
      return;
    }

    const resourceData = {
      name: values.name,
      type: values.type,
      condition: values.condition,
      location: { lat: numericLat, lng: numericLng },
    };

    createResource(resourceData, {
      onSuccess: () => {
        form.reset(); // Reset the form fields to their default values
      },
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Share a Resource</CardTitle>
        <CardDescription>
          Add a personal or organizational asset to the shared resource pool.
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Resource Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Ford Transit Van" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a type..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {resourceTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type.charAt(0).toUpperCase() + type.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="condition"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Condition</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a condition..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {conditions.map((con) => (
                          <SelectItem key={con} value={con}>
                            {con.replace("_", " ").charAt(0).toUpperCase() +
                              con.replace("_", " ").slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div>
              <FormLabel>Last Known Location</FormLabel>
              <div className="grid grid-cols-2 gap-4 mt-2">
                <FormField
                  control={form.control}
                  name="lat"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          type="number"
                          step="any"
                          placeholder="Latitude"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lng"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          type="number"
                          step="any"
                          placeholder="Longitude"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormDescription className="text-xs mt-2">
                Provide the coordinates of the resource's current location.
              </FormDescription>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isPending} className="w-full">
              {isPending ? "Adding to Pool..." : "Add Resource"}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
