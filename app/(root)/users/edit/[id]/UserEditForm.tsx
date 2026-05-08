"use client";

import React from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "sonner";
import { Role } from "@prisma/client";
import { useForm } from "@tanstack/react-form";

import { updateUser } from "@/lib/actions/user.actions";
import { userEditFormSchema } from "@/lib/validators";
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
import kitePhoto from "@/public/images/kitesurfing/kite_booking_form_descktop.webp";

type Props = {
  user: {
    id: string;
    name: string | null;
    email: string;
    phone: string | null;
    role: Role;
    isInstructor: boolean;
  };
};

export default function UserEditFormClient({ user }: Props) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const roleOptions = Object.values(Role) as Role[];
  const router = useRouter();

  const form = useForm({
    defaultValues: {
      name: user.name || "",
      phone: user.phone || "",
      email: user.email || "",
      password: "",
      role: user.role || Role.KITER,
      isInstructor: user.isInstructor,
    },
    validators: {
      onSubmit: ({ value }) => {
        const result = userEditFormSchema.safeParse(value);
        if (!result.success) return result.error.flatten().fieldErrors as any;
        return;
      },
    },
    onSubmit: async ({ value }) => {
      setIsSubmitting(true);
      try {
        const res = await updateUser(user.id, value);
        if (!res.success) {
          toast(res.message);
          return;
        }
        toast("User updated");
        router.back();
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  return (
    <div className="md:flex md:m-2">
      <Image
        src={kitePhoto}
        alt="Kite surfer making a jump"
        className="hidden md:block md:w-1/2 lg:w-2/3 rounded-l-4xl object-cover"
      />
      <Card className="m-2 md:m-0 md:w-1/2 lg:w-1/3 md:rounded-s-none rounded-4xl">
        <CardHeader>
          <CardTitle>Edit user</CardTitle>
          <CardDescription>Update account details</CardDescription>
        </CardHeader>

        <CardContent>
          <form
            id="user-edit-form"
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
                    value={field.state.value ?? ""}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
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
                    value={field.state.value ?? ""}
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
                    <SelectTrigger
                      id={field.name}
                      className="w-full rounded-full"
                    >
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
          </form>
        </CardContent>

        <CardFooter className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            form="user-edit-form"
            onClick={() => form.reset()}
            disabled={isSubmitting}
            className="rounded-full"
          >
            Reset
          </Button>
          <Button
            type="submit"
            form="user-edit-form"
            disabled={isSubmitting}
            className="rounded-full"
          >
            Save
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
