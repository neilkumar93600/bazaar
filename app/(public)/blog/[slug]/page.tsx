import { ComingSoon } from "@/components/shared/ComingSoon";

export default async function BlogPostPage(props: PageProps<"/blog/[slug]">) {
  const { slug } = await props.params;

  return (
    <ComingSoon
      title={slug}
      description="This post is coming soon."
    />
  );
}
