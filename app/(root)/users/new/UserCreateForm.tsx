"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Role } from "@prisma/client";
import { useForm } from "@tanstack/react-form";
import { z } from "zod";

import { createUserAsAdmin } from "@/lib/actions/user.actions";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/app/(root)/kitesurfing/booking/phoneInput";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const schema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().trim(),
  role: z.nativeEnum(Role),
  isInstructor: z.boolean().default(false),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export default function UserCreateForm() {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const roleOptions = Object.values(Role) as Role[];
  const router = useRouter();

  const form = useForm({
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      role: Role.KITER as Role,
      isInstructor: false,
      password: "",
    },
    validators: {
      onSubmit: ({ value }) => {
        const result = schema.safeParse(value);
        if (!result.success) return result.error.flatten().fieldErrors as any;
        return;
      },
    },
    onSubmit: async ({ value }) => {
      setIsSubmitting(true);
      try {
        const res = await createUserAsAdmin({
          name: value.name || null,
          email: value.email,
          phone: value.phone || null,
          role: value.role,
          isInstructor: value.isInstructor,
          password: value.password,
        });
        if (!res.success) {
          toast.error(res.message ?? "Failed to create user");
          return;
        }
        toast.success("User created");
        router.push("/users");
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  return (
    <Card className="max-w-md mx-auto mt-6 rounded-2xl">
      <CardHeader>
        <CardTitle>New user</CardTitle>
        <CardDescription>Create a new account</CardDescription>
      </CardHeader>

      <CardContent>
        <form
          id="user-create-form"
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
        >
          <form.Field name="name">
            {(field) => (
              <Field>
                <FieldLabel htmlFor={field.name}>Full name</FieldLabel>
                <Input
                  id={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  disabled={isSubmitting}
                  className="rounded-full"
                />
                <FieldError errors={field.state.meta.errors} />
              </Field>
            )}
          </form.Field>

          <form.Field name="email">
            {(field) => (
              <Field>
                <FieldLabel htmlFor={field.name}>Email</FieldLabel>
                <Input
                  id={field.name}
                  type="email"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  disabled={isSubmitting}
                  className="rounded-full"
                />
                <FieldError errors={field.state.meta.errors} />
              </Field>
            )}
          </form.Field>

          <form.Field name="phone">
            {(field) => (
              <Field>
                <FieldLabel htmlFor={field.name}>Phone</FieldLabel>
                <PhoneInput
                  id={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={field.handleChange}
                  international
                  defaultCountry="EG"
                  disabled={isSubmitting}
                  className="rounded-full"
                />
                <FieldError errors={field.state.meta.errors} />
              </Field>
            )}
          </form.Field>

          <form.Field name="role">
            {(field) => (
              <Field>
                <FieldLabel htmlFor={field.name}>Role</FieldLabel>
                <Select
                  value={field.state.value}
                  onValueChange={(value) => field.handleChange(value as Role)}
                  disabled={isSubmitting}
                >
                  <SelectTrigger id={field.name} className="w-full rounded-full">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {roleOptions.map((role) => (
                        <SelectItem key={role} value={role}>
                          {role}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <FieldError errors={field.state.meta.errors} />
              </Field>
            )}
          </form.Field>

          <form.Field name="isInstructor">
            {(field) => (
              <Field>
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={field.state.value}
                    onChange={(e) => field.handleChange(e.target.checked)}
                    disabled={isSubmitting}
                    className="h-4 w-4 rounded border-gray-300 accent-primary cursor-pointer"
                  />
                  <span className="text-sm font-medium leading-none">
                    Also an instructor
                  </span>
                </label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Appears in instructor dropdowns regardless of primary role
                </p>
              </Field>
            )}
          </form.Field>

          <form.Field name="password">
            {(field) => (
              <Field>
                <FieldLabel htmlFor={field.name}>Password</FieldLabel>
                <Input
                  id={field.name}
                  type="password"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  disabled={isSubmitting}
                  className="rounded-full"
                  placeholder="Min. 8 characters"
                />
                <FieldError errors={field.state.meta.errors} />
              </Field>
            )}
          </form.Field>
        </form>
      </CardContent>

      <CardFooter className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/users")}
          disabled={isSubmitting}
          className="rounded-full"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          form="user-create-form"
          disabled={isSubmitting}
          className="rounded-full"
        >
          {isSubmitting ? "Creating…" : "Create user"}
        </Button>
      </CardFooter>
    </Card>
  );
}
