import { ComingSoon } from "@/components/shared/ComingSoon";

export default async function CreatorStorefrontPage(
  props: PageProps<"/creator/[handle]">,
) {
  const { handle } = await props.params;

  return (
    <ComingSoon
      title={`@${handle}`}
      description="This creator's storefront is coming soon."
    />
  );
}
