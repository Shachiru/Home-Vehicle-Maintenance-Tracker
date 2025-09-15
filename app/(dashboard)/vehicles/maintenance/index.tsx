import { useEffect } from "react";
import { useRouter } from "expo-router";

export default function MaintenanceRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/vehicles");
  }, []);

  return null;
}
