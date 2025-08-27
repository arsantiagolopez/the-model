import { SignIn } from "@clerk/react-router";
import type { Route } from "./+types/login";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Sign In - Starter" },
    { name: "description", content: "Sign in to your Starter account" },
  ];
}

export default function LoginRoute() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
        </div>
        <SignIn />
      </div>
    </div>
  );
}
