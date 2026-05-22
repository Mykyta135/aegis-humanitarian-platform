"use client";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
import { useCreateVolunteer } from "@/hooks/use-create-volounteer";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

const experienceLevels = ["trainee", "junior", "senior", "expert"] as const;
const roles = ["volunteer", "admin"] as const;
const allSkills = [
  "medic",
  "driver",
  "translator",
  "coordinator",
  "electrician",
  "mechanic",
  "cook",
  "engineer",
];
const allLanguages = ["english", "ukrainian", "polish", "german", "french"];

const formSchema = z.object({
  name: z.string().min(3, { message: "Name is required." }),
  email: z.string().email({ message: "A valid email is required." }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters." }),
  role: z.enum(roles),
  experienceLevel: z.enum(experienceLevels),
  lat: z
    .string()
    .refine((val) => val.trim() !== "" && !isNaN(parseFloat(val)), {
      message: "Latitude is required.",
    }),
  lng: z
    .string()
    .refine((val) => val.trim() !== "" && !isNaN(parseFloat(val)), {
      message: "Longitude is required.",
    }),
  skills: z.array(z.string()).refine((value) => value.some((item) => item), {
    message: "You have to select at least one skill.",
  }),
  languages: z.array(z.string()).refine((value) => value.some((item) => item), {
    message: "You have to select at least one language.",
  }),
});

type FormValues = z.infer<typeof formSchema>;

export function CreateVolunteerForm() {
  const { mutate: createVolunteer, isPending } = useCreateVolunteer();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "password123",
      role: "volunteer",
      experienceLevel: "junior",
      lat: "",
      lng: "",
      skills: [],
      languages: [],
    },
  });

  const onSubmit = (values: FormValues) => {
    const volunteerData = {
      name: values.name,
      email: values.email,
      password: values.password,
      role: values.role,
      experienceLevel: values.experienceLevel,
      homeBase: {
        lat: parseFloat(values.lat),
        lng: parseFloat(values.lng),
      },
      skills: values.skills,
      languages: values.languages,
    };

    createVolunteer(volunteerData, {
      onSuccess: () => form.reset(),
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Onboard a New Volunteer</CardTitle>
        <CardDescription>
          Register new personnel for the platform. (Admin only)
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                name="name"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                name="email"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="john.doe@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              name="password"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Default Password</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormDescription className="text-xs">
                    Users should be instructed to change this after their first
                    login.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                name="role"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {roles.map((r) => (
                          <SelectItem key={r} value={r}>
                            {r.toUpperCase()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                name="experienceLevel"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Experience</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {experienceLevels.map((lvl) => (
                          <SelectItem key={lvl} value={lvl}>
                            {lvl.toUpperCase()}
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
              <FormLabel>Home Base Location</FormLabel>
              <div className="grid grid-cols-2 gap-4 mt-2">
                <FormField
                  name="lat"
                  control={form.control}
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
                  name="lng"
                  control={form.control}
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
            </div>

            <FormField
              control={form.control}
              name="skills"
              render={({ field }) => (
                <FormItem>
                  <div className="mb-4">
                    <FormLabel>Skills</FormLabel>
                    <FormDescription>
                      Select all relevant skills for this volunteer.
                    </FormDescription>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {allSkills.map((item) => (
                      <FormItem
                        key={item}
                        className="flex flex-row items-start space-x-2 space-y-0"
                      >
                        <FormControl>
                          <Checkbox
                            checked={field.value?.includes(item)}
                            onCheckedChange={(checked) => {
                              return checked
                                ? field.onChange([...field.value, item])
                                : field.onChange(
                                    field.value?.filter(
                                      (value) => value !== item
                                    )
                                  );
                            }}
                          />
                        </FormControl>
                        <FormLabel className="text-sm font-normal">
                          {item.charAt(0).toUpperCase() + item.slice(1)}
                        </FormLabel>
                      </FormItem>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* ------------------------------------ */}

            {/* You should add the 'languages' FormField here, following the exact same pattern */}
            <FormField
              control={form.control}
              name="languages"
              render={({ field }) => (
                <FormItem>
                  <div className="mb-4">
                    <FormLabel>Languages</FormLabel>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {allLanguages.map((item) => (
                      <FormItem
                        key={item}
                        className="flex flex-row items-start space-x-2 space-y-0"
                      >
                        <FormControl>
                          <Checkbox
                            checked={field.value?.includes(item)}
                            onCheckedChange={(checked) => {
                              return checked
                                ? field.onChange([...field.value, item])
                                : field.onChange(
                                    field.value?.filter(
                                      (value) => value !== item
                                    )
                                  );
                            }}
                          />
                        </FormControl>
                        <FormLabel className="text-sm font-normal">
                          {item.charAt(0).toUpperCase() + item.slice(1)}
                        </FormLabel>
                      </FormItem>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isPending} className="w-full">
              {isPending ? "Onboarding..." : "Onboard Volunteer"}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
