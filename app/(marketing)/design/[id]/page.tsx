import { ComingSoon } from "@/components/shared/ComingSoon";

export default async function DesignDetailPage(props: PageProps<"/design/[id]">) {
  await props.params;

  return (
    <ComingSoon
      title="Design detail"
      description="The claim/purchase flow for this design is coming soon."
    />
  );
}
