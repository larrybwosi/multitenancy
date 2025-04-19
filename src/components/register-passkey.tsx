// components/RegisterPasskey.tsx
"use client";

import { passkey, signIn } from "@/lib/auth/authClient";
import { useEffect, useState } from "react";

export function RegisterPasskey() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);


  const handleRegisterPasskey = async () => {
    setIsRegistering(true);
    setError(null);

    try {
      await passkey.addPasskey({
        name: "My Device", // Allow users to name their passkey
        // Optional: specify the type of authenticator
        // authenticatorAttachment: 'platform' // or 'cross-platform'
      });
      setSuccess(true);
    } catch (err) {
      setError("Failed to register passkey. Please try again.");
      console.error(err);
    } finally {
      setIsRegistering(false);
    }
  };
  useEffect(() => {
    if (
      !PublicKeyCredential.isConditionalMediationAvailable ||
      !PublicKeyCredential.isConditionalMediationAvailable()
    ) {
      return;
    }

    void signIn.passkey({ autoFill: true });
  }, []);

  return (
    <div>
      <button
        onClick={handleRegisterPasskey}
        disabled={isRegistering}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-blue-300"
      >
        {isRegistering ? "Registering..." : "Register Passkey"}
      </button>

      {error && <p className="text-red-500 mt-2">{error}</p>}
      {success && (
        <p className="text-green-500 mt-2">Passkey registered successfully!</p>
      )}
    </div>
  );
}
