import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/proprietes")({
  component: () => <Navigate to="/parametres/proprietes" />,
});
