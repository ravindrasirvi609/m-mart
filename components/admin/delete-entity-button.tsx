"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

import {
  deleteCampaignAction,
  deleteBannerAction,
  deleteCollectionAction,
  deleteProductTagAction,
  deleteServiceAreaAction,
} from "@/actions/campaign-actions";

type ActionName =
  | "deleteCampaign"
  | "deleteBanner"
  | "deleteCollection"
  | "deleteProductTag"
  | "deleteServiceArea";

const actionMap: Record<
  ActionName,
  (
    prevState: unknown,
    formData: FormData,
  ) => Promise<{ ok: boolean; error?: string; message?: string }>
> = {
  deleteCampaign: deleteCampaignAction,
  deleteBanner: deleteBannerAction,
  deleteCollection: deleteCollectionAction,
  deleteProductTag: deleteProductTagAction,
  deleteServiceArea: deleteServiceAreaAction,
};

interface DeleteEntityButtonProps {
  id: string;
  entityName: string;
  action: ActionName;
}

export function DeleteEntityButton({
  id,
  entityName,
  action: actionName,
}: DeleteEntityButtonProps) {
  const serverAction = actionMap[actionName];
  const [state, formAction, isPending] = useActionState(serverAction, null);

  useEffect(() => {
    if (state?.ok) {
      toast.success(state.message);
    } else if (state?.error) {
      toast.error(state.error);
    }
  }, [state]);

  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        if (
          !window.confirm(
            `Are you sure you want to delete this ${entityName}? This cannot be undone.`,
          )
        ) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg p-2 text-text-subtle hover:bg-rose-500/10 hover:text-rose-400 transition-colors disabled:opacity-50"
        title={`Delete ${entityName}`}
      >
        <Trash2 size={16} />
      </button>
    </form>
  );
}
