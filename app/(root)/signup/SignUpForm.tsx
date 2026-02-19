"use client";
import React from "react";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { SignUpFormData, signUpFormSchema } from "@/lib/validators";
import { useForm } from "@tanstack/react-form";
import { PhoneInput } from "../kitesurfing/booking/phoneInput";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import Image from "next/image";
import kitePhoto from "@/public/images/kitesurfing/kite_booking_form_descktop.webp";
import { createUser } from "@/lib/actions/user.actions";

import { useRouter } from "next/navigation";

const defaultUserValues = {
  name: "",
  phone: "",
  email: "",
  password: "12345678",
};

function SignUpForm() {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const callbackUrl = "/";
  const router = useRouter();

  const form = useForm({
    defaultValues: defaultUserValues as SignUpFormData,
    validators: {
      onSubmit: ({ value }) => {
        const result = signUpFormSchema.safeParse(value);
        if (!result.success) {
          console.log("Validation errors:", result.error.flatten());
          console.log("Field errors:", result.error.flatten().fieldErrors);
          return result.error.flatten().fieldErrors as any;
        }
        return;
      },
    },
    onSubmit: async ({ value }) => {
      setIsSubmitting(true);
      try {
        const normalizedValue = {
          ...value,
        };

        const result = await createUser(normalizedValue);

        if (!result.success) {
          toast.error(result.message);
          return;
        }

        // If redirect: true, NextAuth will handle navigation.
        // If you later set redirect: false, you can check:
        // if (signInResult?.error) toast.error("Invalid credentials");
      } catch (error: any) {
        toast(error.message || "Something went wrong. Please try again.");
        setIsSubmitting(false);
      } finally {
        setIsSubmitting(false);
        router.push(callbackUrl);
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
          <CardTitle>Sign up to Fins kite school</CardTitle>
          <CardDescription>
            Fill in the info to create your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              form.handleSubmit();
            }}
            id="sign-up-form"
          >
            {/* Name */}
            <form.Field
              name="name"
              children={(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid;

                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>Full name</FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value ?? ""}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      type="text"
                      aria-invalid={isInvalid}
                      className="rounded-full"
                    />
                    {isInvalid && (
                      <FieldError errors={field.state.meta.errors} />
                    )}
                  </Field>
                );
              }}
            />
            {/* Email */}
            <form.Field
              name="email"
              children={(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid;

                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>Email</FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      type="email"
                      aria-invalid={isInvalid}
                      className="rounded-full"
                    />
                    {isInvalid && (
                      <FieldError errors={field.state.meta.errors} />
                    )}
                  </Field>
                );
              }}
            />
            {/* Password */}
            <form.Field
              name="password"
              children={(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid;

                return (
                  <Field data-invalid={isInvalid} hidden>
                    <FieldLabel htmlFor={field.name}>Password</FieldLabel>
                    <Input
                      hidden
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      type="password"
                      aria-invalid={isInvalid}
                      className="rounded-full"
                    />
                    {isInvalid && (
                      <FieldError errors={field.state.meta.errors} />
                    )}
                  </Field>
                );
              }}
            />
            {/* Phone */}
            <form.Field
              name="phone"
              children={(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>Phone</FieldLabel>
                    <PhoneInput
                      id={field.name}
                      type="text"
                      value={field.state.value ?? ""}
                      onBlur={field.handleBlur}
                      onChange={field.handleChange}
                      aria-invalid={isInvalid}
                      international
                      defaultCountry="EG"
                      disabled={isSubmitting}
                      className="rounded-full"
                    />
                    {isInvalid && (
                      <FieldError errors={field.state.meta.errors} />
                    )}
                  </Field>
                );
              }}
            />
          </form>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Field orientation="horizontal" className="flex justify-end">
            <Button
              type="button"
              variant="outline"
              form="sign-up-form"
              onClick={() => form.reset()}
              disabled={isSubmitting}
              className="rounded-full"
            >
              Reset
            </Button>
            <Button
              className="rounded-full"
              type="submit"
              form="sign-up-form"
              disabled={isSubmitting}
            >
              Submit
            </Button>
          </Field>
        </CardFooter>
      </Card>
    </div>
  );
}

export default SignUpForm;
