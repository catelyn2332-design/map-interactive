import { Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  Copy,
  Dices,
  MoreHorizontal,
  RotateCcw,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUiStore } from "@/lib/map/ui";

export function AppHeader({
  onWander,
  onCopy,
  onReset,
  copied,
}: {
  onWander?: () => void;
  onCopy?: () => void;
  onReset?: () => void;
  copied?: boolean;
}) {
  const hasSession = Boolean(onWander || onCopy || onReset);
  const appName = useUiStore((s) => s.copy.appName);

  return (
    <div className="flex w-full items-center justify-between gap-3">
      <h1 className="min-w-0 truncate font-display text-lg font-medium tracking-[-0.03em] sm:text-xl">
        {appName}
      </h1>
      <div className="flex shrink-0 items-center gap-1">
        {hasSession ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-9"
                aria-label="Session"
              >
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onWander ? (
                <DropdownMenuItem onSelect={onWander}>
                  <Dices className="size-4" />
                  Pièce au hasard
                </DropdownMenuItem>
              ) : null}
              {onCopy ? (
                <DropdownMenuItem onSelect={onCopy}>
                  <Copy className="size-4" />
                  {copied ? "Session copiée" : "Copier la session"}
                </DropdownMenuItem>
              ) : null}
              {onReset ? (
                <DropdownMenuItem onSelect={onReset}>
                  <RotateCcw className="size-4" />
                  Réinitialiser la session
                </DropdownMenuItem>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
        <Button
          variant="outline"
          size="icon"
          className="size-9"
          aria-label="Paramètres"
          asChild
        >
          <Link to="/parametres">
            <Settings className="size-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}

export function SettingsHeader() {
  return <PageHeader title="Paramètres" />;
}

export function PageHeader({ title }: { title: string }) {
  const appName = useUiStore((s) => s.copy.appName);
  return (
    <div className="flex w-full items-center justify-between gap-3">
      <h1 className="min-w-0 truncate font-display text-lg font-medium tracking-[-0.03em] sm:text-xl">
        {title}
      </h1>
      <Button variant="outline" size="sm" asChild>
        <Link to="/">
          <ArrowLeft className="size-4" />
          {appName}
        </Link>
      </Button>
    </div>
  );
}
