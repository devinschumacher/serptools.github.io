"use client";

import ToolPageTemplate from "@/components/ToolPageTemplate";
import LanderHeroTwoColumn from "@/components/LanderHeroTwoColumn";
import { toolContent } from '@/lib/tool-content';

export default function Page() {
  const content = toolContent["mp4-to-mpeg"];
  
  if (!content) {
    // Fallback to HeroConverter for tools without content
    return (
      <LanderHeroTwoColumn
        title="MP4 to MPEG"
        subtitle="Convert MP4 video files to MPEG format"
        from="mp4"
        to="mpeg"
        videoEmbedId=""
      />
    );
  }
  
  return (
    <ToolPageTemplate
      tool={content.tool}
      videoSection={content.videoSection}
      faqs={content.faqs}
      aboutSection={content.aboutSection}
      changelog={content.changelog}
      relatedTools={content.relatedTools}
      blogPosts={content.blogPosts}
    />
  );
}
