"use client";

import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Select } from "~/components/ui/select";
import { Spinner } from "~/components/shared/Spinner";
import { Icons } from "~/components/shared/Icons";

const MASTODON_INSTANCES = [
  { name: "mastodon.social", baseUrl: "https://mastodon.social" },
  { name: "mastodon.online", baseUrl: "https://mastodon.online" },
];

interface MastodonSignInProps {
  disabled?: boolean;
  isUpgrade?: boolean;
}

export function MastodonSignIn({ disabled = false, isUpgrade = false }: MastodonSignInProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedServer, setSelectedServer] = useState<string>("");

  const handleContinue = () => {
    if (!selectedServer) return;
    setIsSubmitting(true);
    const url = new URL(isUpgrade ? "/api/auth/upgrade-mastodon" : "/api/auth/mastodon", window.location.origin);
    url.searchParams.set("server", selectedServer);
    window.location.assign(url.toString());
  };

  const selectOptions = MASTODON_INSTANCES.map((instance) => ({
    label: instance.name,
    value: instance.name,
  }));

  return (
    <div>
      <Button
        type="button"
        variant={isUpgrade ? "outline" : "outline"}
        size={isUpgrade ? "sm" : "lg"}
        className={isUpgrade
          ? "inline-flex items-center gap-2 rounded-md border border-[#4F50E6] bg-[#6364FF] text-white px-3 py-1.5 text-sm font-medium transition-colors hover:bg-[#4F50E6] no-underline"
          : "w-full cursor-pointer bg-[#6364FF] text-white hover:bg-[#4F50E6] border-[#4F50E6]"
        }
        disabled={disabled}
        onClick={() => {
          setIsSubmitting(false);
          setSelectedServer("");
          setIsDialogOpen(true);
        }}
      >
        {isSubmitting && <Spinner className="w-4 h-4 mr-2" />}
        {!isSubmitting && <Icons.mastodon className="w-4 h-4 mr-2" />}
        {isUpgrade ? "Mastodon" : "Sign in with Mastodon"}
      </Button>

      {isDialogOpen && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 shadow-xl border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Choose your Mastodon server</h2>
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">
              Mastodon accounts are hosted on different servers. Choose the one you want to {isUpgrade ? "upgrade your guest account with" : "sign in with"}.
            </p>
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">
              Only listed servers are currently supported. Don't see yours? Use another {isUpgrade ? "upgrade" : "sign-in"} method or request it to be added.
            </p>

            <div className="mb-6">
              <label htmlFor="mastodon-server" className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">
                Mastodon Server
              </label>
              <Select
                id="mastodon-server"
                name="server"
                options={selectOptions}
                value={selectedServer}
                onValueChange={setSelectedServer}
                disabled={isSubmitting || disabled}
                placeholder="Select your Mastodon server..."
              />
            </div>

            <div className="flex gap-3 justify-end">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setIsSubmitting(false);
                  setIsDialogOpen(false);
                }}
                disabled={isSubmitting}
              >
                Cancel
              </Button>

              <Button
                type="button"
                onClick={handleContinue}
                disabled={isSubmitting || disabled || !selectedServer}
              >
                {isSubmitting && (
                  <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900 dark:border-gray-600 dark:border-t-white" />
                )}
                {isUpgrade ? "Upgrade with Mastodon" : "Continue"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
