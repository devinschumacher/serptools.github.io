"use client";

import ToolPageTemplate from "@/components/ToolPageTemplate";
import { toolContent } from "@/config/tool-content";

export default function Page() {
  const content = toolContent["png-to-gif"];
  
  if (!content) {
    return <div>Tool not found</div>;
  }
  
  return (
    <ToolPageTemplate
      tool={content.tool}
      videoSection={content.videoSection}
      useTwoColumnLayout={true}
      faqs={content.faqs}
      aboutSection={content.aboutSection}
      changelog={content.changelog}
      relatedTools={content.relatedTools}
      blogPosts={content.blogPosts}
    />
  );
}
